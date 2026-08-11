import { useRef, useEffect, useCallback } from 'react';
import { useApp, THEME_COLORS } from '../context/AppContext';

const VERTEX_SHADER = `#version 300 es
in vec4 a_position;
void main() {
  gl_Position = a_position;
}`;

const FRAGMENT_SHADER = `#version 300 es
precision highp float;

uniform vec2 u_resolution;
uniform float u_time;
uniform float u_state; // 0=idle, 1=listening, 2=processing, 3=speaking
uniform vec3 u_color;
uniform float u_speed;
uniform vec2 u_mouse; // accumulated mouse-driven rotation (x=horizontal, y=vertical)

out vec4 fragColor;

// -----------------------------------------------------------------------------
// JON REFERENCE ORB — PREMIUM EDITION
// Enhanced with: subsurface scattering, specular highlights, fresnel rim,
// chromatic aberration halo, drop shadow depth, iridescent detail,
// volumetric god-rays, and refined tone mapping for a "popping out of screen" look.
// -----------------------------------------------------------------------------

float hash11(float p) {
    p = fract(p * 0.1031);
    p *= p + 33.33;
    p *= p + p;
    return fract(p);
}

float hash21(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * 0.1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
}

float noise3D(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);

    float n = i.x + i.y * 157.0 + i.z * 113.0;

    float a = hash11(n);
    float b = hash11(n + 1.0);
    float c = hash11(n + 157.0);
    float d = hash11(n + 158.0);
    float e = hash11(n + 113.0);
    float f1 = hash11(n + 114.0);
    float g = hash11(n + 270.0);
    float h = hash11(n + 271.0);

    float x1 = mix(a, b, f.x);
    float x2 = mix(c, d, f.x);
    float x3 = mix(e, f1, f.x);
    float x4 = mix(g, h, f.x);

    return mix(mix(x1, x2, f.y), mix(x3, x4, f.y), f.z);
}

float fbm3D(vec3 p) {
    float value = 0.0;
    float amplitude = 0.5;
    for (int i = 0; i < 6; i++) {
        value += amplitude * noise3D(p);
        p *= 2.03;
        amplitude *= 0.48;
    }
    return value;
}

// Warped domain fbm for more organic movement
float warpedFbm(vec3 p, float t) {
    vec3 q = vec3(
        fbm3D(p + vec3(0.0, 0.0, 0.0)),
        fbm3D(p + vec3(5.2, 1.3, 2.8)),
        fbm3D(p + vec3(1.7, 9.2, 3.4))
    );
    return fbm3D(p + 3.8 * q + vec3(t * 0.012, -t * 0.008, t * 0.015));
}

void main() {
    vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution) /
              min(u_resolution.x, u_resolution.y);

    float stateSpeed =
        u_state == 1.0 ? 1.10 :
        u_state == 2.0 ? 1.45 :
        u_state == 3.0 ? 1.25 : 0.72;

    float t = u_time * u_speed * stateSpeed;

    // Subtle floating motion
    vec2 orbCenter = vec2(
        sin(t * 0.31) * 0.003,
        0.105 + sin(t * 0.72) * 0.010
    );

    vec2 p = uv - orbCenter;
    float dist = length(p);

    float R = 0.215;

    vec3 cyan = u_color;
    cyan = mix(vec3(0.0, 0.82, 1.0), cyan, 0.22);
    vec3 brightCyan = vec3(0.0, 0.95, 1.0);
    vec3 white = vec3(1.0);

    vec3 finalColor = vec3(0.0);

    // -------------------------------------------------------------------------
    // DROP SHADOW — Sells the "popping out of screen" depth
    // A soft, large, dark shadow cast below and behind the orb
    // -------------------------------------------------------------------------
    vec2 shadowOffset = vec2(0.0, -0.04);
    vec2 shadowP = uv - orbCenter - shadowOffset;
    float shadowDist = length(shadowP * vec2(1.0, 0.6)); // elliptical
    float shadow = exp(-pow(shadowDist / 0.22, 2.0)) * 0.35;
    // Darken the background where the shadow falls (only outside orb)
    if (dist > R) {
        finalColor -= vec3(shadow);
    }

    // -------------------------------------------------------------------------
    // MULTI-LAYERED ATMOSPHERE / OUTER AURA — "popping out" halo
    // -------------------------------------------------------------------------
    // Tight bright rim glow
    float rimGlow = exp(-pow((dist - R) / 0.012, 2.0));
    // Medium atmosphere
    float midGlow = exp(-pow((dist - R) / 0.045, 2.0));
    // Wide soft ambient
    float wideGlow = exp(-pow((dist - R) / 0.11, 2.0));
    // Very wide subtle bloom
    float bloomGlow = exp(-pow((dist - R) / 0.22, 2.0));

    finalColor += brightCyan * rimGlow * 0.55;
    finalColor += cyan * midGlow * 0.18;
    finalColor += cyan * wideGlow * 0.06;
    finalColor += cyan * bloomGlow * 0.018;

    // Chromatic aberration halo — cool cyan/blue tones only (no red)
    float caG = exp(-pow((dist - R * 1.02) / 0.016, 2.0));
    float caB = exp(-pow((dist - R * 1.008) / 0.014, 2.0));
    finalColor += vec3(0.0, caG * 0.12, caB * 0.20);

    // -------------------------------------------------------------------------
    // ORB BODY — Enhanced with SSS, specular, iridescence
    // -------------------------------------------------------------------------
    if (dist < R) {
        float z = sqrt(max(0.0, R * R - dist * dist));
        vec3 spherePos = vec3(p.x, p.y, z);
        vec3 normal = normalize(spherePos);
        vec3 viewDir = vec3(0.0, 0.0, 1.0);

        float ndv = max(dot(normal, viewDir), 0.0);
        float edge = pow(1.0 - ndv, 2.8);

        // Light directions for depth
        vec3 lightDir1 = normalize(vec3(0.4, 0.6, 0.8));
        vec3 lightDir2 = normalize(vec3(-0.3, -0.2, 0.7));
        float ndl1 = max(dot(normal, lightDir1), 0.0);
        float ndl2 = max(dot(normal, lightDir2), 0.0);

        // ----- Volumetric flow (cursor-reactive spin) -----
        vec3 flowPos = spherePos * 5.2;

        // Base auto-rotation + mouse-driven rotation on XY plane
        float angleXY = t * 0.055 + u_mouse.x * 5.0;
        float cxy = cos(angleXY), sxy = sin(angleXY);
        flowPos.xy *= mat2(cxy, -sxy, sxy, cxy);

        // Mouse-driven tilt on XZ plane (vertical cursor movement)
        float angleXZ = u_mouse.y * 5.0;
        float cxz = cos(angleXZ), sxz = sin(angleXZ);
        flowPos.xz *= mat2(cxz, -sxz, sxz, cxz);

        flowPos += vec3(t * 0.025, -t * 0.018, t * 0.035);

        float n1 = fbm3D(flowPos);
        float n2 = fbm3D(flowPos * 1.72 + vec3(7.1, -3.2, 4.6));
        float n3 = fbm3D(flowPos * 3.15 - vec3(2.5, 4.1, -5.7));

        // Warped domain noise for organic plasma flow
        float nWarp = warpedFbm(spherePos * 3.5, t);

        float clouds = smoothstep(0.40, 0.68, n1);
        float cloudFine = smoothstep(0.48, 0.74, n2);
        float micro = smoothstep(0.50, 0.80, n3);
        float plasma = smoothstep(0.42, 0.72, nWarp);

        // ----- Particle / spark field -----
        float grainA = smoothstep(
            0.72, 0.93,
            noise3D(spherePos * 42.0 + vec3(t * 0.035, -t * 0.025, t * 0.02))
        );
        float grainB = smoothstep(
            0.78, 0.95,
            noise3D(spherePos * 82.0 + vec3(-t * 0.02, t * 0.03, t * 0.018))
        );
        float grainC = smoothstep(
            0.83, 0.98,
            noise3D(spherePos * 145.0 + vec3(t * 0.015, t * 0.01, -t * 0.022))
        );
        // Ultra-fine sparkle layer
        float grainD = smoothstep(
            0.88, 0.995,
            noise3D(spherePos * 280.0 + vec3(-t * 0.01, t * 0.008, t * 0.012))
        );

        float particles =
            grainA * (0.30 + clouds * 0.45) +
            grainB * (0.18 + cloudFine * 0.32) +
            grainC * (0.10 + micro * 0.24) +
            grainD * 0.35;

        // ----- Continental / landmass structures -----
        float landMass =
            smoothstep(0.49, 0.70, n1) *
            smoothstep(0.40, 0.76, n2);

        // ----- Base body color -----
        vec3 deep = vec3(0.001, 0.008, 0.015);
        vec3 bodyCyan = vec3(0.0, 0.22, 0.30);

        vec3 body = mix(deep, bodyCyan, landMass * 0.48);
        body += brightCyan * particles * 0.65;
        body += cyan * clouds * 0.07;
        body += cyan * plasma * 0.04;

        // ----- Subsurface scattering (SSS) -----
        // Fakes light penetrating the orb surface for a translucent, glassy look
        float sssAmount = pow(1.0 - ndv, 3.0) * 0.4;
        vec3 sssColor = mix(cyan, brightCyan, 0.5);
        float sssNoise = fbm3D(spherePos * 8.0 + vec3(t * 0.03));
        body += sssColor * sssAmount * (0.6 + sssNoise * 0.4);

        // Backlit translucency on edges
        float backlight = pow(max(dot(normal, -lightDir1), 0.0), 2.0);
        body += sssColor * backlight * 0.12;

        // ----- Specular highlights (Blinn-Phong) -----
        vec3 halfDir1 = normalize(lightDir1 + viewDir);
        vec3 halfDir2 = normalize(lightDir2 + viewDir);
        float spec1 = pow(max(dot(normal, halfDir1), 0.0), 64.0);
        float spec2 = pow(max(dot(normal, halfDir2), 0.0), 48.0);

        // Micro-specular for wet/glassy look
        float microSpec = pow(max(dot(normal, halfDir1), 0.0), 256.0);

        body += white * spec1 * 0.45;
        body += (cyan * 0.5 + white * 0.5) * spec2 * 0.15;
        body += white * microSpec * 0.30;

        // ----- Iridescent surface detail (cool cyan spectrum only) -----
        float iriAngle = dot(normal, viewDir);
        vec3 iridescence = vec3(
            0.0,
            0.5 + 0.5 * sin(iriAngle * 12.0 + t * 0.5 + 1.5),
            0.6 + 0.4 * sin(iriAngle * 12.0 + t * 0.5 + 0.0)
        );
        body += iridescence * 0.03 * (1.0 - ndv);

        // ----- Fresnel rim -----
        float rim = smoothstep(0.65, 0.99, edge);
        float rimPulse = 0.85 + 0.15 * sin(t * 2.5);
        body += brightCyan * rim * 1.1 * rimPulse;

        // Hot edge line
        float edgeLine = exp(-pow((dist - R * 0.995) / 0.003, 2.0));
        body += white * edgeLine * 0.8;
        body += brightCyan * edgeLine * 1.2;

        // ----- Directional illumination for 3D depth -----
        body += cyan * ndl1 * 0.08;
        body += cyan * ndl2 * 0.03;
        float topLight = smoothstep(-0.3, 0.8, normal.y);
        body += cyan * topLight * 0.05;

        // Center darkening for structure readability
        body *= mix(0.55, 1.0, ndv);

        // Inner glow / core hotspot — pushed slightly off-center top-left for 3D
        vec2 hotOffset = vec2(-0.04, 0.05);
        float hotDist = length(p - hotOffset * R);
        float coreHot = exp(-pow(hotDist / (R * 0.35), 2.0));
        body += brightCyan * coreHot * 0.08;

        finalColor += body;
    }

    // -------------------------------------------------------------------------
    // FLOATING DUST / PARTICLES AROUND THE ORB
    // -------------------------------------------------------------------------
    float particleField = 0.0;

    for (int i = 0; i < 100; i++) {
        float fi = float(i);
        float seed = fi * 17.731 + 4.123;

        float radius = R * (1.02 + hash11(seed) * 1.25);

        float speed =
            (0.06 + hash11(seed + 1.0) * 0.20) *
            (hash11(seed + 2.0) > 0.5 ? 1.0 : -1.0);

        float pAngle =
            hash11(seed + 3.0) * 6.28318530718 +
            t * speed;

        float yScale = 0.38 + hash11(seed + 4.0) * 0.35;

        vec2 particlePos = orbCenter + vec2(
            cos(pAngle) * radius,
            sin(pAngle) * radius * yScale
        );

        float d = length(uv - particlePos);
        float size = 0.0006 + hash11(seed + 5.0) * 0.0013;

        // Soft glow particles
        float dotParticle =
            1.0 - smoothstep(size * 0.15, size, d);
        float glowParticle =
            exp(-pow(d / (size * 3.0), 2.0));

        float proximity =
            1.0 - smoothstep(R * 1.02, R * 2.2, radius);

        float front =
            0.50 + 0.50 * step(0.0, sin(pAngle));

        // Twinkle
        float twinkle = 0.7 + 0.3 * sin(t * (3.0 + hash11(seed + 7.0) * 5.0) + fi);

        particleField +=
            (dotParticle * 0.8 + glowParticle * 0.25) *
            (0.10 + hash11(seed + 6.0) * 0.35) *
            proximity * front * twinkle;
    }

    finalColor += cyan * particleField;

    // -------------------------------------------------------------------------
    // HOLOGRAPHIC PLATFORM DIRECTLY BELOW THE ORB
    // -------------------------------------------------------------------------
    vec2 ringP = uv - vec2(orbCenter.x, orbCenter.y - 0.315);

    vec2 ringQ = vec2(ringP.x, ringP.y * 4.75);
    float ringDist = length(ringQ);

    float ring1 = exp(-pow((ringDist - 0.285) / 0.005, 2.0));
    float ring2 = exp(-pow((ringDist - 0.235) / 0.0035, 2.0));
    float ring3 = exp(-pow((ringDist - 0.175) / 0.0025, 2.0));
    float ring4 = exp(-pow((ringDist - 0.135) / 0.002, 2.0));

    float scan =
        0.5 + 0.5 * sin(atan(ringP.y * 4.75, ringP.x) * 18.0 - t * 2.0);

    float platform =
        (ring1 * 0.22 + ring2 * 0.16 + ring3 * 0.12 + ring4 * 0.08) *
        (0.60 + scan * 0.40);

    float pool = exp(
        -pow(ringP.x / 0.31, 2.0)
        -pow(ringP.y / 0.075, 2.0)
    );

    finalColor += cyan * platform;
    finalColor += cyan * pool * 0.06;

    // Energy column connecting orb to platform
    float beam =
        exp(-pow(ringP.x / 0.015, 2.0)) *
        exp(-pow(ringP.y / 0.18, 2.0));
    float beamPulse = 0.7 + 0.3 * sin(t * 3.5);
    finalColor += cyan * beam * 0.035 * beamPulse;

    // -------------------------------------------------------------------------
    // GOD RAYS — Volumetric light shafts from the orb
    // -------------------------------------------------------------------------
    float rayAngle = atan(p.y, p.x);
    float rays = 0.0;
    for (int i = 0; i < 6; i++) {
        float fi = float(i);
        float rAngle = fi * 1.0472 + t * 0.08; // 60° apart, slowly rotating
        float angleDiff = abs(mod(rayAngle - rAngle + 3.14159, 6.28318) - 3.14159);
        float ray = exp(-pow(angleDiff / 0.06, 2.0));
        float rayFade = exp(-pow((dist - R) / 0.15, 1.5));
        rays += ray * rayFade * 0.03;
    }
    if (dist > R * 0.98) {
        finalColor += cyan * rays;
    }

    // -------------------------------------------------------------------------
    // VIGNETTE — darken corners to focus attention on orb (depth of field feel)
    // -------------------------------------------------------------------------
    float vignette = 1.0 - smoothstep(0.3, 0.75, length(uv));
    finalColor *= 0.85 + vignette * 0.15;

    // -------------------------------------------------------------------------
    // PREMIUM TONE MAPPING & COLOR GRADING
    // -------------------------------------------------------------------------
    // Reinforce the outer glow
    finalColor += cyan * rimGlow * 0.08;

    // ACES-inspired filmic tone mapping for richer contrast
    // Clamp to zero first — negative values (from shadow) would flip positive in ACES
    finalColor = max(finalColor, vec3(0.0));
    vec3 x = finalColor;
    finalColor = (x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14);

    // Slight color boost
    finalColor = pow(clamp(finalColor, 0.0, 1.0), vec3(0.92));

    // Subtle bloom overlay for dreamy depth
    float bloomMask = exp(-pow(dist / 0.25, 2.0)) * 0.04;
    finalColor += cyan * bloomMask;

    fragColor = vec4(finalColor, 1.0);
}
`;

