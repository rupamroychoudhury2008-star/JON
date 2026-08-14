# Multi-stage Dockerfile for JON AI Assistant on Render

# ── Stage 1: Build React Command Center UI ──
FROM node:20-alpine AS frontend-builder
WORKDIR /app/command-center
COPY command-center/package*.json ./
RUN npm install
COPY command-center/ ./
RUN npm run build

# ── Stage 2: Python Backend Runtime ──
FROM python:3.11-slim
WORKDIR /app

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PORT=8000

# Install minimal Linux system build tools
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend application source
COPY . .

# Copy built React dist from Stage 1
COPY --from=frontend-builder /app/command-center/dist ./command-center/dist

EXPOSE 8000

CMD ["python", "server.py"]
