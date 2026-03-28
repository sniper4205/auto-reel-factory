const fs = require("fs");
const path = require("path");
const { PATHS } = require("./folderSetup");

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function normalizeExtension(extension) {
  if (typeof extension !== "string") return null;
  return extension.toLowerCase();
}

function isValidExtension(extension) {
  return typeof extension === "string" && extension.startsWith(".") && extension.length > 1;
}

function getDestinationFolder(file) {
  switch (file?.type) {
    case "image":
      return PATHS.stockImages;
    case "video":
      return PATHS.stockVideos;
    case "audio":
      return PATHS.music;
    case "overlay":
      return PATHS.overlays;
    case "ending":
      return PATHS.endings;
    default:
      return null;
  }
}

function buildNewFileName(file) {
  if (!file?.sha1) {
    return {
      ok: false,
      error: "missing_sha1"
    };
  }

  const extension = normalizeExtension(file?.extension);

  if (!isValidExtension(extension)) {
    return {
      ok: false,
      error: "invalid_extension"
    };
  }

  return {
    ok: true,
    fileName: `${file.sha1}${extension}`
  };
}

function moveFileToStock(file) {
  try {
    if (!file || file.processed !== true) {
      return {
        ...file,
        moved: false,
        moveError: "asset_not_processed"
      };
    }

    if (!file.path || !fs.existsSync(file.path)) {
      return {
        ...file,
        moved: false,
        moveError: "source_file_missing"
      };
    }

    const destinationFolder = getDestinationFolder(file);

    if (!destinationFolder) {
      return {
        ...file,
        moved: false,
        moveError: `unsupported_destination_type_${file?.type}`
      };
    }

    ensureDir(destinationFolder);

    const fileNameResult = buildNewFileName(file);

    if (!fileNameResult.ok) {
      return {
        ...file,
        moved: false,
        moveError: fileNameResult.error
      };
    }

    const newFileName = fileNameResult.fileName;
    const newPath = path.resolve(destinationFolder, newFileName);

    if (fs.existsSync(newPath)) {
      return {
        ...file,
        moved: false,
        moveError: "file_already_exists"
      };
    }

    try {
      fs.renameSync(file.path, newPath);
    } catch (error) {
      if (error && error.code === "EXDEV") {
        fs.copyFileSync(file.path, newPath);

        if (!fs.existsSync(newPath)) {
          return {
            ...file,
            moved: false,
            moveError: "copy_failed"
          };
        }

        fs.unlinkSync(file.path);
      } else {
        throw error;
      }
    }

    return {
      ...file,
      moved: true,
      newFileName,
      newPath
    };
  } catch (error) {
    return {
      ...file,
      moved: false,
      moveError: error.message || "move_failed"
    };
  }
}

function moveProcessedAssets(processedResult) {
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
    grouped[key] = files.map((file) => moveFileToStock(file));
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
  getDestinationFolder,
  buildNewFileName,
  moveFileToStock,
  moveProcessedAssets
};
