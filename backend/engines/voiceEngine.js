const { execSync, execFileSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const VOICE_SCRIPT = path.join(
  process.env.HOME,
  "AutoReelFactory/ai/generate_voice.py"
);

function splitScript(script) {
  return script
    .split(/[.!?]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function mergeVoiceFiles(files, outFile) {
  const tempDir = path.dirname(outFile);
  const listFile = path.join(tempDir, "voice_list.txt");

  let listContent = "";
  files.forEach((file) => {
    listContent += `file '${file}'\n`;
  });

  fs.writeFileSync(listFile, listContent, "utf8");

  execFileSync(
    "ffmpeg",
    [
      "-y",
      "-f", "concat",
      "-safe", "0",
      "-i", listFile,
      "-c", "copy",
      outFile
    ],
    { stdio: "inherit" }
  );

  return outFile;
}

function generateVoices(script, projectId) {
  const lines = splitScript(script);

  const outDir = path.join(
    process.env.HOME,
    "AutoReelFactory/assets/generated/voices",
    projectId
  );

  fs.mkdirSync(outDir, { recursive: true });

  const results = [];

  lines.forEach((line, i) => {
    const outFile = path.join(
      outDir,
      `voice_${String(i + 1).padStart(3, "0")}.wav`
    );

    console.log("Generating voice:", line);

    execSync(
      `${process.env.HOME}/AutoReelFactory/voice-env/bin/python "${VOICE_SCRIPT}" "${line}" "${outFile}"`,
      { stdio: "inherit" }
    );

    results.push({
      id: i + 1,
      text: line,
      audio: outFile
    });
  });

  const mergedFile = path.join(outDir, "voice_full.wav");
  mergeVoiceFiles(results.map((r) => r.audio), mergedFile);

  return {
    lines: results,
    mergedAudio: mergedFile
  };
}

module.exports = {
  generateVoices
};
