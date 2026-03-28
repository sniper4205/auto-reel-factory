const { execSync } = require("child_process");
const path = require("path");
const fs = require("fs");

const OUTPUT_DIR = path.resolve(__dirname, "../../assets/generated/final");

function ensureOutputDir() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
}

function addBackgroundMusic(videoPath, musicPath, projectId = "project") {
  ensureOutputDir();

  if (!videoPath || !fs.existsSync(videoPath)) {
    return {
      mixed: false,
      reason: "video_missing"
    };
  }

  if (!musicPath || !fs.existsSync(musicPath)) {
    return {
      mixed: false,
      reason: "music_missing"
    };
  }

  const outputFile = path.join(OUTPUT_DIR, `${projectId}_with_music.mp4`);

  execSync(
    `ffmpeg -y -i "${videoPath}" -stream_loop -1 -i "${musicPath}" -filter_complex "[1:a]volume=0.18[a1]" -map 0:v:0 -map 0:a:0 -map "[a1]" -filter_complex "[0:a][a1]amix=inputs=2:duration=first:dropout_transition=2[aout]" -map 0:v:0 -map "[aout]" -c:v copy -c:a aac -shortest "${outputFile}"`,
    { stdio: "ignore" }
  );

  if (!fs.existsSync(outputFile)) {
    return {
      mixed: false,
      reason: "output_file_missing"
    };
  }

  return {
    mixed: true,
    path: outputFile
  };
}

module.exports = {
  addBackgroundMusic
};
