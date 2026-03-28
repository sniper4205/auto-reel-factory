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

function formatSrtTime(seconds) {
  const totalMs = Math.max(0, Math.floor(seconds * 1000));
  const ms = totalMs % 1000;
  const totalSeconds = Math.floor(totalMs / 1000);
  const s = totalSeconds % 60;
  const totalMinutes = Math.floor(totalSeconds / 60);
  const m = totalMinutes % 60;
  const h = Math.floor(totalMinutes / 60);

  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")},${String(ms).padStart(3, "0")}`;
}

function splitNarrationIntoChunks(text) {
  return String(text || "")
    .match(/[^.!?]+[.!?]?/g)
    ?.map((line) => line.trim())
    .filter(Boolean) || [];
}

function buildFallbackSrt(narration, durationSeconds) {
  const chunks = splitNarrationIntoChunks(narration);
  if (!chunks.length) return "";

  const blockDuration = durationSeconds / chunks.length;

  return chunks
    .map((line, index) => {
      const start = index * blockDuration;
      const end = index === chunks.length - 1 ? durationSeconds : (index + 1) * blockDuration;

      return [
        String(index + 1),
        `${formatSrtTime(start)} --> ${formatSrtTime(end)}`,
        line,
        "",
      ].join("\n");
    })
    .join("\n");
}

function getAudioDurationSeconds(audioPath) {
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
}

async function generateSubtitles({
  script,
  voiceResult,
  subtitlePath,
  outputDir,
  projectId,
}) {
  ensureDir(outputDir);

  const targetPath =
    subtitlePath || path.join(outputDir, `${projectId}.srt`);

  const narration = script?.narration || "";
  const wavPath = voiceResult?.wavPath;

  if (!narration.trim()) {
    throw new Error("generateSubtitles: narration is empty.");
  }

  let durationSeconds = 12;

  if (wavPath && fileExists(wavPath)) {
    durationSeconds = getAudioDurationSeconds(wavPath) || durationSeconds;
  }

  const srtContent = buildFallbackSrt(narration, durationSeconds);
  fs.writeFileSync(targetPath, srtContent, "utf8");

  if (!fileExists(targetPath)) {
    throw new Error(`Subtitle generation failed: SRT not created -> ${targetPath}`);
  }

  return {
    subtitlePath: targetPath,
    durationSeconds,
  };
}

module.exports = {
  generateSubtitles,
};
