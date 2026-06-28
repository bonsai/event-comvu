// main.go
// A tiny Go “workflow engine” that orchestrates AI music creation → video visualisation.

package main

import (
	"fmt"
	"log"
	"os"
	"os/exec"
)

// Helper that runs a command and prints stdout/stderr to the console.
func runCmd(name string, args ...string) {
	cmd := exec.Command(name, args...)
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	if err := cmd.Run(); err != nil {
		log.Fatalf("❌ Command %q failed: %v", name, err)
	}
}

func main() {
	if len(os.Args) < 2 {
		fmt.Println(`Usage: go run main.go "YOUR MUSIC PROMPT"`)
		return
	}

	prompt := os.Args[1]
	wavFile := "generated_song.wav" // <- you can change this if you like
	videoFile := "final_visualizer.mp4"

	// ---- 1️⃣  Generate music with the LLM
	fmt.Println("🎼 [step 1] Generating music …")
	runCmd("python", "compeitou.py", prompt, "--out", wavFile)

	// ---- 2️⃣  Visualise the generated WAV
	fmt.Println("🎨 [step 2] Building visualiser video …")
	runCmd("python", "spectrum_analyzer.py",
		"--infile", wavFile,
		"--outfile", videoFile,
		"--frames", "12", // one frame per 1/12th of the song
		"--winsize", "4096",
	)

	fmt.Printf("\n✅ Done! 🎬 %s\n", videoFile)
}