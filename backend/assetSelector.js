```javascript
const {
  getAssets,
  getUsageHistory
} = require("./metadataStore");

/* --------------------------------------------------
LOAD DATA
-------------------------------------------------- */

function loadAssetLibrary() {
  const assets = getAssets();
  return Array.isArray(assets) ? assets : [];
}

function loadUsageHistory() {
  const usage = getUsageHistory();

  if (!usage || typeof usage !== "object" || Array.isArray(usage)) {
    return {};
  }

  return usage;
}

/* --------------------------------------------------
HELPERS
-------------------------------------------------- */

function getUsageEntry(assetId, usageHistory) {
  const entry = usageHistory[assetId];

  if (!entry || typeof entry !== "object") {
    return {
      times_used: 0,
      last_used_at: null,
      project_ids: []
    };
  }

  return {
    times_used: typeof entry.times_used === "number" ? entry.times_used : 0,
    last_used_at: entry.last_used_at || null,
    project_ids: Array.isArray(entry.project_ids) ? entry.project_ids : []
  };
}

/* --------------------------------------------------
FILTERS
-------------------------------------------------- */

function filterActiveAssets(assets) {
  return assets.filter(asset => asset?.status === "active");
}

function filterAssetsByCriteria(assets, criteria) {
  const {
    requiredType,
    orientation,
    minDuration,
    maxDuration
  } = criteria || {};

  return assets.filter(asset => {
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
      const duration = asset.durationSec;

      if (typeof minDuration === "number" && duration < minDuration) {
        return false;
      }

      if (typeof maxDuration === "number" && duration > maxDuration) {
        return false;
      }
    }

    return true;
  });
}

function filterAssetsByProjectHistory(assets, usageHistory, projectId) {
  if (!projectId) return assets;

  return assets.filter(asset => {
    const usage = getUsageEntry(asset.id, usageHistory);
    return !usage.project_ids.includes(projectId);
  });
}

function filterAssetsByExcludedIds(assets, excludedAssetIds) {
  if (!Array.isArray(excludedAssetIds) || excludedAssetIds.length === 0) {
    return assets;
  }

  const excluded = new Set(excludedAssetIds);

  return assets.filter(asset => !excluded.has(asset.id));
}

/* --------------------------------------------------
USAGE BALANCING
-------------------------------------------------- */

function groupAssetsByUsage(assets, usageHistory) {
  const groups = {};

  for (const asset of assets) {
    const usage = getUsageEntry(asset.id, usageHistory);
    const count = usage.times_used || 0;

    if (!groups[count]) {
      groups[count] = [];
    }

    groups[count].push(asset);
  }

  return groups;
}

function selectFromLowestUsageGroup(groups) {
  const usageLevels = Object.keys(groups)
    .map(Number)
    .sort((a, b) => a - b);

  if (usageLevels.length === 0) {
    return null;
  }

  const lowest = usageLevels[0];
  const candidates = groups[lowest];

  if (!Array.isArray(candidates) || candidates.length === 0) {
    return null;
  }

  const index = Math.floor(Math.random() * candidates.length);
  return candidates[index];
}

/* --------------------------------------------------
MAIN SELECTOR
-------------------------------------------------- */

function selectAssetForScene(sceneRequest) {
  try {
    const {
      projectId,
      excludedAssetIds
    } = sceneRequest || {};

    let assets = loadAssetLibrary();
    const usageHistory = loadUsageHistory();

    assets = filterActiveAssets(assets);

    assets = filterAssetsByCriteria(assets, sceneRequest);

    assets = filterAssetsByProjectHistory(
      assets,
      usageHistory,
      projectId
    );

    assets = filterAssetsByExcludedIds(
      assets,
      excludedAssetIds
    );

    if (!assets.length) {
      return {
        selected: false,
        reason: "no_matching_assets"
      };
    }

    const groups = groupAssetsByUsage(assets, usageHistory);

    const selected = selectFromLowestUsageGroup(groups);

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
        durationSec: selected.durationSec || null,
        orientation: selected.orientation || null
      }
    };

  } catch (error) {
    return {
      selected: false,
      reason: error.message || "selector_failed"
    };
  }
}

/* --------------------------------------------------
USAGE UPDATE
-------------------------------------------------- */

function recordAssetUsage(assetId, projectId) {
  const usageHistory = loadUsageHistory();

  if (!usageHistory[assetId]) {
    usageHistory[assetId] = {
      times_used: 0,
      last_used_at: null,
      project_ids: []
    };
  }

  usageHistory[assetId].times_used += 1;
  usageHistory[assetId].last_used_at = new Date().toISOString();

  if (
    projectId &&
    !usageHistory[assetId].project_ids.includes(projectId)
  ) {
    usageHistory[assetId].project_ids.push(projectId);
  }

  const { saveUsageHistory } = require("./metadataStore");
  saveUsageHistory(usageHistory);

  return true;
}

/* --------------------------------------------------
EXPORTS
-------------------------------------------------- */

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

