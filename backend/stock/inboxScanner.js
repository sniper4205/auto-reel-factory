const fs = require("fs");
const path = require("path");
const { getConfig, DEFAULT_CONFIG } = require("./metadataStore");
const { PATHS } = require("./folderSetup");

function isHiddenFile(fileName) {
  return typeof fileName === "string" && fileName.startsWith(".");
}

function isAllowedExtension(fileName, allowedExtensions) {
  if (!Array.isArray(allowedExtensions)) {
    return false;
  }

  const ext = path.extname(fileName).toLowerCase();
  return allowedExtensions.includes(ext);
}

function getAllowedExtensions() {
  const config = getConfig();

  const configAllowed =
    config &&
    typeof config === "object" &&
    config.allowed_extensions &&
    typeof config.allowed_extensions === "object"
      ? config.allowed_extensions
      : {};

  return {
    images: Array.isArray(configAllowed.images)
      ? configAllowed.images
      : DEFAULT_CONFIG.allowed_extensions.images,
    videos: Array.isArray(configAllowed.videos)
      ? configAllowed.videos
      : DEFAULT_CONFIG.allowed_extensions.videos,
    audio: Array.isArray(configAllowed.audio)
      ? configAllowed.audio
      : DEFAULT_CONFIG.allowed_extensions.audio,
    overlays: Array.isArray(configAllowed.overlays)
      ? configAllowed.overlays
      : DEFAULT_CONFIG.allowed_extensions.overlays,
    endings: Array.isArray(configAllowed.endings)
      ? configAllowed.endings
      : DEFAULT_CONFIG.allowed_extensions.endings
  };
}

function scanInboxFolder(folderPath, type, allowedExtensions) {
  const results = [];

  try {
    if (!folderPath || !fs.existsSync(folderPath)) {
      return results;
    }

    const files = fs.readdirSync(folderPath);

    for (const fileName of files) {
      try {
        if (isHiddenFile(fileName)) {
          continue;
        }

        if (!isAllowedExtension(fileName, allowedExtensions)) {
          continue;
        }

        const fullPath = path.join(folderPath, fileName);
        const stats = fs.statSync(fullPath);

        if (!stats.isFile()) {
          continue;
        }

        results.push({
          name: fileName,
          originalName: fileName,
          path: fullPath,
          type,
          extension: path.extname(fileName).toLowerCase(),
          sizeBytes: stats.size
        });
      } catch (error) {
        // skip broken file, continue batch
      }
    }
  } catch (error) {
    return results;
  }

  return results;
}

function scanAllInboxes() {
  const allowed = getAllowedExtensions();

  const grouped = {
    images: scanInboxFolder(PATHS.inboxImages, "image", allowed.images),
    videos: scanInboxFolder(PATHS.inboxVideos, "video", allowed.videos),
    audio: scanInboxFolder(PATHS.inboxAudio, "audio", allowed.audio),
    overlays: scanInboxFolder(PATHS.inboxOverlays, "overlay", allowed.overlays),
    endings: scanInboxFolder(PATHS.inboxEndings, "ending", allowed.endings),
    total: 0
  };

  grouped.total =
    grouped.images.length +
    grouped.videos.length +
    grouped.audio.length +
    grouped.overlays.length +
    grouped.endings.length;

  return grouped;
}

module.exports = {
  isHiddenFile,
  isAllowedExtension,
  scanInboxFolder,
  scanAllInboxes
};
