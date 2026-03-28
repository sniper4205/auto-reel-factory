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

function escapeForConcat(filePath) {
  return String(filePath).replace(/'/g, "'\\''");
}

function createConcatFile(timeline, tempDir, projectId) {
  ensureDir(tempDir);

  const concatPath = path.join(tempDir, `${projectId}_images.txt`);
  const lines = [];

  timeline.forEach((item) => {
    lines.push(`file '${escapeForConcat(item.file)}'`);
    lines.push(`duration ${Number(item.duration || 3).toFixed(3)}`);
  });

  if (timeline.length) {
    lines.push(`file '${escapeForConcat(timeline[timeline.length - 1].file)}'`);
  }

  fs.writeFileSync(concatPath, lines.join("\n"), "utf8");
  return concatPath;
}

function resolveMusicPath(config) {
  const projectRoot = path.resolve(__dirname, "..", "..");
  const musicDir = path.join(projectRoot, "assets", "music");

  const candidates = [
    path.join(musicDir, "focus_loop.mp3"),
    path.join(musicDir, "calm_loop.mp3"),
    path.join(musicDir, "uplifting_loop.mp3"),
  ];

  for (const candidate of candidates) {
    if (fileExists(candidate)) return candidate;
  }

  return null;
}

function buildVideoFilter(subtitlePath) {
  const filterParts = [
    "scale=1080:1920:force_original_aspect_ratio=increase",
    "crop=1080:1920",
  ];

  if (subtitlePath && fileExists(subtitlePath)) {
    const escapedSubtitlePath = subtitlePath.replace(/:/g, "\\:").replace(/'/g, "\\'");
    filterParts.push(
      `subtitles='${escapedSubtitlePath}':force_style='FontName=Arial,FontSize=16,PrimaryColour=&H00FFFFFF,OutlineColour=&H00000000,BorderStyle=1,Outline=1,Shadow=0,Alignment=2,MarginV=60'`
    );
  }

  return filterParts.join(",");
}

async function composeReel({
  config,
  timeline = [],
  voiceResult,
  subtitlePath,
  output,
}) {
  if (!Array.isArray(timeline) || !timeline.length) {
    throw new Error("composeReel: timeline is empty.");
  }

  const projectRoot = path.resolve(__dirname, "..", "..");
  const tempDir = path.join(projectRoot, "temp", config.projectId);
  ensureDir(tempDir);

  const outputPath =
    output || path.join(projectRoot, "output", `${config.projectId}.mp4`);

  ensureDir(path.dirname(outputPath));

  const concatFile = createConcatFile(timeline, tempDir, config.projectId);
  const voicePath = voiceResult?.wavPath;
  const musicPath =
    config.music && String(config.music).toLowerCase() !== "none"
      ? resolveMusicPath(config)
      : null;

  if (!voicePath || !fileExists(voicePath)) {
    throw new Error("composeReel: voice WAV file is missing.");
  }

  const args = [
    "-y",
    "-f",
    "concat",
    "-safe",
    "0",
    "-i",
    concatFile,
    "-i",
    voicePath,
  ];

  const hasMusic = Boolean(musicPath && fileExists(musicPath));
  if (hasMusic) {
    args.push("-i", musicPath);
  }

  args.push("-vf", buildVideoFilter(subtitlePath));

  if (hasMusic) {
    args.push(
      "-filter_complex",
      "[1:a]volume=1.0[a1];[2:a]volume=0.20[a2];[a1][a2]amix=inputs=2:duration=first:dropout_transition=0[aout]",
      "-map",
      "0:v:0",
      "-map",
      "[aout]"
    );
  } else {
    args.push(
      "-map",
      "0:v:0",
      "-map",
      "1:a:0"
    );
  }

  args.push(
    "-r",
    "30",
    "-c:v",
    "libx264",
    "-pix_fmt",
    "yuv420p",
    "-c:a",
    "aac",
    "-shortest",
    "-movflags",
    "+faststart",
    outputPath
  );

  execFileSync("ffmpeg", args, { stdio: "inherit" });

  if (!fileExists(outputPath)) {
    throw new Error(`composeReel: final video was not created -> ${outputPath}`);
  }

  return {
    output: outputPath,
    video: outputPath,
  };
}

module.exports = {
  composeReel,
};
