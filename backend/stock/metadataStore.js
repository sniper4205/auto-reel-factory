const fs = require("fs");
const path = require("path");

const BASE_DIR = path.join(__dirname, "../../assets/metadata");

const FILES = {
  assets: path.join(BASE_DIR, "assets.json"),
  usageHistory: path.join(BASE_DIR, "usage-history.json"),
  duplicateHashes: path.join(BASE_DIR, "duplicate-hashes.json"),
  importLog: path.join(BASE_DIR, "import-log.json"),
  config: path.join(BASE_DIR, "config.json")
};

const DEFAULT_CONFIG = {
  allowed_extensions: {
    images: [".jpg", ".jpeg", ".png", ".webp"],
    videos: [".mp4", ".mov", ".webm"],
    audio: [".mp3", ".wav", ".m4a"],
    overlays: [".mp4", ".mov", ".webm"],
    endings: [".mp4", ".mov", ".webm"]
  },
  clip_rules: {
    preferred_min_duration: 5,
    preferred_max_duration: 10,
    max_duration: 15
  }
};

function ensureBaseDir() {
  if (!fs.existsSync(BASE_DIR)) {
    fs.mkdirSync(BASE_DIR, { recursive: true });
  }
}

function ensureFile(filePath, defaultValue) {
  ensureBaseDir();

  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(defaultValue, null, 2), "utf8");
    return;
  }

  const raw = fs.readFileSync(filePath, "utf8").trim();
  if (!raw) {
    fs.writeFileSync(filePath, JSON.stringify(defaultValue, null, 2), "utf8");
  }
}

function safeReadJson(filePath, defaultValue) {
  try {
    ensureFile(filePath, defaultValue);
    const raw = fs.readFileSync(filePath, "utf8");
    const parsed = JSON.parse(raw);

    if (parsed === null || parsed === undefined) {
      return defaultValue;
    }

    return parsed;
  } catch (error) {
    try {
      fs.writeFileSync(filePath, JSON.stringify(defaultValue, null, 2), "utf8");
    } catch (_) {}
    return defaultValue;
  }
}

function safeWriteJson(filePath, data) {
  ensureBaseDir();

  const tempPath = `${filePath}.tmp`;
  fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), "utf8");
  fs.renameSync(tempPath, filePath);
  return true;
}

function getAssets() {
  const data = safeReadJson(FILES.assets, []);
  return Array.isArray(data) ? data : [];
}

function saveAssets(data) {
  return safeWriteJson(FILES.assets, Array.isArray(data) ? data : []);
}

function getUsageHistory() {
  const data = safeReadJson(FILES.usageHistory, {});
  return data && typeof data === "object" && !Array.isArray(data) ? data : {};
}

function saveUsageHistory(data) {
  const safeData =
    data && typeof data === "object" && !Array.isArray(data) ? data : {};
  return safeWriteJson(FILES.usageHistory, safeData);
}

function getDuplicateHashes() {
  const data = safeReadJson(FILES.duplicateHashes, {});
  return data && typeof data === "object" && !Array.isArray(data) ? data : {};
}

function saveDuplicateHashes(data) {
  const safeData =
    data && typeof data === "object" && !Array.isArray(data) ? data : {};
  return safeWriteJson(FILES.duplicateHashes, safeData);
}

function getImportLog() {
  const data = safeReadJson(FILES.importLog, []);
  return Array.isArray(data) ? data : [];
}

function saveImportLog(data) {
  return safeWriteJson(FILES.importLog, Array.isArray(data) ? data : []);
}

function appendImportLog(entry) {
  const log = getImportLog();
  log.push(entry);
  return saveImportLog(log);
}

function getConfig() {
  const data = safeReadJson(FILES.config, DEFAULT_CONFIG);

  if (!data.allowed_extensions || typeof data.allowed_extensions !== "object") {
    data.allowed_extensions = DEFAULT_CONFIG.allowed_extensions;
  }

  if (!data.clip_rules || typeof data.clip_rules !== "object") {
    data.clip_rules = DEFAULT_CONFIG.clip_rules;
  }

  return data;
}

function saveConfig(data) {
  const safeData =
    data && typeof data === "object" && !Array.isArray(data)
      ? data
      : DEFAULT_CONFIG;

  return safeWriteJson(FILES.config, safeData);
}

module.exports = {
  safeReadJson,
  safeWriteJson,
  getAssets,
  saveAssets,
  getUsageHistory,
  saveUsageHistory,
  getDuplicateHashes,
  saveDuplicateHashes,
  getImportLog,
  saveImportLog,
  appendImportLog,
  getConfig,
  saveConfig,
  DEFAULT_CONFIG
};