export default function ShaderOrbCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glRef = useRef<WebGL2RenderingContext | null>(null);
  const programRef = useRef<WebGLProgram | null>(null);
  const animFrameRef = useRef<number>(0);
  const startTimeRef = useRef(performance.now());

  // Mouse-driven rotation tracking
  const mouseRotRef = useRef({ x: 0, y: 0 });         // smoothed accumulated rotation
  const mouseVelRef = useRef({ x: 0, y: 0 });          // current velocity (from mouse delta)
  const lastMouseRef = useRef({ x: 0, y: 0, set: false }); // last mouse position

  const { voiceState, theme, settings } = useApp();
  const voiceStateRef = useRef(voiceState);
  const themeRef = useRef(theme);
  const speedRef = useRef(settings.particleSpeed);

  useEffect(() => { voiceStateRef.current = voiceState; }, [voiceState]);
  useEffect(() => { themeRef.current = theme; }, [theme]);
  useEffect(() => { speedRef.current = settings.particleSpeed; }, [settings.particleSpeed]);

  const createShader = useCallback((gl: WebGL2RenderingContext, type: number, source: string) => {
    const shader = gl.createShader(type);
    if (!shader) return null;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error('Shader compile error:', gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  }, []);

  const initGL = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl2', { antialias: true, alpha: true, premultipliedAlpha: false });
    if (!gl) return;
    glRef.current = gl;

    const vs = createShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
    const fs = createShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
    if (!vs || !fs) return;

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Program link error:', gl.getProgramInfoLog(program));
      return;
    }

    programRef.current = program;

    const positions = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

    const posLoc = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);
  }, [createShader]);

  const render = useCallback(() => {
    const gl = glRef.current;
    const program = programRef.current;
    const canvas = canvasRef.current;
    if (!gl || !program || !canvas) return;

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.useProgram(program);

    const elapsed = (performance.now() - startTimeRef.current) / 1000;

    const stateMap: Record<string, number> = { IDLE: 0, LISTENING: 1, PROCESSING: 2, SPEAKING: 3, ERROR: 0 };
    const stateVal = stateMap[voiceStateRef.current] || 0;

    const colors = THEME_COLORS[themeRef.current] || THEME_COLORS.cyan;
    const hex = colors.primary;
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;

    // Smooth the mouse velocity into accumulated rotation, then decay velocity
    const vel = mouseVelRef.current;
    const rot = mouseRotRef.current;
    rot.x += vel.x * 0.05;   // integrate velocity into rotation (high responsiveness)
    rot.y += vel.y * 0.05;
    vel.x *= 0.95;  // gentle friction — momentum carries further
    vel.y *= 0.95;
    // Kill tiny residual
    if (Math.abs(vel.x) < 0.001) vel.x = 0;
    if (Math.abs(vel.y) < 0.001) vel.y = 0;

    gl.uniform2f(gl.getUniformLocation(program, 'u_resolution'), canvas.width, canvas.height);
    gl.uniform1f(gl.getUniformLocation(program, 'u_time'), elapsed);
    gl.uniform1f(gl.getUniformLocation(program, 'u_state'), stateVal);
    gl.uniform3f(gl.getUniformLocation(program, 'u_color'), r, g, b);
    gl.uniform1f(gl.getUniformLocation(program, 'u_speed'), speedRef.current);
    gl.uniform2f(gl.getUniformLocation(program, 'u_mouse'), rot.x, rot.y);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    animFrameRef.current = requestAnimationFrame(render);
  }, []);

  useEffect(() => {
    initGL();
    animFrameRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [initGL, render]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;

    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        const dpr = Math.min(window.devicePixelRatio, 3);
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
      }
    });

    observer.observe(parent);
    return () => observer.disconnect();
  }, []);

  // Mouse tracking for cursor-reactive spin
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const onMouseMove = (e: MouseEvent) => {
      const last = lastMouseRef.current;
      if (last.set) {
        const dx = e.clientX - last.x;
        const dy = e.clientY - last.y;
        // Convert pixel delta to rotation velocity (scaled for feel)
        mouseVelRef.current.x += dx * 0.025;
        mouseVelRef.current.y += -dy * 0.025; // invert Y so up = up
      }
      last.x = e.clientX;
      last.y = e.clientY;
      last.set = true;
    };

    const onMouseLeave = () => {
      lastMouseRef.current.set = false;
    };

    // Listen on the parent container so cursor detection covers the full orb area
    const target = canvas.parentElement || canvas;
    target.addEventListener('mousemove', onMouseMove);
    target.addEventListener('mouseleave', onMouseLeave);
    return () => {
      target.removeEventListener('mousemove', onMouseMove);
      target.removeEventListener('mouseleave', onMouseLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full block"
      style={{ background: 'transparent' }}
    />
  );
}
