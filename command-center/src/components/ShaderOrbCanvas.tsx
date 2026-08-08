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
uniform vec2 u_mouse;
uniform float u_state; // 0=idle, 1=listening, 2=processing, 3=speaking
uniform vec3 u_color;
uniform float u_speed; // particleSpeed multiplier

out vec4 fragColor;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

float fbm(vec2 p) {
  float val = 0.0;
  float amp = 0.5;
  for (int i = 0; i < 5; i++) {
    val += amp * noise(p);
    p *= 2.0;
    amp *= 0.5;
  }
  return val;
}

void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution) / min(u_resolution.x, u_resolution.y);
  
  float stateMult = u_state == 1.0 ? 3.0 : u_state == 2.0 ? 8.0 : u_state == 3.0 ? 5.0 : 1.0;
  float t = u_time * u_speed * stateMult;
  
  vec2 mouse = (u_mouse - 0.5 * u_resolution) / min(u_resolution.x, u_resolution.y);
  float mouseDist = length(uv - mouse);
  float mouseInfluence = smoothstep(0.45, 0.0, mouseDist) * 0.2;
  
  float dist = length(uv);
  
  float coreSize = 0.22 + sin(t * 1.5) * 0.02;
  float particleDensity = u_state == 2.0 ? 12.0 : u_state == 1.0 ? 8.0 : 6.0;
  float glowIntensity = u_state == 0.0 ? 0.75 : 1.25;
  
  // Outer particle ring (matching screenshot)
  float ringRadius = 0.36 + sin(t * 0.8) * 0.015;
  float ringDist = abs(dist - ringRadius);
  float ringGlow = smoothstep(0.06, 0.0, ringDist) * 0.9 * glowIntensity;
  
  // Dense particle field
  vec2 noiseCoord = uv * particleDensity + vec2(t * 0.4, t * 0.3);
  float n = fbm(noiseCoord);
  float particles = smoothstep(0.48, 0.75, n) * smoothstep(0.45, 0.1, dist);
  
  // Inner dark core with glowing rim
  float innerCore = smoothstep(coreSize + 0.01, coreSize - 0.05, dist);
  float innerGlow = exp(-dist * 3.5) * 0.5;
  
  // Outer particle aura halo
  float outerHalo = exp(-dist * 2.2) * 0.4 * glowIntensity;
  
  float totalGlow = (ringGlow + particles * 0.8 + innerGlow + outerHalo + mouseInfluence) * (1.0 - innerCore * 0.6);
  
  vec3 color = u_color * totalGlow;
  
  // Soft outer edge
  float vignette = 1.0 - smoothstep(0.35, 0.85, dist);
  color *= mix(0.25, 1.0, vignette);
  
  fragColor = vec4(color, 1.0);
}`;

export default function ShaderOrbCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glRef = useRef<WebGL2RenderingContext | null>(null);
  const programRef = useRef<WebGLProgram | null>(null);
  const animFrameRef = useRef<number>(0);
  const mouseRef = useRef<[number, number]>([0, 0]);
  const startTimeRef = useRef(performance.now());

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

    const gl = canvas.getContext('webgl2', { antialias: true, alpha: false });
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

    const stateMap = { IDLE: 0, LISTENING: 1, PROCESSING: 2, SPEAKING: 3, ERROR: 0 };
    const stateVal = stateMap[voiceStateRef.current] || 0;

    const colors = THEME_COLORS[themeRef.current];
    const hex = colors.primary;
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;

    gl.uniform2f(gl.getUniformLocation(program, 'u_resolution'), canvas.width, canvas.height);
    gl.uniform1f(gl.getUniformLocation(program, 'u_time'), elapsed);
    gl.uniform2f(gl.getUniformLocation(program, 'u_mouse'), mouseRef.current[0], mouseRef.current[1]);
    gl.uniform1f(gl.getUniformLocation(program, 'u_state'), stateVal);
    gl.uniform3f(gl.getUniformLocation(program, 'u_color'), r, g, b);
    gl.uniform1f(gl.getUniformLocation(program, 'u_speed'), speedRef.current);

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
        const dpr = Math.min(window.devicePixelRatio, 2);
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
      }
    });

    observer.observe(parent);
    return () => observer.disconnect();
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio, 2);
    mouseRef.current = [
      (e.clientX - rect.left) * dpr,
      (rect.height - (e.clientY - rect.top)) * dpr,
    ];
  }, []);

  return (
    <canvas
      ref={canvasRef}
      onMouseMove={handleMouseMove}
      className="w-full h-full block"
      style={{ background: '#141416' }}
    />
  );
}
