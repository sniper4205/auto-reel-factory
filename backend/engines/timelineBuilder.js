const fs = require("fs");
const { execFileSync } = require("child_process");

function getAudioDurationSeconds(audioPath) {
  if (!audioPath || !fs.existsSync(audioPath)) return 0;

  try {
    const result = execFileSync(
      "ffprobe",
      [
        "-v",
        "error",
        "-show_entries",
        "format=duration",
        "-of",
        "default=noprint_wrappers=1:nokey=1",
        audioPath,
      ],
      { encoding: "utf8" }
    );

    return Number.parseFloat(String(result || "").trim()) || 0;
  } catch {
    return 0;
  }
}

function buildSimpleTimeline(imageFiles, totalDuration) {
  if (!Array.isArray(imageFiles) || !imageFiles.length) return [];

  const safeDuration = totalDuration > 0 ? totalDuration : imageFiles.length * 3;
  const perImage = safeDuration / imageFiles.length;

  return imageFiles.map((file, index) => ({
    file,
    start: Number((index * perImage).toFixed(3)),
    duration: Number(perImage.toFixed(3)),
  }));
}

async function buildTimeline({
  script,
  imageFiles = [],
  voiceResult,
}) {
  if (!Array.isArray(imageFiles) || !imageFiles.length) {
    throw new Error("buildTimeline: no images were provided.");
  }

  const totalDuration = getAudioDurationSeconds(voiceResult?.wavPath);

  return buildSimpleTimeline(imageFiles, totalDuration);
}

module.exports = {
  buildTimeline,
};
