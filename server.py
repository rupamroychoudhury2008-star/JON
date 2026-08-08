import json
import os
import time
import mimetypes
import urllib.parse
from pathlib import Path
from http.server import HTTPServer, BaseHTTPRequestHandler
from socketserver import ThreadingMixIn
from config.settings import settings
from orchestrator import JonOrchestrator
from io_layer.input_handler import InputHandler
from router.ollama_client import OllamaClient
from router.network_detector import is_network_available
from memory.promoter import MemoryPromoter
from memory.obsidian_vault import ObsidianVault

DIST_DIR = Path(__file__).parent / "command-center" / "dist"

orchestrator = JonOrchestrator()
input_handler = InputHandler()
vault = ObsidianVault()

INDEX_HTML = """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Jon — Modern Hybrid AI Assistant</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; }
        
        body {
            background: #eef2f7;
            color: #1e293b;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            overflow: hidden;
            font-size: 14px;
        }

        /* 3D Skeuomorphic App Container */
        .app-container {
            width: 100%;
            max-width: 900px;
            height: 92vh;
            background: linear-gradient(145deg, #ffffff, #ebf0f7);
            border: 1px solid rgba(255, 255, 255, 0.9);
            border-radius: 24px;
            display: flex;
            flex-direction: column;
            box-shadow: 10px 10px 30px #cbd5e1, -10px -10px 30px #ffffff;
            overflow: hidden;
        }

        /* Header Bar */
        .top-header {
            padding: 16px 24px;
            background: linear-gradient(145deg, #ffffff, #eef2f7);
            border-bottom: 1px solid #d1d9e6;
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
            gap: 12px;
            box-shadow: 0 4px 10px rgba(0,0,0,0.02);
        }

        .brand {
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .brand-icon {
            font-size: 1.6rem;
            filter: drop-shadow(1px 2px 3px rgba(0,0,0,0.15));
        }

        .brand-title {
            font-size: 1.25rem;
            font-weight: 800;
            color: #0f172a;
            letter-spacing: -0.02em;
            text-shadow: 1px 1px 0px #ffffff;
        }

        .status-group {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-left: 10px;
        }

        /* 3D Pill Status Badges */
        .badge-3d {
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 0.75rem;
            font-weight: 700;
            display: inline-flex;
            align-items: center;
            gap: 6px;
            letter-spacing: 0.02em;
            box-shadow: inset 1px 1px 2px rgba(255,255,255,0.8), 2px 2px 5px rgba(0,0,0,0.08);
        }

        .dot {
            width: 7px;
            height: 7px;
            border-radius: 50%;
        }

        .badge-online {
            background: linear-gradient(145deg, #d1fae5, #a7f3d0);
            color: #047857;
            border: 1px solid #6ee7b7;
        }
        .badge-online .dot { background: #10b981; box-shadow: 0 0 6px #10b981; }

        .badge-offline {
            background: linear-gradient(145deg, #fee2e2, #fca5a5);
            color: #b91c1c;
            border: 1px solid #f87171;
        }
        .badge-offline .dot { background: #ef4444; box-shadow: 0 0 6px #ef4444; }

        /* Controls & Custom Toggle Switches */
        .controls-bar {
            display: flex;
            align-items: center;
            gap: 16px;
        }

        .toggle-item {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 0.82rem;
            font-weight: 600;
            color: #475569;
            user-select: none;
            cursor: pointer;
            text-shadow: 1px 1px 0px #ffffff;
        }

        .switch {
            position: relative;
            display: inline-block;
            width: 38px;
            height: 22px;
        }

        .switch input {
            opacity: 0;
            width: 0;
            height: 0;
        }

        .slider {
            position: absolute;
            cursor: pointer;
            top: 0; left: 0; right: 0; bottom: 0;
            background: #cbd5e1;
            box-shadow: inset 2px 2px 5px #94a3b8, inset -2px -2px 5px #ffffff;
            transition: .3s ease;
            border-radius: 22px;
        }

        .slider:before {
            position: absolute;
            content: "";
            height: 16px;
            width: 16px;
            left: 3px;
            bottom: 3px;
            background: linear-gradient(145deg, #ffffff, #e2e8f0);
            box-shadow: 2px 2px 4px rgba(0,0,0,0.2);
            transition: .3s ease;
            border-radius: 50%;
        }

        input:checked + .slider {
            background: linear-gradient(145deg, #0284c7, #0369a1);
            box-shadow: inset 2px 2px 5px #0284c7;
        }

        input:checked + .slider:before {
            transform: translateX(16px);
        }

        /* Chat Body */
        .chat-body {
            flex: 1;
            padding: 24px;
            overflow-y: auto;
            display: flex;
            flex-direction: column;
            gap: 16px;
            background: #eef2f7;
            scroll-behavior: smooth;
        }

        .chat-body::-webkit-scrollbar {
            width: 6px;
        }
        .chat-body::-webkit-scrollbar-thumb {
            background: #cbd5e1;
            border-radius: 3px;
        }

        .msg {
            max-width: 82%;
            padding: 14px 18px;
            border-radius: 18px;
            font-size: 0.95rem;
            line-height: 1.6;
            white-space: pre-wrap;
            animation: fadeIn 0.25s ease-out;
        }

        .msg pre {
            background: #0f172a;
            color: #f8fafc;
            padding: 12px 16px;
            border-radius: 10px;
            overflow-x: auto;
            margin: 8px 0;
            font-family: 'Consolas', 'Courier New', monospace;
            font-size: 0.85rem;
            box-shadow: inset 3px 3px 6px #020617;
        }
        .msg code {
            font-family: 'Consolas', 'Courier New', monospace;
            background: rgba(2, 132, 199, 0.15);
            color: #0284c7;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 0.88rem;
            font-weight: 600;
        }

        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(6px); }
            to { opacity: 1; transform: translateY(0); }
        }

        .user-msg {
            background: linear-gradient(145deg, #0284c7, #0369a1);
            color: #ffffff;
            align-self: flex-end;
            border-bottom-right-radius: 4px;
            box-shadow: 5px 5px 14px #cbd5e1, -3px -3px 8px #ffffff;
            text-shadow: 0 1px 2px rgba(0,0,0,0.2);
        }

        .jon-msg {
            background: linear-gradient(145deg, #ffffff, #f0f4f9);
            border: 1px solid rgba(255,255,255,0.9);
            color: #1e293b;
            align-self: flex-start;
            border-bottom-left-radius: 4px;
            box-shadow: 6px 6px 16px #d1d9e6, -6px -6px 16px #ffffff;
        }

        .route-tag {
            font-size: 0.73rem;
            color: #0284c7;
            margin-top: 8px;
            display: inline-block;
            font-weight: 700;
            background: #e0f2fe;
            padding: 2px 8px;
            border-radius: 10px;
            border: 1px solid #bae6fd;
        }

        /* 3D Skeuomorphic Input Bar */
        .input-bar {
            padding: 18px 24px;
            background: linear-gradient(145deg, #f5f8fc, #e3e8f0);
            border-top: 1px solid #d1d9e6;
            display: flex;
            gap: 12px;
            align-items: center;
        }

        .input-3d {
            flex: 1;
            background: #eef2f7;
            border: 1px solid #cbd5e1;
            border-radius: 16px;
            padding: 14px 18px;
            color: #1e293b;
            outline: none;
            font-size: 0.95rem;
            font-weight: 500;
            box-shadow: inset 4px 4px 8px #d1d9e6, inset -4px -4px 8px #ffffff;
            transition: all 0.2s ease;
        }
        .input-3d:focus {
            border-color: #0284c7;
            box-shadow: inset 4px 4px 8px #d1d9e6, 0 0 0 3px rgba(2, 132, 199, 0.25);
        }

        /* Tactile 3D Skeuomorphic Buttons */
        .btn-3d {
            background: linear-gradient(145deg, #ffffff, #e0e7f1);
            border: 1px solid rgba(255,255,255,0.8);
            border-radius: 14px;
            color: #1e293b;
            padding: 12px 22px;
            font-weight: 700;
            font-size: 0.92rem;
            cursor: pointer;
            box-shadow: 4px 4px 10px #d1d9e6, -4px -4px 10px #ffffff;
            transition: all 0.15s ease;
            text-shadow: 1px 1px 0px #ffffff;
            display: inline-flex;
            align-items: center;
            gap: 8px;
            user-select: none;
        }
        .btn-3d:hover {
            background: linear-gradient(145deg, #f8fafc, #d5dfed);
            transform: translateY(-1px);
            box-shadow: 5px 5px 12px #c9d3e3, -5px -5px 12px #ffffff;
        }
        .btn-3d:active {
            transform: translateY(1px);
            box-shadow: inset 3px 3px 6px #cbd5e1, inset -3px -3px 6px #ffffff;
        }

        .btn-primary-3d {
            background: linear-gradient(145deg, #0284c7, #0369a1);
            color: #ffffff;
            border: 1px solid rgba(255,255,255,0.3);
            text-shadow: 0 1px 2px rgba(0,0,0,0.3);
            box-shadow: 4px 4px 10px #cbd5e1, -4px -4px 10px #ffffff, 0 4px 12px rgba(2, 132, 199, 0.3);
        }
        .btn-primary-3d:hover {
            background: linear-gradient(145deg, #0369a1, #075985);
            box-shadow: 5px 5px 14px #b0c0d6, -5px -5px 14px #ffffff, 0 6px 16px rgba(2, 132, 199, 0.4);
        }
        .btn-primary-3d:active {
            background: linear-gradient(145deg, #075985, #0369a1);
            box-shadow: inset 3px 3px 6px #0369a1, inset -3px -3px 6px #0284c7;
        }

        .btn-active-mic {
            background: linear-gradient(145deg, #ef4444, #dc2626) !important;
            color: #ffffff !important;
            border: 1px solid #f87171 !important;
            text-shadow: 0 1px 2px rgba(0,0,0,0.3) !important;
            box-shadow: 0 0 18px rgba(239, 68, 68, 0.6), inset 2px 2px 5px #b91c1c !important;
            animation: pulse3d 1.5s infinite;
        }
        @keyframes pulse3d {
            0%, 100% { transform: scale(1); box-shadow: 0 0 18px rgba(239, 68, 68, 0.6); }
            50% { transform: scale(1.03); box-shadow: 0 0 26px rgba(239, 68, 68, 0.85); }
        }

        /* ===== Floating AI Orb ===== */
        .orb-wrap {
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 8px 0 4px 0;
            pointer-events: none;
        }

        .ai-orb {
            width: 56px;
            height: 56px;
            border-radius: 50%;
            background: radial-gradient(circle at 35% 35%, #ffffff 0%, #b8d4f0 40%, #7db4e0 70%, #4a9ad4 100%);
            box-shadow:
                6px 6px 16px #c0cdd9,
                -6px -6px 16px #ffffff,
                inset 2px 2px 6px rgba(255,255,255,0.7),
                0 0 20px rgba(2, 132, 199, 0.15);
            transition: width 0.6s cubic-bezier(0.34, 1.56, 0.64, 1),
                        height 0.6s cubic-bezier(0.34, 1.56, 0.64, 1),
                        box-shadow 0.5s ease,
                        background 0.5s ease;
            animation: orbFloat 4s ease-in-out infinite;
            position: relative;
        }

        .ai-orb::after {
            content: '';
            position: absolute;
            top: 12%;
            left: 18%;
            width: 30%;
            height: 22%;
            background: radial-gradient(ellipse, rgba(255,255,255,0.85) 0%, transparent 70%);
            border-radius: 50%;
            transform: rotate(-20deg);
        }

        @keyframes orbFloat {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-6px); }
        }

        /* Listening: shrink + red pulse */
        .ai-orb.orb-listening {
            width: 36px;
            height: 36px;
            background: radial-gradient(circle at 35% 35%, #fecaca 0%, #f87171 40%, #ef4444 70%, #dc2626 100%);
            box-shadow:
                4px 4px 10px #c0cdd9,
                -4px -4px 10px #ffffff,
                inset 1px 1px 4px rgba(255,255,255,0.5),
                0 0 24px rgba(239, 68, 68, 0.5);
            animation: orbListenPulse 1.2s ease-in-out infinite;
        }

        @keyframes orbListenPulse {
            0%, 100% { transform: scale(1); box-shadow: 4px 4px 10px #c0cdd9, -4px -4px 10px #ffffff, 0 0 18px rgba(239, 68, 68, 0.4); }
            50% { transform: scale(0.88); box-shadow: 3px 3px 8px #c0cdd9, -3px -3px 8px #ffffff, 0 0 30px rgba(239, 68, 68, 0.7); }
        }

        /* Responding: expand + blue glow */
        .ai-orb.orb-responding {
            width: 80px;
            height: 80px;
            background: radial-gradient(circle at 35% 35%, #e0f2fe 0%, #7dd3fc 30%, #0ea5e9 60%, #0284c7 100%);
            box-shadow:
                8px 8px 20px #b0c0d6,
                -8px -8px 20px #ffffff,
                inset 2px 2px 8px rgba(255,255,255,0.6),
                0 0 35px rgba(2, 132, 199, 0.45),
                0 0 60px rgba(2, 132, 199, 0.15);
            animation: orbRespondPulse 2s ease-in-out infinite;
        }

        @keyframes orbRespondPulse {
            0%, 100% { transform: scale(1); box-shadow: 8px 8px 20px #b0c0d6, -8px -8px 20px #ffffff, 0 0 35px rgba(2, 132, 199, 0.45); }
            50% { transform: scale(1.06); box-shadow: 10px 10px 24px #a0b5cc, -10px -10px 24px #ffffff, 0 0 50px rgba(2, 132, 199, 0.6); }
        }

        /* ===== Collapsible Sidebar ===== */
        .menu-btn {
            background: linear-gradient(145deg, #ffffff, #e0e7f1);
            border: 1px solid rgba(255,255,255,0.8);
            border-radius: 10px;
            padding: 6px 12px;
            font-size: 0.85rem;
            font-weight: 700;
            cursor: pointer;
            box-shadow: 3px 3px 6px #cbd5e1, -3px -3px 6px #ffffff;
            transition: all 0.15s ease;
            display: inline-flex;
            align-items: center;
            gap: 6px;
            color: #1e293b;
        }
        .menu-btn:hover { background: #f8fafc; transform: translateY(-1px); }

        .sidebar-overlay {
            position: fixed;
            top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(15, 23, 42, 0.4);
            backdrop-filter: blur(4px);
            z-index: 99;
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.3s ease;
        }
        .sidebar-overlay.active {
            opacity: 1;
            pointer-events: auto;
        }

        .sidebar {
            position: absolute;
            top: 0; left: 0;
            width: 320px;
            height: 100%;
            background: linear-gradient(160deg, #ffffff, #ebf0f7);
            border-right: 1px solid #cbd5e1;
            box-shadow: 8px 0 24px rgba(0,0,0,0.12);
            z-index: 100;
            transform: translateX(-100%);
            transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
            display: flex;
            flex-direction: column;
            padding: 20px;
            gap: 20px;
            overflow-y: auto;
        }
        .sidebar.active {
            transform: translateX(0);
        }

        .sidebar-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid #cbd5e1;
            padding-bottom: 12px;
        }
        .sidebar-title {
            font-size: 1.1rem;
            font-weight: 800;
            color: #0f172a;
        }
        .close-sidebar-btn {
            background: none;
            border: none;
            font-size: 1.3rem;
            cursor: pointer;
            color: #64748b;
        }

        .sidebar-section {
            display: flex;
            flex-direction: column;
            gap: 10px;
        }
        .sidebar-section-label {
            font-size: 0.75rem;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: #64748b;
        }

        /* Profile Card */
        .profile-card {
            background: linear-gradient(145deg, #ffffff, #e2e8f0);
            border-radius: 16px;
            padding: 14px;
            display: flex;
            align-items: center;
            gap: 12px;
            box-shadow: inset 2px 2px 5px #ffffff, 4px 4px 10px #cbd5e1;
        }
        .avatar {
            width: 42px;
            height: 42px;
            border-radius: 50%;
            background: linear-gradient(145deg, #0284c7, #0369a1);
            color: #ffffff;
            display: flex;
            justify-content: center;
            align-items: center;
            font-weight: 800;
            font-size: 1.1rem;
            box-shadow: 2px 2px 6px rgba(0,0,0,0.2);
        }
        .user-info { flex: 1; }
        .user-name { font-weight: 700; font-size: 0.92rem; color: #0f172a; }
        .user-role { font-size: 0.75rem; color: #64748b; font-weight: 500; }

        /* Theme Selector */
        .theme-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 8px;
        }
        .theme-btn {
            background: linear-gradient(145deg, #ffffff, #e2e8f0);
            border: 1px solid #cbd5e1;
            border-radius: 12px;
            padding: 10px 8px;
            font-size: 0.8rem;
            font-weight: 700;
            color: #334155;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
            box-shadow: 3px 3px 6px #cbd5e1, -3px -3px 6px #ffffff;
            transition: all 0.2s ease;
        }
        .theme-btn.active {
            background: linear-gradient(145deg, #0284c7, #0369a1);
            color: #ffffff;
            border-color: #0284c7;
            box-shadow: inset 2px 2px 4px #0369a1;
        }

        /* Modal styling */
        .modal-backdrop {
            position: fixed;
            top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(15, 23, 42, 0.6);
            backdrop-filter: blur(6px);
            z-index: 200;
            display: flex;
            justify-content: center;
            align-items: center;
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.25s ease;
        }
        .modal-backdrop.active {
            opacity: 1;
            pointer-events: auto;
        }
        .modal-card {
            background: linear-gradient(145deg, #ffffff, #e2e8f0);
            border-radius: 20px;
            width: 90%;
            max-width: 380px;
            padding: 24px;
            box-shadow: 10px 10px 30px rgba(0,0,0,0.3);
            display: flex;
            flex-direction: column;
            gap: 16px;
        }

        /* Theme Overrides: Dark Mode */
        body[data-theme="dark"] {
            background: #090d16;
            color: #f1f5f9;
        }
        body[data-theme="dark"] .app-container {
            background: linear-gradient(145deg, #1e293b, #0f172a);
            border-color: #334155;
            box-shadow: 10px 10px 30px #020617, -5px -5px 20px #1e293b;
        }
        body[data-theme="dark"] .top-header,
        body[data-theme="dark"] .input-bar,
        body[data-theme="dark"] .sidebar {
            background: linear-gradient(145deg, #1e293b, #0f172a);
            border-color: #334155;
            color: #f1f5f9;
        }
        body[data-theme="dark"] .brand-title,
        body[data-theme="dark"] .user-name,
        body[data-theme="dark"] .sidebar-title { color: #f8fafc; text-shadow: none; }
        body[data-theme="dark"] .toggle-item { color: #94a3b8; text-shadow: none; }
        body[data-theme="dark"] .chat-body { background: #0f172a; }
        body[data-theme="dark"] .jon-msg {
            background: linear-gradient(145deg, #1e293b, #334155);
            border-color: #475569;
            color: #f8fafc;
            box-shadow: 4px 4px 12px #020617, -4px -4px 12px #1e293b;
        }
        body[data-theme="dark"] .input-3d {
            background: #0f172a;
            border-color: #334155;
            color: #f8fafc;
            box-shadow: inset 4px 4px 8px #020617, inset -4px -4px 8px #1e293b;
        }
        body[data-theme="dark"] .btn-3d,
        body[data-theme="dark"] .menu-btn,
        body[data-theme="dark"] .profile-card,
        body[data-theme="dark"] .theme-btn {
            background: linear-gradient(145deg, #1e293b, #334155);
            border-color: #475569;
            color: #f8fafc;
            box-shadow: 4px 4px 10px #020617, -4px -4px 10px #1e293b;
            text-shadow: none;
        }

        /* Theme Overrides: Cyberpunk Neon Mode */
        body[data-theme="neon"] {
            background: #030712;
            color: #00f3ff;
        }
        body[data-theme="neon"] .app-container {
            background: #0a0f1d;
            border: 1px solid #00f3ff;
            box-shadow: 0 0 20px rgba(0, 243, 255, 0.3), inset 0 0 15px rgba(255, 0, 127, 0.15);
        }
        body[data-theme="neon"] .top-header,
        body[data-theme="neon"] .input-bar,
        body[data-theme="neon"] .sidebar {
            background: #0d1527;
            border-color: #00f3ff;
            color: #00f3ff;
        }
        body[data-theme="neon"] .brand-title,
        body[data-theme="neon"] .user-name,
        body[data-theme="neon"] .sidebar-title { color: #00f3ff; text-shadow: 0 0 8px rgba(0, 243, 255, 0.6); }
        body[data-theme="neon"] .chat-body { background: #050a14; }
        body[data-theme="neon"] .jon-msg {
            background: #0d172a;
            border: 1px solid #ff007f;
            color: #f8fafc;
            box-shadow: 0 0 12px rgba(255, 0, 127, 0.3);
        }
        body[data-theme="neon"] .user-msg {
            background: linear-gradient(145deg, #00f3ff, #0099ff);
            color: #050a14;
            box-shadow: 0 0 15px rgba(0, 243, 255, 0.5);
            font-weight: 700;
        }
        body[data-theme="neon"] .input-3d {
            background: #060d1a;
            border-color: #00f3ff;
            color: #00f3ff;
            box-shadow: inset 0 0 10px rgba(0, 243, 255, 0.2);
        }
        body[data-theme="neon"] .btn-3d,
        body[data-theme="neon"] .menu-btn,
        body[data-theme="neon"] .profile-card,
        body[data-theme="neon"] .theme-btn {
            background: #0d172a;
            border: 1px solid #00f3ff;
            color: #00f3ff;
            box-shadow: 0 0 10px rgba(0, 243, 255, 0.2);
            text-shadow: none;
        }
    </style>
</head>
<body>

    <div class="app-container">
        <!-- Top Header -->
        <div class="top-header">
            <div class="brand">
                <button type="button" class="menu-btn" onclick="toggleSidebar()">☰ Menu</button>
                <span class="brand-icon">🤖</span>
                <span class="brand-title">Jon Assistant</span>
                <div class="status-group">
                    <span id="net-status" class="badge-3d badge-online"><span class="dot"></span>ONLINE</span>
                    <span id="ollama-status" class="badge-3d badge-online"><span class="dot"></span>Ollama OK</span>
                </div>
            </div>

            <div class="controls-bar">
                <label class="toggle-item">
                    <span>🔊 Voice Out</span>
                    <span class="switch">
                        <input type="checkbox" id="tts-toggle" checked>
                        <span class="slider"></span>
                    </span>
                </label>
                <label class="toggle-item">
                    <span>👂 Wake Word</span>
                    <span class="switch">
                        <input type="checkbox" id="wake-toggle" onchange="toggleWakeWord(this.checked)">
                        <span class="slider"></span>
                    </span>
                </label>
                <label class="toggle-item">
                    <span>⚡ Offline</span>
                    <span class="switch">
                        <input type="checkbox" id="force-offline-toggle">
                        <span class="slider"></span>
                    </span>
                </label>
            </div>
        </div>

        <!-- Sidebar Overlay & Panel -->
        <div class="sidebar-overlay" id="sidebar-overlay" onclick="toggleSidebar()"></div>
        <div class="sidebar" id="sidebar">
            <div class="sidebar-header">
                <span class="sidebar-title">⚙️ Control Center</span>
                <button type="button" class="close-sidebar-btn" onclick="toggleSidebar()">✕</button>
            </div>

            <!-- Profile / Login Section -->
            <div class="sidebar-section">
                <span class="sidebar-section-label">User Account</span>
                <div class="profile-card">
                    <div class="avatar" id="sidebar-avatar">G</div>
                    <div class="user-info">
                        <div class="user-name" id="sidebar-username">Guest User</div>
                        <div class="user-role" id="sidebar-user-role">Local Session</div>
                    </div>
                </div>
                <button type="button" class="btn-3d" style="width:100%; justify-content:center;" onclick="openLoginModal()">🔑 Login / Switch User</button>
            </div>

            <!-- Theme Selector -->
            <div class="sidebar-section">
                <span class="sidebar-section-label">UI Appearance</span>
                <div class="theme-grid">
                    <button type="button" class="theme-btn active" id="theme-light" onclick="setTheme('light')">☀️ Light</button>
                    <button type="button" class="theme-btn" id="theme-dark" onclick="setTheme('dark')">🌙 Dark</button>
                    <button type="button" class="theme-btn" id="theme-neon" onclick="setTheme('neon')">⚡ Cyberpunk</button>
                    <button type="button" class="theme-btn" id="theme-system" onclick="setTheme('system')">💻 System</button>
                </div>
            </div>

            <!-- Quick Settings Sync -->
            <div class="sidebar-section">
                <span class="sidebar-section-label">Assistant Preferences</span>
                <label class="toggle-item" style="justify-content:space-between;">
                    <span>🔊 Voice Response (TTS)</span>
                    <span class="switch">
                        <input type="checkbox" id="sidebar-tts-toggle" onchange="syncSetting('tts', this.checked)">
                        <span class="slider"></span>
                    </span>
                </label>
                <label class="toggle-item" style="justify-content:space-between;">
                    <span>👂 Wake Word ('Jon')</span>
                    <span class="switch">
                        <input type="checkbox" id="sidebar-wake-toggle" onchange="syncSetting('wake', this.checked)">
                        <span class="slider"></span>
                    </span>
                </label>
                <label class="toggle-item" style="justify-content:space-between;">
                    <span>⚡ Force Offline</span>
                    <span class="switch">
                        <input type="checkbox" id="sidebar-offline-toggle" onchange="syncSetting('offline', this.checked)">
                        <span class="slider"></span>
                    </span>
                </label>
            </div>
        </div>

        <!-- Login Modal -->
        <div class="modal-backdrop" id="login-modal" onclick="if(event.target===this) closeLoginModal()">
            <div class="modal-card">
                <h3 style="font-weight:800; color:#0f172a;">🔐 Sign In to Jon AI</h3>
                <p style="font-size:0.85rem; color:#64748b;">Enter your username to personalize your assistant session.</p>
                <input type="text" class="input-3d" id="login-username-input" placeholder="Username (e.g. Developer)" style="width:100%;">
                <input type="password" class="input-3d" id="login-password-input" placeholder="Password (Optional)" style="width:100%;">
                <div style="display:flex; gap:10px; justify-content:flex-end; margin-top:6px;">
                    <button type="button" class="btn-3d" onclick="closeLoginModal()">Cancel</button>
                    <button type="button" class="btn-3d btn-primary-3d" onclick="handleLoginSubmit()">Sign In 🚀</button>
                </div>
            </div>
        </div>

        <!-- Chat Stream -->
        <div class="chat-body" id="chat-box">
            <div class="msg jon-msg">Hello! I am Jon, your hybrid AI assistant. Type a command or click 🎤 Mic to speak.</div>
        </div>

        <!-- Floating AI Orb -->
        <div class="orb-wrap">
            <div class="ai-orb" id="ai-orb"></div>
        </div>

        <!-- Input Bar -->
        <div class="input-bar">
            <input type="text" class="input-3d" id="query-input" placeholder="Type a command or query..." onkeydown="if(event.key==='Enter'){event.preventDefault();sendQuery();}">
            <button type="button" class="btn-3d" id="mic-btn" onclick="toggleMic()">🎤 Mic</button>
            <button type="button" class="btn-3d btn-primary-3d" id="send-btn" onclick="sendQuery()">Send 🚀</button>
        </div>
    </div>

    <script>
        /* ===== Global State ===== */
        let recognition = null;
        let wakeRecognition = null;
        let ttsResumeInterval = null;
        let isSpeaking = false;
        let micTimeoutTimer = null;
        let silenceTimer = null;

        /* ===== Sidebar & Modal Management ===== */
        function toggleSidebar() {
            var sidebar = document.getElementById('sidebar');
            var overlay = document.getElementById('sidebar-overlay');
            if (sidebar && overlay) {
                sidebar.classList.toggle('active');
                overlay.classList.toggle('active');
            }
        }

        function openLoginModal() {
            var modal = document.getElementById('login-modal');
            if (modal) modal.classList.add('active');
        }

        function closeLoginModal() {
            var modal = document.getElementById('login-modal');
            if (modal) modal.classList.remove('active');
        }

        function handleLoginSubmit() {
            var userInput = document.getElementById('login-username-input');
            var name = userInput ? userInput.value.trim() : '';
            if (!name) name = 'Developer';

            var profile = { username: name, role: 'Authenticated' };
            localStorage.setItem('jon_user', JSON.stringify(profile));
            updateUserProfileUI(profile);
            closeLoginModal();
        }

        function updateUserProfileUI(profile) {
            var avatar = document.getElementById('sidebar-avatar');
            var uname = document.getElementById('sidebar-username');
            var urole = document.getElementById('sidebar-user-role');
            if (avatar) avatar.textContent = profile.username.charAt(0).toUpperCase();
            if (uname) uname.textContent = profile.username;
            if (urole) urole.textContent = profile.role || 'Local Session';
        }

        /* ===== Theme Switcher ===== */
        function setTheme(theme) {
            document.body.removeAttribute('data-theme');
            var btns = document.querySelectorAll('.theme-btn');
            btns.forEach(function(b) { b.classList.remove('active'); });

            if (theme === 'system') {
                var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
                if (prefersDark) document.body.setAttribute('data-theme', 'dark');
            } else if (theme === 'dark' || theme === 'neon') {
                document.body.setAttribute('data-theme', theme);
            }

            var activeBtn = document.getElementById('theme-' + theme);
            if (activeBtn) activeBtn.classList.add('active');
            localStorage.setItem('jon_theme', theme);
        }

        function syncSetting(key, value) {
            if (key === 'tts') {
                var main = document.getElementById('tts-toggle');
                if (main) main.checked = value;
            } else if (key === 'wake') {
                var main = document.getElementById('wake-toggle');
                if (main) {
                    main.checked = value;
                    toggleWakeWord(value);
                }
            } else if (key === 'offline') {
                var main = document.getElementById('force-offline-toggle');
                if (main) main.checked = value;
            }
        }

        /* ===== Orb State ===== */
        function setOrbState(state) {
            var orb = document.getElementById('ai-orb');
            if (!orb) return;
            orb.classList.remove('orb-listening', 'orb-responding');
            if (state === 'listening') orb.classList.add('orb-listening');
            else if (state === 'responding') orb.classList.add('orb-responding');
        }

        /* ===== Utilities ===== */
        function escapeHtml(text) {
            if (!text) return '';
            const div = document.createElement('div');
            div.appendChild(document.createTextNode(String(text)));
            return div.innerHTML;
        }

        function formatResponseText(text) {
            if (!text) return '';
            var formatted = escapeHtml(text);
            formatted = formatted.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
            formatted = formatted.replace(/`([^`]+)`/g, '<code>$1</code>');
            formatted = formatted.replace(/[*][*]([^*]+)[*][*]/g, '<strong>$1</strong>');
            formatted = formatted.split(String.fromCharCode(10)).join('<br>');
            return formatted;
        }

        function appendMsg(sender, html, id) {
            const chatBox = document.getElementById('chat-box');
            if (!chatBox) return null;
            const div = document.createElement('div');
            div.className = 'msg ' + sender + '-msg';
            if (id) div.id = id;
            if (sender === 'user') {
                div.textContent = html;
            } else {
                div.innerHTML = html;
            }
            chatBox.appendChild(div);
            chatBox.scrollTop = chatBox.scrollHeight;
            return div;
        }

        /* ===== TTS ===== */
        function speakText(text) {
            var ttsToggle = document.getElementById('tts-toggle');
            if (ttsToggle && !ttsToggle.checked) return;
            if (!('speechSynthesis' in window)) return;

            window.speechSynthesis.cancel();
            if (ttsResumeInterval) clearInterval(ttsResumeInterval);

            var cleanText = String(text || '')
                .replace(/```[\s\S]*?```/g, 'Code block omitted.')
                .replace(/`([^`]+)`/g, '$1')
                .replace(/\*\*([^*]+)\*\*/g, '$1')
                .replace(/https?:\/\/\S+/g, 'link')
                .trim();

            if (!cleanText) return;

            var utterance = new SpeechSynthesisUtterance(cleanText);
            utterance.rate = 1.0;
            isSpeaking = true;

            ttsResumeInterval = setInterval(function() {
                if (window.speechSynthesis.speaking) {
                    window.speechSynthesis.pause();
                    window.speechSynthesis.resume();
                } else {
                    clearInterval(ttsResumeInterval);
                }
            }, 10000);

            utterance.onend = function() {
                isSpeaking = false;
                if (ttsResumeInterval) clearInterval(ttsResumeInterval);
            };
            utterance.onerror = function() {
                isSpeaking = false;
                if (ttsResumeInterval) clearInterval(ttsResumeInterval);
            };

            window.speechSynthesis.speak(utterance);
        }

        /* ===== Mic UI Reset ===== */
        function resetMicUI() {
            if (silenceTimer) {
                clearTimeout(silenceTimer);
                silenceTimer = null;
            }
            if (micTimeoutTimer) {
                clearTimeout(micTimeoutTimer);
                micTimeoutTimer = null;
            }
            if (recognition) {
                try {
                    recognition.onresult = null;
                    recognition.onerror = null;
                    recognition.onend = null;
                    recognition.stop();
                } catch(e) {}
                recognition = null;
            }
            setOrbState('idle');
            var btn = document.getElementById('mic-btn');
            if (btn) {
                btn.textContent = '🎤 Mic';
                btn.classList.remove('btn-active-mic');
            }
        }

        /* ===== Toggle Mic (speech-to-text) ===== */
        function toggleMic() {
            console.log('toggleMic called');
            if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
                alert('Speech Recognition not supported. Use Chrome or Edge.');
                return;
            }

            // Stop TTS if speaking so audio does not bleed into mic
            if ('speechSynthesis' in window) {
                window.speechSynthesis.cancel();
            }

            var btn = document.getElementById('mic-btn');
            var input = document.getElementById('query-input');

            /* If already listening, stop and send */
            if (recognition) {
                var partial = input ? input.value.trim() : '';
                resetMicUI();
                if (partial) sendQuery();
                return;
            }

            /* Pause wake word if active */
            if (wakeRecognition) {
                try { wakeRecognition.stop(); } catch(e) {}
                wakeRecognition = null;
            }

            var SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;

            function resetSilenceTimer() {
                if (silenceTimer) clearTimeout(silenceTimer);
                silenceTimer = setTimeout(function() {
                    console.log('Silence detected after speech, auto-submitting query');
                    var t = input ? input.value.trim() : '';
                    resetMicUI();
                    if (t) sendQuery();
                }, 4000);
            }

            try {
                recognition = new SpeechRec();
                recognition.continuous = true;
                recognition.interimResults = true;
                recognition.lang = 'en-US';

                setOrbState('listening');
                if (btn) {
                    btn.textContent = '🎙\uFE0F Listening...';
                    btn.classList.add('btn-active-mic');
                }

                /* Overall safety timeout (60s max) */
                micTimeoutTimer = setTimeout(function() {
                    console.warn('Mic safety timeout (60s)');
                    var t = input ? input.value.trim() : '';
                    resetMicUI();
                    if (t) sendQuery();
                }, 60000);

                recognition.onresult = function(e) {
                    var txt = '';
                    for (var i = 0; i < e.results.length; i++) {
                        txt += e.results[i][0].transcript;
                    }
                    if (txt.trim() && input) input.value = txt.trim();
                    /* Reset silence timer on every new speech chunk */
                    resetSilenceTimer();
                };

                recognition.onerror = function(e) {
                    console.warn('Speech error:', e.error);
                    resetMicUI();
                    if (e.error === 'not-allowed') alert('Mic permission denied.');
                    else if (e.error === 'audio-capture') alert('No microphone found.');
                };

                recognition.onend = function() {
                    var t = input ? input.value.trim() : '';
                    var wasActive = (recognition !== null);
                    resetMicUI();
                    if (wasActive && t) sendQuery();
                };

                recognition.start();
                console.log('Speech recognition started');
            } catch(err) {
                console.error('Mic start failed:', err);
                resetMicUI();
                alert('Could not start mic: ' + err.message);
            }
        }

        /* ===== Wake Word ===== */
        var isWakeWordStarting = false;

        function toggleWakeWord(enabled) {
            if (!enabled) {
                if (wakeRecognition) {
                    try { wakeRecognition.stop(); } catch(e) {}
                    wakeRecognition = null;
                }
                return;
            }
            if (wakeRecognition || isWakeWordStarting) return;
            if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) return;

            var SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
            wakeRecognition = new SpeechRec();
            wakeRecognition.continuous = true;
            wakeRecognition.interimResults = true;
            wakeRecognition.lang = 'en-US';

            wakeRecognition.onresult = function(e) {
                if (isSpeaking) return;
                for (var i = e.resultIndex; i < e.results.length; i++) {
                    var transcript = e.results[i][0].transcript.toLowerCase();
                    if (transcript.indexOf('jon') !== -1 || transcript.indexOf('john') !== -1) {
                        var cmd = transcript.replace(/.*(hey jon|jon|john)/i, '').trim().replace(/^[,.! ]+/, '');
                        if (cmd) {
                            var inp = document.getElementById('query-input');
                            if (inp) inp.value = cmd;
                            sendQuery();
                        } else {
                            speakText('Yes? I am listening.');
                        }
                        break;
                    }
                }
            };

            wakeRecognition.onerror = function(e) { console.warn('Wake error:', e.error); };
            wakeRecognition.onend = function() {
                wakeRecognition = null;
                var wt = document.getElementById('wake-toggle');
                if (wt && wt.checked) setTimeout(function() { toggleWakeWord(true); }, 500);
            };

            try {
                isWakeWordStarting = true;
                wakeRecognition.start();
                isWakeWordStarting = false;
            } catch(e) {
                isWakeWordStarting = false;
                wakeRecognition = null;
            }
        }

        /* ===== Health Check ===== */
        function fetchHealth() {
            fetch('/health').then(function(res) { return res.json(); }).then(function(data) {
                var netElem = document.getElementById('net-status');
                if (netElem) {
                    netElem.innerHTML = '<span class="dot"></span>' + (data.network_online ? 'ONLINE' : 'OFFLINE');
                    netElem.className = 'badge-3d ' + (data.network_online ? 'badge-online' : 'badge-offline');
                }
                var ollamaElem = document.getElementById('ollama-status');
                if (ollamaElem) {
                    var oStatus = (data.ollama && data.ollama.status) ? data.ollama.status.toUpperCase() : 'UNKNOWN';
                    ollamaElem.innerHTML = '<span class="dot"></span>Ollama ' + oStatus;
                    ollamaElem.className = 'badge-3d ' + (oStatus === 'HEALTHY' ? 'badge-online' : 'badge-offline');
                }
            }).catch(function() {});
        }

        /* ===== Send Query ===== */
        function sendQuery() {
            console.log('sendQuery called');
            var input = document.getElementById('query-input');
            var sendBtn = document.getElementById('send-btn');
            if (!input) return;
            var text = input.value.trim();
            if (!text) return;

            resetMicUI();

            appendMsg('user', text);
            input.value = '';

            setOrbState('responding');
            var loader = appendMsg('jon', 'Processing... \u23F3', 'loading-indicator');
            if (sendBtn) { sendBtn.disabled = true; sendBtn.style.opacity = '0.6'; }

            var forceOfflineToggle = document.getElementById('force-offline-toggle');
            var forceOffline = forceOfflineToggle ? forceOfflineToggle.checked : false;

            fetch('/api/process', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({text: text, force_offline: forceOffline, source: 'web'})
            }).then(function(res) { return res.json(); }).then(function(data) {
                var pathInfo = data.path_handled || 'Processed';
                if (loader) loader.remove();
                var formattedResponse = formatResponseText(data.response || 'No response.');
                appendMsg('jon', formattedResponse + '<span class="route-tag">Route: ' + pathInfo + ' (' + (data.timing ? data.timing.total_ms : 0) + 'ms)</span>');
                speakText(data.response || '');
                fetchHealth();
            }).catch(function(err) {
                console.error('sendQuery error:', err);
                if (loader) loader.remove();
                appendMsg('jon', 'Error: ' + escapeHtml(err.message));
            }).finally(function() {
                setOrbState('idle');
                if (sendBtn) { sendBtn.disabled = false; sendBtn.style.opacity = '1'; }
            });
        }

        /* ===== Init ===== */
        (function initApp() {
            var savedTheme = localStorage.getItem('jon_theme') || 'light';
            setTheme(savedTheme);

            var savedUser = localStorage.getItem('jon_user');
            if (savedUser) {
                try {
                    updateUserProfileUI(JSON.parse(savedUser));
                } catch(e) {}
            }

            var ttsElem = document.getElementById('tts-toggle');
            var sideTts = document.getElementById('sidebar-tts-toggle');
            if (ttsElem && sideTts) sideTts.checked = ttsElem.checked;

            var wakeElem = document.getElementById('wake-toggle');
            var sideWake = document.getElementById('sidebar-wake-toggle');
            if (wakeElem && sideWake) sideWake.checked = wakeElem.checked;

            var offlineElem = document.getElementById('force-offline-toggle');
            var sideOffline = document.getElementById('sidebar-offline-toggle');
            if (offlineElem && sideOffline) sideOffline.checked = offlineElem.checked;

            fetchHealth();
            console.log('Jon UI initialized with theme: ' + savedTheme);
        })();
    </script>
</body>
</html>
"""

