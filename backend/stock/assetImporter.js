const fs = require("fs");
const path = require("path");
const {
  getAssets,
  saveAssets,
  getDuplicateHashes,
  saveDuplicateHashes,
  getUsageHistory,
  saveUsageHistory,
  getImportLog,
  saveImportLog
} = require("./metadataStore");

function nowIso() {
  return new Date().toISOString();
}

function loadCurrentImportState() {
  const assets = Array.isArray(getAssets()) ? getAssets() : [];
  const duplicateHashesRaw = getDuplicateHashes();
  const usageHistoryRaw = getUsageHistory();
  const importLog = Array.isArray(getImportLog()) ? getImportLog() : [];

  const duplicateHashes =
    duplicateHashesRaw &&
    typeof duplicateHashesRaw === "object" &&
    !Array.isArray(duplicateHashesRaw)
      ? duplicateHashesRaw
      : {};

  const usageHistory =
    usageHistoryRaw &&
    typeof usageHistoryRaw === "object" &&
    !Array.isArray(usageHistoryRaw)
      ? usageHistoryRaw
      : {};

  const existingIds = new Set();
  const existingHashes = new Set();

  for (const asset of assets) {
    if (asset?.id) existingIds.add(asset.id);
    if (asset?.sha1) existingHashes.add(asset.sha1);
  }

  for (const hash of Object.keys(duplicateHashes)) {
    existingHashes.add(hash);
  }

  return {
    assets,
    duplicateHashes,
    usageHistory,
    importLog,
    existingIds,
    existingHashes,
    importedInBatch: new Set()
  };
}

function shouldImportAsset(asset, state) {
  if (!asset || asset.processed !== true) {
    return {
      ok: false,
      reason: "not_processed"
    };
  }

  if (asset.moved !== true) {
    return {
      ok: false,
      reason: "not_moved"
    };
  }

  if (asset.duplicate === true) {
    return {
      ok: false,
      reason: asset.duplicateReason || "duplicate"
    };
  }

  if (!asset.sha1) {
    return {
      ok: false,
      reason: "missing_hash"
    };
  }

  if (!asset.newPath) {
    return {
      ok: false,
      reason: "missing_new_path"
    };
  }

  if (!path.isAbsolute(asset.newPath)) {
    return {
      ok: false,
      reason: "new_path_not_absolute"
    };
  }

  if (!fs.existsSync(asset.newPath)) {
    return {
      ok: false,
      reason: "destination_file_missing"
    };
  }

  if (state.existingHashes.has(asset.sha1)) {
    return {
      ok: false,
      reason: "hash_exists"
    };
  }

  if (state.existingIds.has(asset.sha1)) {
    return {
      ok: false,
      reason: "id_exists"
    };
  }

  if (state.importedInBatch.has(asset.sha1)) {
    return {
      ok: false,
      reason: "duplicate_in_import_batch"
    };
  }

  return {
    ok: true
  };
}

function buildAssetRecord(asset) {
  const timestamp = nowIso();

  return {
    id: asset.sha1,
    filename: asset.newFileName || path.basename(asset.newPath),
    path: asset.newPath,
    type: asset.type,
    extension: (asset.extension || path.extname(asset.newPath)).toLowerCase(),
    source_type: "manual_inbox",
    status: "active",
    sha1: asset.sha1,
    sizeBytes: asset.sizeBytes ?? null,
    durationSec: asset.durationSec ?? null,
    durationValid: asset.durationValid ?? null,
    durationReason: asset.durationReason ?? null,
    width: asset.width ?? null,
    height: asset.height ?? null,
    orientation: asset.orientation ?? null,
    fps: asset.fps ?? null,
    codec: asset.codec ?? null,
    thumbnailPath: asset.thumbnailGenerated === true ? asset.thumbnailPath || null : null,
    thumbnailGenerated: asset.thumbnailGenerated === true,
    times_used: 0,
    created_at: timestamp,
    originalName: asset.originalName || asset.name || null
  };
}

function buildImportLogEntry(event, asset, extra = {}) {
  return {
    timestamp: nowIso(),
    event,
    sha1: asset?.sha1 || null,
    file: asset?.originalName || asset?.name || asset?.newFileName || null,
    type: asset?.type || null,
    path: asset?.newPath || asset?.path || null,
    ...extra
  };
}

function initializeUsageHistoryEntry() {
  return {
    times_used: 0,
    last_used_at: null,
    project_ids: []
  };
}

function importSingleAsset(asset, state) {
  try {
    const decision = shouldImportAsset(asset, state);

    if (!decision.ok) {
      const skippedResult = {
        ...asset,
        imported: false,
        importReason: decision.reason
      };

      state.importLog.push(
        buildImportLogEntry("asset_skipped", asset, { reason: decision.reason })
      );

      return skippedResult;
    }

    const record = buildAssetRecord(asset);

    state.assets.push(record);
    state.duplicateHashes[asset.sha1] = true;

    if (!state.usageHistory[asset.sha1]) {
      state.usageHistory[asset.sha1] = initializeUsageHistoryEntry();
    }

    state.existingIds.add(asset.sha1);
    state.existingHashes.add(asset.sha1);
    state.importedInBatch.add(asset.sha1);

    state.importLog.push(
      buildImportLogEntry("asset_imported", asset)
    );

    return {
      ...asset,
      imported: true,
      importReason: "imported",
      assetRecord: record
    };
  } catch (error) {
    state.importLog.push(
      buildImportLogEntry("asset_import_failed", asset, {
        reason: error.message || "import_failed"
      })
    );

    return {
      ...asset,
      imported: false,
      importReason: error.message || "import_failed"
    };
  }
}

function importAssetBatch(duplicateCheckedAssets) {
  const state = loadCurrentImportState();

  const grouped = {
    images: [],
    videos: [],
    audio: [],
    overlays: [],
    endings: [],
    total: 0,
    importedCount: 0,
    skippedCount: 0,
    failedCount: 0
  };

  const keys = ["images", "videos", "audio", "overlays", "endings"];

  for (const key of keys) {
    const files = Array.isArray(duplicateCheckedAssets?.[key])
      ? duplicateCheckedAssets[key]
      : [];

    grouped[key] = files.map((asset) => importSingleAsset(asset, state));
  }

  grouped.total =
    grouped.images.length +
    grouped.videos.length +
    grouped.audio.length +
    grouped.overlays.length +
    grouped.endings.length;

  for (const key of keys) {
    for (const item of grouped[key]) {
      if (item.imported === true) {
        grouped.importedCount += 1;
      } else if (item.importReason && String(item.importReason).includes("failed")) {
        grouped.failedCount += 1;
      } else {
        grouped.skippedCount += 1;
      }
    }
  }

  if (grouped.importedCount > 0) {
    saveAssets(state.assets);
    saveDuplicateHashes(state.duplicateHashes);
    saveUsageHistory(state.usageHistory);
  }

  saveImportLog(state.importLog);

  return grouped;
}

module.exports = {
  loadCurrentImportState,
  shouldImportAsset,
  buildAssetRecord,
  importSingleAsset,
  importAssetBatch
};
