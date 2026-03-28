const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");
const { PATHS } = require("./folderSetup");

const THUMB_MAX_SIZE = 320;

function ensureThumbnailDir() {
  if (!fs.existsSync(PATHS.thumbnails)) {
    fs.mkdirSync(PATHS.thumbnails, { recursive: true });
  }
}

function makeSafeThumbnailName(file) {
  const base =
    file?.sha1 ||
    path.basename(file?.name || "thumb", path.extname(file?.name || ""));

  return `${String(base).replace(/[^a-zA-Z0-9_-]/g, "_")}.jpg`;
}

function getThumbnailPath(file) {
  ensureThumbnailDir();
  return path.join(PATHS.thumbnails, makeSafeThumbnailName(file));
}

function generateImageThumbnail(file, outputPath) {
  execFileSync("magick", [
    file.path,
    "-auto-orient",
    "-thumbnail", `${THUMB_MAX_SIZE}x${THUMB_MAX_SIZE}>`,
    "-background", "white",
    "-alpha", "remove",
    "-alpha", "off",
    outputPath
  ], { stdio: "ignore" });

  return outputPath;
}

function generateVideoThumbnail(file, outputPath) {
  const duration = Number(file?.durationSec || 0);
  let seekTime = 1;

  if (!duration || Number.isNaN(duration) || duration <= 0.5) {
    seekTime = 0;
  } else if (duration < 1) {
    seekTime = Number((duration * 0.25).toFixed(2));
  } else if (duration < 2) {
    seekTime = 0.5;
  } else {
    seekTime = 1;
  }

  const safeScaleFilter = `scale=${THUMB_MAX_SIZE}:${THUMB_MAX_SIZE}:force_original_aspect_ratio=decrease`;

  try {
    execFileSync("ffmpeg", [
      "-y",
      "-ss", String(seekTime),
      "-i", file.path,
      "-frames:v", "1",
      "-vf", safeScaleFilter,
      outputPath
    ], { stdio: "ignore" });
  } catch (error) {
    execFileSync("ffmpeg", [
      "-y",
      "-ss", "0",
      "-i", file.path,
      "-frames:v", "1",
      "-vf", safeScaleFilter,
      outputPath
    ], { stdio: "ignore" });
  }

  return outputPath;
}

function generateThumbnailForAsset(file) {
  if (!file || file.processed !== true) {
    return {
      ...file,
      thumbnailGenerated: false,
      thumbnailError: "asset_not_processed"
    };
  }

  if (file.type === "audio") {
    return {
      ...file,
      thumbnailGenerated: false,
      thumbnailError: "thumbnail_not_supported_for_audio"
    };
  }

  const outputPath = getThumbnailPath(file);

  try {
    if (file.type === "image") {
      generateImageThumbnail(file, outputPath);
    } else if (
      file.type === "video" ||
      file.type === "overlay" ||
      file.type === "ending"
    ) {
      generateVideoThumbnail(file, outputPath);
    } else {
      return {
        ...file,
        thumbnailGenerated: false,
        thumbnailError: `unsupported_thumbnail_type_${file.type}`
      };
    }

    if (!fs.existsSync(outputPath)) {
      return {
        ...file,
        thumbnailGenerated: false,
        thumbnailError: "thumbnail_file_missing"
      };
    }

    return {
      ...file,
      thumbnailPath: outputPath,
      thumbnailGenerated: true
    };
  } catch (error) {
    return {
      ...file,
      thumbnailGenerated: false,
      thumbnailError: error.message || "thumbnail_generation_failed"
    };
  }
}

function generateThumbnailsForProcessedAssets(processedResult) {
  const grouped = {
    images: [],
    videos: [],
    audio: [],
    overlays: [],
    endings: [],
    total: 0
  };

  const keys = ["images", "videos", "audio", "overlays", "endings"];

  for (const key of keys) {
    const files = Array.isArray(processedResult?.[key]) ? processedResult[key] : [];
    grouped[key] = files.map((file) => generateThumbnailForAsset(file));
  }

  grouped.total =
    grouped.images.length +
    grouped.videos.length +
    grouped.audio.length +
    grouped.overlays.length +
    grouped.endings.length;

  return grouped;
}

module.exports = {
  makeSafeThumbnailName,
  generateImageThumbnail,
  generateVideoThumbnail,
  generateThumbnailForAsset,
  generateThumbnailsForProcessedAssets
};
