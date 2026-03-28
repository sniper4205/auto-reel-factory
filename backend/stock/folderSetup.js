const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "../../assets");

const PATHS = {
  root: ROOT,

  inboxRoot: path.join(ROOT, "_inbox"),
  inboxImages: path.join(ROOT, "_inbox/images"),
  inboxVideos: path.join(ROOT, "_inbox/videos"),
  inboxAudio: path.join(ROOT, "_inbox/audio"),
  inboxOverlays: path.join(ROOT, "_inbox/overlays"),
  inboxEndings: path.join(ROOT, "_inbox/endings"),

  stockRoot: path.join(ROOT, "stock"),
  stockVisuals: path.join(ROOT, "stock/visuals"),
  stockImages: path.join(ROOT, "stock/visuals/images"),
  stockVideos: path.join(ROOT, "stock/visuals/videos"),

  audioRoot: path.join(ROOT, "audio"),
  music: path.join(ROOT, "audio/music"),

  overlays: path.join(ROOT, "overlays"),
  endings: path.join(ROOT, "endings"),
  subtitles: path.join(ROOT, "subtitles"),

  metadata: path.join(ROOT, "metadata"),
  generated: path.join(ROOT, "generated"),
  thumbnails: path.join(ROOT, "generated/thumbnails"),
  scenes: path.join(ROOT, "generated/scenes"),
  final: path.join(ROOT, "generated/final"),
  voiceovers: path.join(ROOT, "generated/voiceovers"),
  temp: path.join(ROOT, "generated/temp"),
  sceneTemp: path.join(ROOT, "generated/scene-temp")
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

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function ensureJsonFile(filePath, defaultValue) {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(defaultValue, null, 2), "utf8");
    return;
  }

  const raw = fs.readFileSync(filePath, "utf8").trim();
  if (!raw) {
    fs.writeFileSync(filePath, JSON.stringify(defaultValue, null, 2), "utf8");
  }
}

function verifyStockFolders() {
  const dirs = [
    PATHS.root,
    PATHS.inboxRoot,
    PATHS.inboxImages,
    PATHS.inboxVideos,
    PATHS.inboxAudio,
    PATHS.inboxOverlays,
    PATHS.inboxEndings,
    PATHS.stockRoot,
    PATHS.stockVisuals,
    PATHS.stockImages,
    PATHS.stockVideos,
    PATHS.audioRoot,
    PATHS.music,
    PATHS.overlays,
    PATHS.endings,
    PATHS.subtitles,
    PATHS.metadata,
    PATHS.generated,
    PATHS.thumbnails,
    PATHS.scenes,
    PATHS.final,
    PATHS.voiceovers,
    PATHS.temp,
    PATHS.sceneTemp
  ];

  for (const dir of dirs) {
    ensureDir(dir);
  }

  ensureJsonFile(path.join(PATHS.metadata, "assets.json"), []);
  ensureJsonFile(path.join(PATHS.metadata, "usage-history.json"), {});
  ensureJsonFile(path.join(PATHS.metadata, "duplicate-hashes.json"), {});
  ensureJsonFile(path.join(PATHS.metadata, "import-log.json"), []);
  ensureJsonFile(path.join(PATHS.metadata, "config.json"), DEFAULT_CONFIG);

  return {
    ok: true,
    message: "Stock asset folders and config verified."
  };
}

module.exports = {
  PATHS,
  DEFAULT_CONFIG,
  verifyStockFolders
};
