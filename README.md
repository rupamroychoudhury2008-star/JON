JON

JON is a local-first voice and text AI assistant designed to evolve into a personal AI operating system.

JON combines voice interaction, AI model orchestration, tool execution, structured memory, semantic memory, Obsidian knowledge management, automation, and a tactical command-center interface into one system.

The long-term goal is not simply to build another chatbot. JON is intended to become an AI OS layer that can understand commands, reason over personal context, operate tools, remember information, interact with a knowledge vault, and eventually run increasingly capable models locally.

Table of Contents

Vision

What Is JON?

Core Principles

Capabilities

Architecture

Voice Pipeline

AI Model Layer

Memory Architecture

Obsidian Integration

Intent Routing

Tool Execution

Automation

JON Command Center

Orb Visual Core

Application States

Project Structure

Technology Stack

Installation

Configuration

Running JON

Voice Setup

Obsidian Setup

Memory Setup

API Layer

Security

Performance

Troubleshooting

Development Workflow

Roadmap

Project Philosophy

Status

License

Vision

JON is built around a simple idea:

The computer should become an environment that understands its user instead of forcing the user to understand the computer.

Traditional assistants are primarily conversation systems. JON is intended to become an agentic computer interface:

UNDERSTAND
    ↓
REASON
    ↓
REMEMBER
    ↓
ACT
    ↓
VERIFY
    ↓
RESPOND

A future command such as:

"Jon, research this topic, save the important information to my knowledge base, summarize it, and remind me about it tomorrow."

should be treated as a workflow rather than a single text-generation request.

What Is JON?

JON is a local-first voice and text AI assistant / AI OS project.

Its architecture is built around cooperating layers:

┌───────────────────────────────┐
│       JON COMMAND CENTER      │
│ UI / Voice / Session / Tools  │
└───────────────┬───────────────┘
                │
                ▼
┌───────────────────────────────┐
│         INPUT LAYER           │
│ VAD / Wake Word / STT         │
└───────────────┬───────────────┘
                │
                ▼
┌───────────────────────────────┐
│          JON CORE             │
│ Intent / Routing / Planning   │
└──────────┬───────────┬────────┘
           │           │
           ▼           ▼
     ┌──────────┐ ┌──────────────┐
     │ AI MODEL │ │ TOOLS/ACTION │
     │   LAYER  │ │    LAYER     │
     └────┬─────┘ └──────┬───────┘
          │              │
          └──────┬───────┘
                 ▼
        ┌──────────────────┐
        │   MEMORY LAYER   │
        │ SQL / Vector /   │
        │ Obsidian         │
        └────────┬─────────┘
                 ▼
          RESPONSE / TTS

Core Principles

Local First

JON prioritizes local computation wherever practical:

Local speech recognition

Local AI models

Local memory

Local files

Local automation

Local knowledge

Cloud models can be used when they provide a capability that is not currently available locally.

Model Agnostic

JON is not intended to be permanently tied to one model.

The architecture can route different tasks to different models.

Memory First

JON is designed to retain useful information outside a temporary chat context.

Tools Over Text

When a request requires an action, JON should execute a tool rather than merely describe the action.

Modular

New capabilities should be added as modules instead of requiring a rewrite of the entire system.

Capabilities

Voice

Always-listening interaction

Wake-word detection

Voice activity detection

Faster-Whisper STT

Kokoro TTS

Voice state management

Barge-in support

Streaming-oriented response flow

Intelligence

Intent routing

Multi-model orchestration

Conversation handling

Research handling

Task planning

Tool selection

Context-aware responses

Memory

Structured memory

Semantic memory

Obsidian knowledge storage

Conversation context

Persistent information

Tools

Browser control

Application control

File operations

Research

System operations

Obsidian operations

Future custom tools

Automation

Multi-step tasks

Tool chains

Scheduled work

Background execution

Interface

Tactical command center

Voice receiver status

Session information

Tools

Memory

Metrics

Logs

Animated AI orb

Architecture

