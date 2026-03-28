const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function fileExists(filePath) {
  try {
    return fs.existsSync(filePath);
  } catch {
    return false;
  }
}

function sanitizeText(text = "") {
  return String(text)
    .replace(/\r/g, " ")
    .replace(/\n/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function resolveSayVoice(voice) {
  const value = String(voice || "").toLowerCase();

  if (value.includes("male")) return "Daniel";
  if (value.includes("female")) return "Samantha";

  return "Samantha";
}

function ensureWavFromAiff(aiffPath, wavPath) {
  execFileSync("ffmpeg", [
    "-y",
    "-i",
    aiffPath,
    wavPath,
  ], { stdio: "inherit" });
}

async function generateVoice({ config, script, outputDir, projectId }) {
  ensureDir(outputDir);

  const narration = sanitizeText(script?.narration || "");
  if (!narration) {
    throw new Error("generateVoice: narration text is empty.");
  }

  const baseName = `${projectId}_voice`;
  const aiffPath = path.join(outputDir, `${baseName}.aiff`);
  const wavPath = path.join(outputDir, `${baseName}.wav`);

  const sayVoice = resolveSayVoice(config?.voice);

  execFileSync("say", [
    "-v",
    sayVoice,
    "-o",
    aiffPath,
    narration,
  ], { stdio: "inherit" });

  if (!fileExists(aiffPath)) {
    throw new Error(`Voice generation failed: AIFF not created -> ${aiffPath}`);
  }

  ensureWavFromAiff(aiffPath, wavPath);

  if (!fileExists(wavPath)) {
    throw new Error(`Voice generation failed: WAV not created -> ${wavPath}`);
  }

  return {
    narration,
    aiffPath,
    wavPath,
    voice: sayVoice,
  };
}

module.exports = {
  generateVoice,
};
