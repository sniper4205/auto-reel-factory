const fs = require("fs");
const path = require("path");
const https = require("https");
const { PATHS } = require("./folderSetup");

const PEXELS_API_KEY = process.env.PEXELS_API_KEY || "";

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function makeSafeFileName(name) {
  return String(name || "asset")
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function downloadFile(url, outputPath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(outputPath);

    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        file.close();
        fs.unlink(outputPath, () => {});
        return reject(new Error(`download_failed_${response.statusCode}`));
      }

      response.pipe(file);

      file.on("finish", () => {
        file.close(() => resolve(outputPath));
      });
    }).on("error", (error) => {
      file.close();
      fs.unlink(outputPath, () => {});
      reject(error);
    });
  });
}

function fetchJson(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, { headers }, (res) => {
      let data = "";

      res.on("data", (chunk) => {
        data += chunk;
      });

      res.on("end", () => {
        try {
          const parsed = JSON.parse(data);
          resolve(parsed);
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on("error", reject);
    req.end();
  });
}

async function searchPexelsImages(query, perPage = 5) {
  if (!PEXELS_API_KEY) {
    throw new Error("missing_pexels_api_key");
  }

  const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${perPage}`;
  const data = await fetchJson(url, {
    Authorization: PEXELS_API_KEY
  });

  return Array.isArray(data.photos) ? data.photos : [];
}

async function searchPexelsVideos(query, perPage = 5) {
  if (!PEXELS_API_KEY) {
    throw new Error("missing_pexels_api_key");
  }

  const url = `https://api.pexels.com/videos/search?query=${encodeURIComponent(query)}&per_page=${perPage}`;
  const data = await fetchJson(url, {
    Authorization: PEXELS_API_KEY
  });

  return Array.isArray(data.videos) ? data.videos : [];
}

async function downloadPexelsImages(query, perPage = 3) {
  ensureDir(PATHS.inboxImages);

  const photos = await searchPexelsImages(query, perPage);
  const results = [];

  for (let i = 0; i < photos.length; i++) {
    const photo = photos[i];
    const imageUrl = photo?.src?.large2x || photo?.src?.large || photo?.src?.original;

    if (!imageUrl) continue;

    const fileName = makeSafeFileName(`${query}_image_${photo.id || i}.jpg`);
    const outputPath = path.join(PATHS.inboxImages, fileName);

    try {
      await downloadFile(imageUrl, outputPath);
      results.push({
        ok: true,
        type: "image",
        query,
        path: outputPath
      });
    } catch (error) {
      results.push({
        ok: false,
        type: "image",
        query,
        error: error.message
      });
    }
  }

  return results;
}

function pickBestVideoFile(videoFiles) {
  if (!Array.isArray(videoFiles) || !videoFiles.length) {
    return null;
  }

  const mp4Files = videoFiles.filter((f) => String(f?.file_type || "").includes("mp4"));
  const sorted = (mp4Files.length ? mp4Files : videoFiles).slice().sort((a, b) => {
    const aWidth = a?.width || 0;
    const bWidth = b?.width || 0;
    return bWidth - aWidth;
  });

  return sorted[0] || null;
}

async function downloadPexelsVideos(query, perPage = 2) {
  ensureDir(PATHS.inboxVideos);

  const videos = await searchPexelsVideos(query, perPage);
  const results = [];

  for (let i = 0; i < videos.length; i++) {
    const video = videos[i];
    const bestFile = pickBestVideoFile(video?.video_files);

    if (!bestFile?.link) continue;

    const fileName = makeSafeFileName(`${query}_video_${video.id || i}.mp4`);
    const outputPath = path.join(PATHS.inboxVideos, fileName);

    try {
      await downloadFile(bestFile.link, outputPath);
      results.push({
        ok: true,
        type: "video",
        query,
        path: outputPath
      });
    } catch (error) {
      results.push({
        ok: false,
        type: "video",
        query,
        error: error.message
      });
    }
  }

  return results;
}

async function downloadStockForKeyword({ query, images = 3, videos = 2 }) {
  const imageResults = await downloadPexelsImages(query, images);
  const videoResults = await downloadPexelsVideos(query, videos);

  return {
    ok: true,
    query,
    images: imageResults,
    videos: videoResults
  };
}

module.exports = {
  searchPexelsImages,
  searchPexelsVideos,
  downloadPexelsImages,
  downloadPexelsVideos,
  downloadStockForKeyword
};
