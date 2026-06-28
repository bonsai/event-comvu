#!/usr/bin/env python
# spectrum_analyzer.py
# ----------------------------------------------------------------------
# Reads a WAV (or CSV) file, performs an FFT, and writes an animated MP4.
# ----------------------------------------------------------------------
#   Usage: python spectrum_analyzer.py --infile song.wav --outfile visual.mp4 [options]
# ----------------------------------------------------------------------
import argparse
import numpy as np
import matplotlib.pyplot as plt
import matplotlib.animation as animation
import soundfile as sf
import sys

def parse_args():
    parser = argparse.ArgumentParser(description="WAV visualiser → MP4")
    parser.add_argument("--infile", required=True, help="Input WAV or CSV")
    parser.add_argument("--outfile", default="visualizer.mp4", help="Output MP4")
    parser.add_argument("--frames", type=int, default=12, help="Number of frames per second")
    parser.add_argument("--winsize", type=int, default=4096, help="FFT window size")
    return parser.parse_args()

def load_wave(path):
    data, sr = sf.read(path)
    # If stereo, just pick one channel
    if len(data.shape) > 1:
        data = data[:, 0]
    return data, sr

def main():
    args = parse_args()
    audio, sr = load_wave(args.infile)

    # Prepare time axis and FFT bins
    n_frames = len(audio) // args.winsize
    times = np.arange(n_frames) * args.winsize / sr
    freqs = np.fft.rfftfreq(args.winsize, d=1./sr)

    fig, ax = plt.subplots()
    line, = ax.plot(freqs, np.zeros_like(freqs))
    ax.set_xlim(0, sr/2)
    ax.set_ylim(0, 1)
    ax.set_xlabel('Frequency (Hz)')
    ax.set_ylabel('Amplitude')
    ax.set_title('Spectrum over time')

    def update(frame):
        start = frame * args.winsize
        win = audio[start:start+args.winsize]
        if len(win) < args.winsize:          # pad last frame
            win = np.pad(win, (0, args.winsize - len(win)), 'constant')
        fft = np.abs(np.fft.rfft(win * np.hanning(args.winsize))) / args.winsize
        line.set_ydata(fft / np.max(fft))
        ax.set_title(f'Frame {frame+1}/{n_frames}')
        return line,

    ani = animation.FuncAnimation(fig, update, frames=n_frames, interval=1000//args.frames, blit=True)

    # Write the video
    print(f"\n🎬 Saving visualiser to {args.outfile} …")
    ani.save(args.outfile, writer="ffmpeg", fps=args.frames)
    print(f"✅ Video finished: {args.outfile}")

if __name__ == "__main__":
    main()