USER
 │
 ├──────── Voice
 │             │
 │             ▼
 │      Microphone → VAD → Wake Word
 │             │
 │             ▼
 │        Faster-Whisper
 │             │
 └─────── Text Input
               │
               ▼
        ┌──────────────┐
        │  JON CORE    │
        └──────┬───────┘
               │
        ┌──────┼──────────┐
        ▼      ▼          ▼
     ROUTER  PLANNER    MEMORY
        │      │          │
        ▼      ▼          ▼
     MODELS  TOOLS     RETRIEVAL
        │      │          │
        └──────┼──────────┘
               ▼
          VERIFICATION
               │
               ▼
            RESPONSE
               │
               ▼
           Kokoro TTS
               │
               ▼
            SPEAKER

Voice Pipeline

The intended voice pipeline is:

MICROPHONE
    ↓
Voice Activity Detection
    ↓
Wake Word Detection
    ↓
Audio Capture
    ↓
Faster-Whisper
    ↓
Transcript
    ↓
Intent Router
    ↓
Planner / Model / Tool
    ↓
Response
    ↓
Kokoro TTS
    ↓
SPEAKER

Wake-word concepts include:

"Hey Jon"
"Jon"
"Okay Jon"

The voice lifecycle is designed around:

IDLE
  ↓
WAITING_FOR_WAKE_WORD
  ↓
LISTENING
  ↓
TRANSCRIBING
  ↓
THINKING
  ↓
SPEAKING
  ↓
LISTENING

AI Model Layer

JON uses a multi-model architecture rather than forcing every task through one model.

                 USER REQUEST
                      │
                      ▼
                INTENT ROUTER
                      │
       ┌──────────────┼───────────────┐
       ▼              ▼               ▼
 Conversation      Research        Tool/Task
       │              │               │
       ▼              ▼               ▼
 Appropriate      Appropriate      Planner +
 Model            Model            Tool Model

Local model direction

The architecture is 100% powered by Cloud API Models:

- Groq API (Llama 3.3 70B Versatile) for Chat, Research, and Synthesis
- Nvidia NIM API (Llama 3.3 70B Instruct) for Advanced Coding
- Nvidia NIM API (Nemotron Ultra 550B) for Control & Device Automation

Future JON models

A major long-term goal is to introduce JON-specific models for:

Intent understanding

Tool routing

Planning

Personal context

Voice interaction

JON-specific behavior

The intended evolution is:

External Models
      ↓
Multi-Model JON
      ↓
Specialized JON Models
      ↓
JON-Owned Intelligence
      ↓
JON AI OS

Memory Architecture

JON is designed around three complementary memory layers.

                    JON MEMORY
                        │
        ┌───────────────┼────────────────┐
        ▼               ▼                ▼
   PostgreSQL        Vector DB        Obsidian
   Structured        Semantic         Human-readable

PostgreSQL

For deterministic structured data such as:

Sessions

Tasks

Events

Structured memories

Tool executions

System state

Vector Memory

For semantic retrieval.

Possible architectures discussed for JON include:

Qdrant

Chroma

pgvector

Conceptually:

Memory
  ↓
Embedding
  ↓
Vector
  ↓
Vector Database
  ↓
Semantic Retrieval

The final implementation can choose the most appropriate backend.

Obsidian

Obsidian is the human-readable knowledge layer.

PostgreSQL → structured machine data
Vector DB  → semantic retrieval
Obsidian   → human-readable knowledge

Obsidian Integration

JON is designed to use an Obsidian vault as part of its knowledge system.

                  JON
                   │
          ┌────────┴─────────┐
          ▼                  ▼
    Markdown Files      Local REST API
          │                  │
          └────────┬─────────┘
                   ▼
              Obsidian Vault

The intended capabilities include:

Read notes

Create notes

Update notes

Search knowledge

Store research

Maintain documentation

Build a long-term personal knowledge base

The Obsidian Local REST API is intended to provide programmatic read/write access.

Intent Routing

Every request should first be understood.

Example:

"Open Chrome"
      ↓
OPEN_APP
      ↓
