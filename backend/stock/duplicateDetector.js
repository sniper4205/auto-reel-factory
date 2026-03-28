const { getDuplicateHashes } = require("./metadataStore");

function loadDuplicateHashes() {
  try {
    const hashes = getDuplicateHashes();

    if (!hashes || typeof hashes !== "object" || Array.isArray(hashes)) {
      return {};
    }

    return hashes;
  } catch (error) {
    return {};
  }
}

function detectDuplicate(file, knownHashes, seenInBatch) {
  try {
    if (!file || file.processed !== true || file.moved !== true) {
      return {
        ...file,
        duplicate: false,
        duplicateReason: "asset_not_ready"
      };
    }

    if (!file.sha1) {
      return {
        ...file,
        duplicate: true,
        duplicateReason: "missing_hash"
      };
    }

    const hash = file.sha1;

    if (knownHashes[hash]) {
      return {
        ...file,
        duplicate: true,
        duplicateReason: "hash_exists"
      };
    }

    if (seenInBatch[hash]) {
      return {
        ...file,
        duplicate: true,
        duplicateReason: "duplicate_in_batch"
      };
    }

    seenInBatch[hash] = true;

    return {
      ...file,
      duplicate: false
    };
  } catch (error) {
    return {
      ...file,
      duplicate: true,
      duplicateReason: error.message || "duplicate_check_failed"
    };
  }
}

function checkDuplicateBatch(movedAssets) {
  const knownHashes = loadDuplicateHashes();
  const seenInBatch = {};

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
    const files = Array.isArray(movedAssets?.[key]) ? movedAssets[key] : [];

    grouped[key] = files.map((file) =>
      detectDuplicate(file, knownHashes, seenInBatch)
    );
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
  loadDuplicateHashes,
  detectDuplicate,
  checkDuplicateBatch
};