class JonHTTPRequestHandler(BaseHTTPRequestHandler):
    def _send_json(self, status_code: int, data: dict):
        self.send_response(status_code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.end_headers()
        self.wfile.write(json.dumps(data, indent=2).encode("utf-8"))

    def _send_html(self, status_code: int, html_content: str):
        self.send_response(status_code)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(html_content.encode("utf-8"))

    def do_OPTIONS(self):
        self._send_json(200, {"status": "ok"})

    def do_HEAD(self):
        parsed_path = urllib.parse.urlparse(self.path)
        path = parsed_path.path
        if path in ["/", "/index.html"]:
            self.send_response(200)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.end_headers()
        elif path == "/health":
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
        else:
            self.send_response(200)
            self.end_headers()

    def _serve_file(self, file_path: Path):
        try:
            with open(file_path, "rb") as f:
                content = f.read()
            mime_type, _ = mimetypes.guess_type(str(file_path))
            mime_type = mime_type or "application/octet-stream"
            self.send_response(200)
            self.send_header("Content-Type", mime_type)
            self.send_header("Access-Control-Allow-Origin", "*")
            self.send_header("Content-Length", str(len(content)))
            self.end_headers()
            self.wfile.write(content)
        except Exception as e:
            self._send_json(500, {"error": str(e)})

    def do_GET(self):
        parsed_path = urllib.parse.urlparse(self.path)
        path = parsed_path.path
        query_params = urllib.parse.parse_qs(parsed_path.query)

        if path in ["/health", "/api/health"]:
            ollama = OllamaClient()
            h_res = ollama.health_check()
            net_online = is_network_available()

            from cloud_gateway.groq_adapter import GroqAdapter
            from cloud_gateway.nvidia_llama_adapter import NvidiaLlamaAdapter
            from cloud_gateway.nvidia_nemotron_adapter import NvidiaNemotronAdapter

            groq_v = GroqAdapter().validate_key()
            nvidia_c_v = NvidiaLlamaAdapter().validate_key()
            nvidia_a_v = NvidiaNemotronAdapter().validate_key()

            self._send_json(200, {
                "status": "healthy",
                "system": settings.assistant_name,
                "network_online": net_online,
                "ollama": h_res,
                "keys_configured": {
                    "groq": bool(settings.groq_api_key),
                    "nvidia_coding": bool(settings.nvidia_coding_api_key),
                    "nvidia_automation": bool(settings.nvidia_automation_api_key),
                    "obsidian_rest": bool(settings.obsidian_rest_key)
                },
                "keys_validation": {
                    "groq": groq_v,
                    "nvidia_coding": nvidia_c_v,
                    "nvidia_automation": nvidia_a_v
                }
            })

        elif "system_metrics" in path or "telemetry" in path:
            try:
                import psutil
                mem = psutil.virtual_memory()
                cpu = psutil.cpu_percent(interval=None)
                disk = psutil.disk_usage('C:' if os.name == 'nt' else '/')
                self._send_json(200, {
                    "status": "ok",
                    "cpu_percent": round(cpu, 1),
                    "ram_percent": round(mem.percent, 1),
                    "ram_used_gb": round(mem.used / (1024**3), 2),
                    "ram_total_gb": round(mem.total / (1024**3), 2),
                    "ram_free_gb": round(mem.available / (1024**3), 2),
                    "disk_percent": round(disk.percent, 1),
                    "disk_used_gb": round(disk.used / (1024**3), 2),
                    "disk_total_gb": round(disk.total / (1024**3), 2),
                    "timestamp": int(time.time() * 1000)
                })
            except Exception as e:
                self._send_json(500, {"error": str(e)})

        elif path == "/api/notes":
            notes = vault.read_all_notes()
            note_list = []
            for n in notes:
                rel_path = str(n.path.relative_to(vault.vault_path))
                note_list.append({
                    "path": rel_path,
                    "frontmatter": n.frontmatter,
                    "snippet": n.content[:200]
                })
            self._send_json(200, {"total": len(note_list), "notes": note_list})

        elif path in ["/api/process", "/api/command"]:
            text_param = query_params.get("text", [None])[0] or query_params.get("prompt", [None])[0]
            if text_param:
                force_offline = query_params.get("force_offline", ["false"])[0].lower() == "true"
                req = input_handler.process_text_input(text_param)
                result = orchestrator.process_request(req, force_offline=force_offline)
                self._send_json(200, result)
            else:
                self._send_json(200, {
                    "info": "Jon API Command Endpoint.",
                    "usage_get": "/api/command?text=Your+Query",
                    "usage_post": "POST /api/command with JSON body {'text': 'Your Query'}"
                })

        else:
            if DIST_DIR.exists():
                target_file = DIST_DIR / path.lstrip('/')
                if target_file.exists() and target_file.is_file():
                    self._serve_file(target_file)
                    return
                index_file = DIST_DIR / "index.html"
                if index_file.exists():
                    self._serve_file(index_file)
                    return
            self._send_html(200, INDEX_HTML)

    def do_POST(self):
        try:
            parsed_path = urllib.parse.urlparse(self.path)
            path = parsed_path.path
            query_params = urllib.parse.parse_qs(parsed_path.query)

            content_length = int(self.headers.get("Content-Length", 0))
            body_bytes = self.rfile.read(content_length) if content_length > 0 else b"{}"

            try:
                body = json.loads(body_bytes.decode("utf-8"))
            except Exception:
                body = {}

            if path in ["/api/process", "/api/command"]:
                text = body.get("text", "").strip() or body.get("prompt", "").strip() or body.get("command", "").strip()
                if not text:
                    self._send_json(400, {"error": "Missing 'text' or 'prompt' in request body"})
                    return

                query_force_offline = query_params.get("force_offline", ["false"])[0].lower() == "true"
                force_offline = bool(body.get("force_offline", False)) or query_force_offline
                source = body.get("source", "voice" if body.get("is_voice") else "text")

                req = input_handler.process_text_input(text)
                req.source = source

                result = orchestrator.process_request(req, force_offline=force_offline)
                self._send_json(200, result)

            elif path == "/api/promote":
                promoter = MemoryPromoter()
                res = promoter.run_promotion()
                self._send_json(200, res)

            else:
                self._send_json(404, {"error": "Endpoint not found"})

        except Exception as err:
            self._send_json(500, {"error": f"Server POST Error: {str(err)}"})

class ThreadedHTTPServer(ThreadingMixIn, HTTPServer):
    daemon_threads = True
    allow_reuse_address = True

def run_server(port: int = 8000):
    server_address = ("0.0.0.0", port)
    try:
        httpd = ThreadedHTTPServer(server_address, JonHTTPRequestHandler)
    except OSError as e:
        print(f"\n[ERROR]: Could not bind to port {port}: {e}")
        print(f"Port {port} may be occupied by an existing process. Please stop any running instance of server.py or kill the process on port {port}.")
        return

    print("=" * 60)
    print(f"       JON AI ASSISTANT BACKEND SERVER RUNNING ON PORT {port}")
    print(f"       Web Dashboard: http://localhost:{port}/")
    print(f"       Browser Query: http://localhost:{port}/api/process?text=Your+Query")
    print(f"       API Health:    http://localhost:{port}/health")
    print("=" * 60)
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping backend server.")
        httpd.server_close()

if __name__ == "__main__":
    run_server()