Application Tool
      ↓
Chrome launches

Research:

"Research quantum computing"
      ↓
RESEARCH_REQUEST
      ↓
Research Pipeline
      ↓
Summary
      ↓
Optional Obsidian Note

Memory:

"Remember X"
      ↓
MEMORY_REQUEST
      ↓
Memory Manager
      ↓
Persistent Storage

The router separates what the user wants from which model or tool should perform it.

Tool Execution

The tool layer performs actions.

Request
  ↓
Validation
  ↓
Tool Selection
  ↓
Arguments
  ↓
Execution
  ↓
Result
  ↓
Verification

Potential categories:

TOOLS
├── Browser
├── Applications
├── Files
├── System
├── Research
├── Obsidian
├── Memory
└── Automation

The tool boundary is important because a model should not be given unrestricted system access.

Automation

Automation turns commands into workflows.

Example:

"Research X and save the important information."

        ↓

Planner

        ↓

1. Research X
2. Extract useful information
3. Generate structured note
4. Save to Obsidian
5. Verify
6. Report completion

Longer workflows can become:

Trigger
  ↓
Planner
  ↓
Tool A
  ↓
Tool B
  ↓
Memory
  ↓
Verification
  ↓
Response

JON Command Center

The interface is designed as a futuristic tactical command center rather than a conventional chatbot.

Primary areas include:

JON CORE
SESSION
TOOLS
MEMORY
METRICS
LOGS

The broader navigation concept includes:

Conversation
Voice
Research
Tools
Memory
Automation
Files
Projects
Settings
Logs

The command center exposes system indicators such as:

Voice state

Network

Battery

System status

Microphone state

The main workspace is centered around the JON orb.

Orb Visual Core

The orb is the visual representation of JON's voice/intelligence core.

The current visual direction is:

Dark tactical background
        +
Cyan holographic sphere
        +
Particle/cloud structures
        +
Bright cyan circumference
        +
Floating holographic platform

The orb uses WebGL2 + GLSL rather than a static image.

Its procedural shader can generate:

3D noise

FBM

Particle structures

Sphere geometry

Cyan rim illumination

Atmospheric glow

Floating dust

Holographic platform rings

State-aware animation

The component receives application state through the existing React context:

voiceState
theme
particleSpeed

and maps voice states into shader behavior.

Orb Rendering Pipeline

React Component
      │
      ▼
WebGL2 Context
      │
      ├── Vertex Shader
      │
      └── Fragment Shader
              │
              ├── Procedural Noise
              ├── FBM
              ├── Sphere
              ├── Particle Field
              ├── Rim Light
              ├── Glow
              └── Holographic Platform

The component renders a full-screen quad and computes the orb procedurally in the fragment shader.

Application States

JON's visual and voice systems can react to:

IDLE
LISTENING
PROCESSING
SPEAKING
ERROR

The current shader mapping is:

IDLE       → 0
LISTENING  → 1
PROCESSING → 2
SPEAKING   → 3
ERROR      → 0

This lets the visual core respond without replacing the rest of the interface.

Project Structure

A high-level organization is:

JON/
│
├── backend/
│   ├── api/
│   ├── core/
│   ├── brain/
│   ├── voice/
│   ├── memory/
│   ├── automation/
│   ├── tools/
│   ├── models/
│   └── utils/
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── context/
│   │   ├── hooks/
│   │   ├── services/
│   │   └── shaders/
│   └── public/
│
├── models/
│   ├── local/
│   ├── embeddings/
│   └── custom/
│
├── vault/
│   └── Obsidian Vault/
│
├── docs/
│   ├── architecture/
│   ├── research/
│   ├── api/
│   └── development/
│
├── tests/
│
├── .env
├── .gitignore
└── README.md

This represents the intended architecture; the exact directory names in the current implementation may differ.

Technology Stack

Frontend

React

TypeScript

WebGL2

GLSL

CSS / Tailwind-oriented UI

Browser APIs

React Context

Backend

Python

FastAPI

Async processing

REST APIs

