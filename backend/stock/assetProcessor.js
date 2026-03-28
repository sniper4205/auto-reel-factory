const fs = require("fs");
const crypto = require("crypto");
const { execFileSync } = require("child_process");
const imageSizeModule = require("image-size");
const { getConfig } = require("./metadataStore");

const getImageSize =
  typeof imageSizeModule === "function"
    ? imageSizeModule
    : imageSizeModule.imageSize;

function getSha1(filePath) {
  return new Promise((resolve, reject) => {
    if (!filePath) {
      return reject(new Error("missing_file_path"));
    }

    const hash = crypto.createHash("sha1");
    const stream = fs.createReadStream(filePath);

    stream.on("error", (error) => reject(error));

    stream.on("data", (chunk) => {
      hash.update(chunk);
    });

    stream.on("end", () => {
      resolve(hash.digest("hex"));
    });
  });
}

function detectOrientation(width, height) {
  if (!width || !height) {
    return "unknown";
  }

  if (width === height) {
    return "square";
  }

  return height > width ? "portrait" : "landscape";
}

function getImageMetadata(filePath) {
  if (!filePath) {
    throw new Error("missing_file_path");
  }

  if (typeof getImageSize !== "function") {
    throw new Error("image_size_import_invalid");
  }

  const fileBuffer = fs.readFileSync(filePath);
  const dimensions = getImageSize(fileBuffer);

  return {
    width: dimensions?.width || null,
    height: dimensions?.height || null,
    orientation: detectOrientation(dimensions?.width, dimensions?.height)
  };
}

function getMediaMetadataWithFfprobe(filePath) {
  if (!filePath) {
    throw new Error("missing_file_path");
  }

  const output = execFileSync(
    "ffprobe",
    [
      "-v", "error",
      "-print_format", "json",
      "-show_streams",
      "-show_format",
      filePath
    ],
    { encoding: "utf8" }
  );

  const parsed = JSON.parse(output);
  const streams = Array.isArray(parsed.streams) ? parsed.streams : [];
  const format = parsed.format || {};

  const videoStream = streams.find((stream) => stream.codec_type === "video");
  const audioStream = streams.find((stream) => stream.codec_type === "audio");

  const width = videoStream?.width || null;
  const height = videoStream?.height || null;

  let fps = null;

  if (videoStream?.r_frame_rate && videoStream.r_frame_rate !== "0/0") {
    const parts = String(videoStream.r_frame_rate).split("/");

    if (parts.length === 2) {
      const numerator = Number(parts[0]);
      const denominator = Number(parts[1]);

      if (denominator !== 0) {
        fps = Number((numerator / denominator).toFixed(2));
      }
    }
  }

  return {
    durationSec: format.duration ? Number(Number(format.duration).toFixed(2)) : null,
    width,
    height,
    orientation: detectOrientation(width, height),
    fps,
    codec: videoStream?.codec_name || audioStream?.codec_name || null
  };
}

function evaluateVideoDuration(durationSec, clipRules) {
  if (durationSec === null || durationSec === undefined || Number.isNaN(durationSec)) {
    return {
      durationValid: false,
      durationReason: "missing_duration"
    };
  }

  if (durationSec < clipRules.preferred_min_duration) {
    return {
      durationValid: false,
      durationReason: "too_short"
    };
  }

  if (durationSec > clipRules.max_duration) {
    return {
      durationValid: false,
      durationReason: "too_long"
    };
  }

  return {
    durationValid: true,
    durationReason: "valid"
  };
}

async function processAssetFile(file) {
  if (!file || typeof file !== "object") {
    return {
      processed: false,
      error: "invalid_file"
    };
  }

  if (!file.path) {
    return {
      name: file.name || null,
      type: file.type || null,
      processed: false,
      error: "missing_file_path"
    };
  }

  if (!fs.existsSync(file.path)) {
    return {
      name: file.name || null,
      path: file.path,
      type: file.type || null,
      processed: false,
      error: "source_file_missing"
    };
  }

  try {
    const config = getConfig();
    const clipRules = config?.clip_rules || {
      preferred_min_duration: 5,
      preferred_max_duration: 10,
      max_duration: 15
    };

    const stats = fs.statSync(file.path);

    const base = {
      name: file.name || null,
      originalName: file.originalName || file.name || null,
      path: file.path,
      type: file.type || null,
      extension: file.extension || null,
      sizeBytes: typeof file.sizeBytes === "number" ? file.sizeBytes : stats.size,
      sha1: await getSha1(file.path),
      processed: true
    };

    if (file.type === "image") {
      const imageMeta = getImageMetadata(file.path);

      return {
        ...base,
        width: imageMeta.width,
        height: imageMeta.height,
        orientation: imageMeta.orientation
      };
    }

    if (file.type === "video" || file.type === "overlay" || file.type === "ending") {
      const mediaMeta = getMediaMetadataWithFfprobe(file.path);
      const durationEval =
        file.type === "video"
          ? evaluateVideoDuration(mediaMeta.durationSec, clipRules)
          : { durationValid: true, durationReason: "not_applicable" };

      return {
        ...base,
        durationSec: mediaMeta.durationSec,
        durationValid: durationEval.durationValid,
        durationReason: durationEval.durationReason,
        width: mediaMeta.width,
        height: mediaMeta.height,
        orientation: mediaMeta.orientation,
        fps: mediaMeta.fps,
        codec: mediaMeta.codec
      };
    }

    if (file.type === "audio") {
      const mediaMeta = getMediaMetadataWithFfprobe(file.path);

      return {
        ...base,
        durationSec: mediaMeta.durationSec,
        codec: mediaMeta.codec
      };
    }

    return {
      ...base,
      processed: false,
      error: `unsupported_type_${file.type}`
    };
  } catch (err) {
    return {
      name: file.name || null,
      originalName: file.originalName || file.name || null,
      path: file.path || null,
      type: file.type || null,
      extension: file.extension || null,
      sizeBytes: file.sizeBytes || null,
      processed: false,
      error: err.message || "processing_failed"
    };
  }
}

async function processScannedAssets(scanResult) {
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
    const files = Array.isArray(scanResult?.[key]) ? scanResult[key] : [];
    grouped[key] = await Promise.all(files.map((file) => processAssetFile(file)));
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
  getSha1,
  getImageMetadata,
  getMediaMetadataWithFfprobe,
  detectOrientation,
  evaluateVideoDuration,
  processAssetFile,
  processScannedAssets
};
