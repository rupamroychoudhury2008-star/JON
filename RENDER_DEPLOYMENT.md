# Deploying JON AI Assistant to Render (.com)

This guide walks you through deploying **JON AI Assistant** to [Render](https://render.com) using **Docker** for maximum reliability and 100% cloud compatibility.

---

## 📋 Prerequisites

1. A **GitHub** account with this repository pushed to GitHub.
2. A free **Render** account at [render.com](https://render.com).
3. Your Cloud API keys (Groq & NVIDIA NIM).

---

## 🚀 Option 1: Quick Blueprint Deployment (Recommended)

1. Push all files (including `Dockerfile`, `render.yaml`, `server.py`, etc.) to your **GitHub repository**.
2. Log into [Render Dashboard](https://dashboard.render.com/).
3. Click **New +** top-right and select **Blueprint**.
4. Connect your GitHub repository.
5. Render will automatically detect `render.yaml` and configure the **Web Service**.
6. When prompted, enter your API Keys:
   - `GROQ_API_KEY`: Your Groq Cloud API Key (`gsk_...`)
   - `NVIDIA_CODING_API_KEY`: Your NVIDIA NIM API Key (`nvapi-...`)
   - `NVIDIA_AUTOMATION_API_KEY`: Your NVIDIA NIM API Key (`nvapi-...`)
7. Click **Apply**. Render will automatically build the React UI and start the Python server!

---

## 🛠️ Option 2: Manual Web Service Deployment

If you prefer to create the service manually on Render:

1. Go to [Render Dashboard](https://dashboard.render.com/) and click **New +** -> **Web Service**.
2. Connect your GitHub repository.
3. Configure the settings:
   - **Name**: `jon-ai-assistant`
   - **Language / Environment**: `Docker`
   - **Branch**: `main` (or your default branch)
   - **Region**: Choose the closest location to you
   - **Plan**: `Free`
4. Expand **Advanced** -> **Health Check Path**: Set to `/health`.
5. Add **Environment Variables**:
   - `GROQ_API_KEY` = `gsk_...`
   - `NVIDIA_CODING_API_KEY` = `nvapi-...`
   - `NVIDIA_AUTOMATION_API_KEY` = `nvapi-...`
   - `REQUIRE_TOOL_CONFIRMATION` = `false`
6. Click **Create Web Service**.

---

## 🔍 Verifying your Deployment

Once the build finishes and status turns to **Live**:

- **Web Dashboard**: Open `https://<your-app-name>.onrender.com/` in your browser.
- **Health Check**: Open `https://<your-app-name>.onrender.com/health` to verify API keys and network connection status.

---

## 💡 Notes & Troubleshooting

- **Free Tier Sleep**: Free Web Services on Render automatically sleep after 15 minutes of inactivity. When a request comes in, it takes ~30 seconds to wake back up.
- **Dynamic Port**: Render automatically sets the `PORT` environment variable. `server.py` is configured to listen on `$PORT` automatically.
