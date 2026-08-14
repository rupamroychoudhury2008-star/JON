import sys
import os
import json
from config.settings import settings
from router.intent_router import IntentRouter, UserRequest
from cloud_gateway.gateway import CloudGateway
from cloud_gateway.groq_adapter import GroqAdapter
from cloud_gateway.nvidia_llama_adapter import NvidiaLlamaAdapter
from cloud_gateway.nvidia_nemotron_adapter import NvidiaNemotronAdapter
from memory.obsidian_vault import ObsidianVault

def run_tests():
    print("=" * 70)
    print("           JON AI ASSISTANT — 100% CLOUD API LLM TEST")
    print("=" * 70)
    results = {}

    # 1. Cloud Intent Router
    print("\n1. Testing Cloud Intent Router...")
    try:
        router = IntentRouter()
        req = UserRequest(text="Explain quantum computing briefly")
        decision = router.route(req)
        results["Cloud Intent Router"] = f"SUCCESS (Classified intent: '{decision.intent}', target: '{decision.target_model}')"
    except Exception as e:
        results["Cloud Intent Router"] = f"FAILED: {str(e)}"
    print(f" -> {results['Cloud Intent Router']}")

    # 2. Groq API (Chat / Research / Planning)
    print("\n2. Testing Groq API Adapter (Chat / Research / Planning)...")
    try:
        groq = GroqAdapter()
        if groq.is_available():
            ans = groq.chat(prompt="Say 'Groq LLM is online and operational.'")
            results["Groq API"] = f"SUCCESS (Response: '{ans[:60]}...')"
        else:
            results["Groq API"] = "SKIPPED: GROQ_API_KEY not configured"
    except Exception as e:
        results["Groq API"] = f"FAILED: {str(e)}"
    print(f" -> {results['Groq API']}")

    # 3. Nvidia Llama 3.3 70B (Coding)
    print("\n3. Testing Nvidia Llama 3.3 70B Instruct (Coding)...")
    try:
        nv_llama = NvidiaLlamaAdapter()
        if nv_llama.is_available():
            ans = nv_llama.code_task(prompt="Write a Python function that adds two numbers.")
            results["Nvidia Llama 3.3 70B (Coding)"] = f"SUCCESS (Response: '{ans[:60]}...')"
        else:
            results["Nvidia Llama 3.3 70B (Coding)"] = "SKIPPED: NVIDIA_CODING_API_KEY not configured"
    except Exception as e:
        results["Nvidia Llama 3.3 70B (Coding)"] = f"FAILED: {str(e)}"
    print(f" -> {results['Nvidia Llama 3.3 70B (Coding)']}")

    # 4. Nvidia Nemotron Ultra 550B (Control & Device Automation)
    print("\n4. Testing Nvidia Nemotron Ultra 550B (Control & Automation)...")
    try:
        nv_nemo = NvidiaNemotronAdapter()
        if nv_nemo.is_available():
            ans = nv_nemo.automate_task(prompt="Open Notepad app on my computer.")
            results["Nvidia Nemotron (Control)"] = f"SUCCESS (Response: '{str(ans)[:60]}...')"
        else:
            results["Nvidia Nemotron (Control)"] = "SKIPPED: NVIDIA_AUTOMATION_API_KEY not configured"
    except Exception as e:
        results["Nvidia Nemotron (Control)"] = f"FAILED: {str(e)}"
    print(f" -> {results['Nvidia Nemotron (Control)']}")

    # 5. Local Memory Vault Connection
    print("\n5. Testing Local Memory Vault Connection...")
    try:
        vault = ObsidianVault()
        notes = vault.read_all_notes()
        results["Memory Vault"] = f"SUCCESS (Vault initialized at '{vault.vault_path}', {len(notes)} notes read)"
    except Exception as e:
        results["Memory Vault"] = f"FAILED: {str(e)}"
    print(f" -> {results['Memory Vault']}")

    print("\n" + "=" * 70)
    print("                      TEST SUMMARY RESULTS")
    print("=" * 70)
    for model_name, status in results.items():
        print(f" • {model_name:35s}: {status}")
    print("=" * 70)

if __name__ == "__main__":
    run_tests()
