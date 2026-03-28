const { execSync } = require("child_process");
const path = require("path");
const fs = require("fs");

const OUTPUT_DIR = path.resolve(__dirname, "../../assets/generated/voiceovers");

function ensureOutputDir() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
}

function makeSafeName(text) {
  return String(text || "voiceover")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 40) || "voiceover";
}

function generateVoiceover(script, projectId = "project") {
  ensureOutputDir();

  const baseName = `${projectId}_${Date.now()}_${makeSafeName(script)}`;
  const aiffPath = path.join(OUTPUT_DIR, `${baseName}.aiff`);
  const wavPath = path.join(OUTPUT_DIR, `${baseName}.wav`);

  execSync(`say -o "${aiffPath}" "${String(script).replace(/"/g, '\\"')}"`, {
    stdio: "ignore"
  });

  execSync(`ffmpeg -y -i "${aiffPath}" "${wavPath}"`, {
    stdio: "ignore"
  });

  if (!fs.existsSync(wavPath)) {
    throw new Error("voiceover_file_missing");
  }

  return {
    generated: true,
    path: wavPath
  };
}

module.exports = {
  generateVoiceover
};
