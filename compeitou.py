#!/usr/bin/env python
# compeitou.py
# ----------------------------------------------------------------------
# Generates a short music clip from a text prompt using Gemini (or any LLM).
# ----------------------------------------------------------------------
#   Usage: python compeitou.py "prompt text" --out my_song.wav
#
# Dependencies:
#   pip install google-generativeai
#   pip install numpy soundfile
# ----------------------------------------------------------------------
import argparse
import os
import sys
import json
import subprocess
import google.generativeai as genai
import numpy as np
import soundfile as sf

# ----------------------------------------------------------------------
# 1️⃣  Set up Gemini credentials
# ----------------------------------------------------------------------
# Put your API key in an env var or a .env file.
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

# ----------------------------------------------------------------------
# 2️⃣  Parse CLI arguments
# ----------------------------------------------------------------------
parser = argparse.ArgumentParser(description="Generate a WAV file from a prompt.")
parser.add_argument("prompt", help="Music‑generation prompt (text)")
parser.add_argument("--out", help="Output WAV file name (defaults to 'output.wav')", default="output.wav")
args = parser.parse_args()

# ----------------------------------------------------------------------
# 3️⃣  Build the Gemini request
# ----------------------------------------------------------------------
# The prompt will be sent to Gemini and we’ll ask it to produce raw PCM data.
model = genai.GenerativeModel("gemini-2.5-pro")

response = model.generate_content(
    [
        genai.types.TextPart(
            f"Compose a short, 30‑second instrumental track that captures the vibe: {args.prompt}"
        ),
        # Tell Gemini we want audio back (the API itself doesn’t support raw audio, but we can
        # convert a generated short audio clip into a WAV via a 3rd‑party service).
        # For demo purposes, we’ll use a placeholder text that describes the melody,
        # then synthesize a sine wave of that melody.  Replace with your own LLM logic.
    ],
    generation_config=genai.GenerationConfig(
        temperature=0.7,
        top_p=1.0,
    ),
)

# ----------------------------------------------------------------------
# 4️⃣  Turn the LLM response into raw PCM (demo stub)
# ----------------------------------------------------------------------
# In a real system you’d parse the LLM response (maybe a JSON with frequencies, durations)
# and synthesize audio with something like librosa or sounddevice.  For now we just
# create a 30‑second sine wave to prove the pipeline works.
duration_sec = 30
sr = 44100
t = np.linspace(0, duration_sec, int(sr * duration_sec), False)

# Very simple: a single tone whose frequency is derived from the prompt length.
freq = 220 + (len(args.prompt) % 200)
audio = 0.5 * np.sin(2 * np.pi * freq * t)

# Write to file
sf.write(args.out, audio, sr)
print(f"\n✅ 🎼 Music saved to {args.out}")