WebSocket-oriented real-time communication where needed

Voice

Faster-Whisper

Kokoro TTS

Voice Activity Detection

Wake-word processing

AI

Groq API (Llama 3.3 70B Versatile)

Nvidia NIM API (Llama 3.3 70B Instruct & Nemotron Ultra 550B)

Memory

PostgreSQL

Vector database architecture

Obsidian Markdown vault

Obsidian Local REST API

Visualization

WebGL2

GLSL

Procedural noise

Fragment shaders

Real-time animation

Installation

1. Clone

git clone <YOUR_REPOSITORY_URL>
cd JON

2. Python Environment

Windows:

python -m venv .venv
.venv\Scriptsctivate

3. Backend Dependencies

pip install -r requirements.txt

4. Frontend Dependencies

cd frontend
npm install

5. Environment Variables

Create .env.

Example structure:

# AI providers
GROQ_API_KEY=
GEMINI_API_KEY=

# Database
DATABASE_URL=

# Vector memory
VECTOR_DB_URL=

# Obsidian
OBSIDIAN_API_URL=
OBSIDIAN_API_KEY=

# Application
JON_ENV=development

Only variables required by the current implementation should be enabled.

Running JON

Backend

From the project root:

uvicorn backend.api.main:app --reload

Use the actual FastAPI entry module used by the current repository if it differs.

Frontend

cd frontend
npm run dev

Vite will display the local development URL.

Voice Setup

Before testing voice:

Enable microphone permissions.

Select the correct microphone.

Verify the supported sample rate.

Confirm Faster-Whisper is installed.

Confirm the selected model exists.

Confirm Kokoro/TTS dependencies.

Start the backend.

Pipeline:

Microphone
   ↓
VAD
   ↓
Wake Word
   ↓
Recording
   ↓
Whisper
   ↓
JON Core
   ↓
Kokoro
   ↓
Speaker

If an audio device reports an invalid sample-rate error, use a sample rate supported by that device instead of forcing an unsupported value.

Obsidian Setup

Install Obsidian and create/open the JON vault.

Example:

JON Vault/
├── Projects/
├── Research/
├── Knowledge/
├── Tasks/
├── Memory/
├── Architecture/
└── Logs/

For automated read/write access, configure the Obsidian Local REST API integration being used by the project.

Keep the API key local and out of frontend code.

Memory Setup

Conceptually:

JON
 │
 ├── PostgreSQL
 │     └── Structured memory
 │
 ├── Vector DB
 │     └── Semantic memory
 │
 └── Obsidian
       └── Human-readable knowledge

This separation allows deterministic queries, semantic retrieval, and human-editable knowledge to coexist.

API Layer

FastAPI acts as the backend boundary:

Frontend
   │
   ├── REST
   └── WebSocket
          │
          ▼
       FastAPI
          │
    ┌─────┼─────┐
    ▼     ▼     ▼
  Brain Memory Tools

The exact endpoint list should be documented from the current backend source rather than invented here.

Security

API Keys

Never commit secrets.

Use:

.env

and include it in .gitignore.

Never expose provider API keys in frontend source.

Tool Execution

Tool calls should validate:

Tool name

Arguments

Permissions

Execution context

Result

Destructive or sensitive operations should stay behind explicit tool boundaries.

Obsidian

Obsidian credentials should remain on the backend/local machine and never be sent to the browser unnecessarily.

Performance

Potentially expensive components include:

Whisper
LLMs
Embeddings
Vector Search
WebGL
TTS

Useful metrics:

Wake-word latency
STT latency
LLM first-token latency
Tool latency
TTS latency
Total response latency
CPU usage
GPU usage
RAM usage

The Metrics area of the command center can eventually expose these values.

Troubleshooting

Orb Missing

Check:

WebGL2 support
Browser console
Shader compilation errors
Canvas size
GPU acceleration

Microphone Not Working

Check:

Browser permission
Windows microphone permission
Input device
Supported sample rate
Audio device availability

STT Not Working

Check:

