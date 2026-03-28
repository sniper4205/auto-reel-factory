const {
  getAssets,
  getUsageHistory,
  saveUsageHistory
} = require("./metadataStore");

function normalizeUsageEntry(entry) {
  return {
    times_used: typeof entry?.times_used === "number" ? entry.times_used : 0,
    last_used_at: entry?.last_used_at || null,
    project_ids: Array.isArray(entry?.project_ids) ? entry.project_ids : []
  };
}

function loadAssetLibrary() {
  const assets = getAssets();
  return Array.isArray(assets) ? assets : [];
}

function loadUsageHistory() {
  const usage = getUsageHistory();
  return usage && typeof usage === "object" && !Array.isArray(usage) ? usage : {};
}

function filterActiveAssets(assets) {
  return assets.filter((asset) => asset && asset.status === "active");
}

function filterAssetsByCriteria(assets, criteria = {}) {
  const {
    requiredType,
    orientation,
    minDuration,
    maxDuration
  } = criteria;

  return assets.filter((asset) => {
    if (!asset) return false;

    if (requiredType && asset.type !== requiredType) {
      return false;
    }

    if (orientation) {
      if (!asset.orientation || asset.orientation === "unknown") {
        return false;
      }

      if (asset.orientation !== orientation) {
        return false;
      }
    }

    const durationTypes = ["video", "audio", "overlay", "ending"];

    if (durationTypes.includes(asset.type)) {
      if (typeof minDuration === "number") {
        if (typeof asset.durationSec !== "number" || asset.durationSec < minDuration) {
          return false;
        }
      }

      if (typeof maxDuration === "number") {
        if (typeof asset.durationSec !== "number" || asset.durationSec > maxDuration) {
          return false;
        }
      }
    }

    return true;
  });
}

function filterAssetsByProjectHistory(assets, usageHistory, projectId) {
  if (!projectId) {
    return assets;
  }

  return assets.filter((asset) => {
    const usage = normalizeUsageEntry(usageHistory[asset.id]);
    return !usage.project_ids.includes(projectId);
  });
}

function filterAssetsByExcludedIds(assets, excludedAssetIds) {
  if (!Array.isArray(excludedAssetIds) || !excludedAssetIds.length) {
    return assets;
  }

  return assets.filter((asset) => !excludedAssetIds.includes(asset.id));
}

function groupAssetsByUsage(assets, usageHistory) {
  const groups = {};

  for (const asset of assets) {
    const usage = normalizeUsageEntry(usageHistory[asset.id]);
    const key = usage.times_used;

    if (!groups[key]) {
      groups[key] = [];
    }

    groups[key].push(asset);
  }

  return groups;
}

function selectFromLowestUsageGroup(assets, usageHistory) {
  if (!assets.length) {
    return null;
  }

  const groups = groupAssetsByUsage(assets, usageHistory);
  const usageKeys = Object.keys(groups).map(Number).sort((a, b) => a - b);

  if (!usageKeys.length) {
    return null;
  }

  const lowestGroup = groups[usageKeys[0]] || [];

  if (!lowestGroup.length) {
    return null;
  }

  const index = Math.floor(Math.random() * lowestGroup.length);
  return lowestGroup[index];
}

function selectAssetForScene(sceneRequest = {}) {
  try {
    const assets = loadAssetLibrary();
    const usageHistory = loadUsageHistory();

    let candidates = filterActiveAssets(assets);
    candidates = filterAssetsByCriteria(candidates, sceneRequest);
    candidates = filterAssetsByProjectHistory(
      candidates,
      usageHistory,
      sceneRequest.projectId
    );
    candidates = filterAssetsByExcludedIds(
      candidates,
      sceneRequest.excludedAssetIds
    );

    const selected = selectFromLowestUsageGroup(candidates, usageHistory);

    if (!selected) {
      return {
        selected: false,
        reason: "no_matching_assets"
      };
    }

    return {
      selected: true,
      asset: {
        id: selected.id,
        filename: selected.filename,
        path: selected.path,
        type: selected.type,
        durationSec: selected.durationSec ?? null,
        orientation: selected.orientation ?? null
      }
    };
  } catch (error) {
    return {
      selected: false,
      reason: error.message || "asset_selection_failed"
    };
  }
}

function recordAssetUsage(assetId, projectId) {
  const usageHistory = loadUsageHistory();
  const usage = normalizeUsageEntry(usageHistory[assetId]);

  usage.times_used += 1;
  usage.last_used_at = new Date().toISOString();

  if (projectId && !usage.project_ids.includes(projectId)) {
    usage.project_ids.push(projectId);
  }

  usageHistory[assetId] = usage;
  saveUsageHistory(usageHistory);

  return true;
}

module.exports = {
  loadAssetLibrary,
  loadUsageHistory,
  filterActiveAssets,
  filterAssetsByCriteria,
  filterAssetsByProjectHistory,
  filterAssetsByExcludedIds,
  groupAssetsByUsage,
  selectFromLowestUsageGroup,
  selectAssetForScene,
  recordAssetUsage
};
