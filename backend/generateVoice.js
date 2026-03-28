const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const storyPath = path.join(__dirname, "story.txt");
const outputPath = path.join(__dirname, "audio", "voice.wav");

if (!fs.existsSync(storyPath)) {
  console.error("story.txt not found");
  process.exit(1);
}

const text = fs.readFileSync(storyPath, "utf-8").trim();

if (!text) {
  console.error("story.txt is empty");
  process.exit(1);
}

const escaped = text.replace(/"/g, '\\"');
const voiceName = (process.env.VOICE_NAME || "").trim();

try {
  const cmd = voiceName
    ? `say -v "${voiceName}" -o "${outputPath}" --data-format=LEF32@22050 "${escaped}"`
    : `say -o "${outputPath}" --data-format=LEF32@22050 "${escaped}"`;

  execSync(cmd, { stdio: "inherit" });
  console.log(`✅ Voice created: ${outputPath}`);
} catch (err) {
  console.error("❌ Voice generation failed");
  process.exit(1);
}