Faster-Whisper installation
Model availability
Audio input
VAD thresholds
Recording duration
Python environment

TTS Not Working

Check:

Kokoro installation
Voice model
Audio output device
Backend status

Model Requests Failing

Check:

Cloud API key status
API keys
Network
Model name
Backend logs

Obsidian Failing

Check:

Obsidian running
Vault open
REST integration enabled
Endpoint
Port
API key

Development Workflow

Recommended cycle:

IDEA
 ↓
ARCHITECTURE
 ↓
MODULE
 ↓
IMPLEMENTATION
 ↓
UNIT TEST
 ↓
INTEGRATION TEST
 ↓
UI TEST
 ↓
REAL-WORLD TEST
 ↓
LOGGING / METRICS
 ↓
ITERATION

For debugging voice, isolate the pipeline:

Microphone
    ↓
Audio Capture
    ↓
VAD
    ↓
Whisper
    ↓
Intent Router
    ↓
Model
    ↓
TTS

Do not change unrelated layers while diagnosing a specific failure.

Roadmap

Phase 1 — Core Assistant

JON command-center UI direction

Voice architecture

Faster-Whisper integration direction

Kokoro TTS integration direction

Intent-routing architecture

Local-first architecture

Phase 2 — Intelligence

Stronger multi-model orchestration

Better task planning

Improved tool routing

Context-aware responses

Model fallback strategy

Phase 3 — Memory

PostgreSQL structured memory

Vector semantic memory

Persistent conversation memory

Memory retrieval

Memory management UI

Phase 4 — Obsidian

Vault integration

Automatic note creation

Note updates

Research-to-note pipeline

Knowledge retrieval

Phase 5 — Automation

Tool chains

Multi-step workflows

Background tasks

Scheduling

Verification

Phase 6 — AI OS

Unified application control

Advanced system tools

Persistent agent context

JON-specific intelligence

Custom JON models

Deeper OS integration

Project Philosophy

JON is not being built as only a chatbot.

The UI is the visible layer.

The actual system is:

PERCEPTION
    +
REASONING
    +
MEMORY
    +
ACTION
    +
VERIFICATION
    +
INTERACTION

The intended progression is:

Voice Assistant
      ↓
Intelligent Assistant
      ↓
Agent
      ↓
Personal AI
      ↓
AI Operating System

Example Future Workflow

User:

"Hey Jon, research X, save the useful information
to my Obsidian knowledge base, and remind me tomorrow."

JON:

1. Detect wake word
2. Capture speech
3. Transcribe
4. Understand intent
5. Decompose task
6. Research
7. Extract useful information
8. Generate Obsidian note
9. Save note
10. Create reminder
11. Verify execution
12. Respond

That workflow represents the direction of the JON architecture.

Status

JON is an actively evolving project.

Some components are implemented, some are being integrated, and some are planned architectural layers. The system is intentionally modular so that voice, intelligence, memory, tools, automation, and the UI can mature independently.

The main development direction is:

JON should progressively become an AI operating system rather than remain only a voice assistant.

Contributing

When extending JON:

Keep modules focused.

Never hard-code secrets.

Preserve local-first functionality where practical.

Add tests for important backend behavior.

Keep frontend/backend responsibilities separated.

Document new tools and APIs.

Avoid coupling the entire system to one model provider.

Preserve the memory boundaries.

Keep sensitive system actions behind explicit tool boundaries.

License

A project license should be added once the licensing decision is finalized.

Do not assume an open-source license until one has been explicitly selected.

JON

          ┌──────────────────────────┐
          │                          │
          │           JON            │
          │                          │
          │      VOICE + AI + OS     │
          │                          │
          └────────────┬─────────────┘
                       │
          ┌────────────┼────────────┐
          │            │            │
          ▼            ▼            ▼
        THINK       REMEMBER       ACT
          │            │            │
          └────────────┼────────────┘
                       ▼
                   UNDERSTAND
                       │
                       ▼
                    EVOLVE

JON — Obsidian AI OS

From voice assistant → intelligent agent → personal AI operating system.
