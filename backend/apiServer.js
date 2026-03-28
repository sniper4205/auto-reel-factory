const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

let runAutoReelApp = null;

try {
  ({ runAutoReelApp } = require("./runAutoReelApp"));
} catch (error) {
  console.warn("runAutoReelApp could not be loaded:", error.message);
}

const app = express();
const PORT = 5001;

const PROJECT_ROOT = path.resolve(__dirname, "..");
const OUTPUT_ROOT = path.join(PROJECT_ROOT, "output");

app.use(cors());
app.use(express.json({ limit: "50mb" }));

// serve generated images/videos
app.use("/output", express.static(OUTPUT_ROOT));

function cleanText(text = "") {
  return String(text).replace(/\r/g, "").trim();
}

function splitStoryIntoLines(story = "") {
  return cleanText(story)
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function buildSimpleScript({ story = "", niche = "story", language = "English" }) {
  const lines = splitStoryIntoLines(story);

  const hook =
    lines[0] || "This story begins with a moment that changes everything.";

  let scenes = lines.slice(1);

  if (!scenes.length) {
    scenes = [
      "The story begins.",
      "Something changes.",
      "The tension grows.",
      "The story ends with a strong payoff.",
    ];
  }

  if (scenes.length > 8) {
    scenes = scenes.slice(0, 8);
  }

  const narration = [hook, ...scenes].join(" ");

  return {
    ok: true,
    script: {
      niche,
      language,
      subject: hook,
      hook,
      scenes,
      narration,
      sourceStory: story,
    },
  };
}

function buildSimpleScenes({ story = "", sceneCount = 4 }) {
  const lines = splitStoryIntoLines(story);

  let scenes = lines.filter(Boolean);

  if (!scenes.length) {
    scenes = [
      "Opening scene",
      "Middle scene",
      "Tension scene",
      "Ending scene",
    ];
  }

  scenes = scenes.slice(0, Number(sceneCount) || 4);

  while (scenes.length < (Number(sceneCount) || 4)) {
    scenes.push(`Scene ${scenes.length + 1}`);
  }

  return {
    ok: true,
    scenes,
  };
}

function toPublicOutputUrl(absPath) {
  const relativePath = path
    .relative(OUTPUT_ROOT, absPath)
    .split(path.sep)
    .join("/");

  return `http://localhost:${PORT}/output/${relativePath}`;
}

app.get("/health", (req, res) => {
  res.json({
    ok: true,
    service: "Auto Reel Factory API",
    port: PORT,
  });
});

app.post("/generate-script", async (req, res) => {
  try {
    const { story = "", niche = "story", language = "English" } = req.body || {};
    const result = buildSimpleScript({ story, niche, language });
    return res.json(result);
  } catch (error) {
    console.error("/generate-script error:", error);
    return res.status(500).json({
      ok: false,
      error: error.message || "Generate script failed",
    });
  }
});

app.post("/generate-scenes", async (req, res) => {
  try {
    const { story = "", sceneCount = 4 } = req.body || {};
    const result = buildSimpleScenes({ story, sceneCount });
    return res.json(result);
  } catch (error) {
    console.error("/generate-scenes error:", error);
    return res.status(500).json({
      ok: false,
      error: error.message || "Generate scenes failed",
    });
  }
});

/*
GENERATE IMAGES
This runs the full engine (images + render pipeline)
but frontend only uses the images returned
*/

app.post("/generate-images", async (req, res) => {
  try {
    if (!runAutoReelApp) {
      return res.status(500).json({
        ok: false,
        error: "runAutoReelApp is not available",
      });
    }

    const input = req.body || {};

    const result = await runAutoReelApp({
      projectId: input.projectId || "fast_test",
      niche: input.niche || "history",
      language: input.language || "english",
      voice: input.voice || "female",
      music: input.music || "none",
      visualStyle: input.visualStyle || "cinematic",
      captionStyle: input.captionStyle || "bold",
      effects: input.effects || "none",
      subject: input.subject || "a dramatic short story",
      seed: Number.isFinite(input.seed) ? input.seed : 12345,
      testMode: input.testMode !== false,
      maxScenes: Number.isFinite(input.maxScenes) ? input.maxScenes : 4,
      story: input.story || "",
      hook: input.hook || "",
      scenes: Array.isArray(input.scenes) ? input.scenes : [],
      narration: input.narration || "",
      characters: Array.isArray(input.characters) ? input.characters : [],
      outputRoot: input.outputRoot || OUTPUT_ROOT,
    });

    const imageFiles =
      Array.isArray(result?.timeline)
        ? result.timeline.map((item) => item.file).filter(Boolean)
        : [];

    const imageUrls = imageFiles.map((filePath, index) => ({
      scene: index,
      image: toPublicOutputUrl(filePath),
      file: filePath,
    }));

    return res.json({
      ok: true,
      imageUrls,
      ...result,
    });
  } catch (error) {
    console.error("/generate-images error:", error);
    return res.status(500).json({
      ok: false,
      error: error.message || "Generate images failed",
    });
  }
});

/*
RENDER VIDEO
IMPORTANT:
This version DOES NOT regenerate images.
It simply uses existing output images.
*/

app.post("/render-video", async (req, res) => {
  try {
    const input = req.body || {};
    const projectId = input.projectId || "fast_test";

    const projectOutputDir = path.join(OUTPUT_ROOT, projectId);

    if (!fs.existsSync(projectOutputDir)) {
      return res.status(400).json({
        ok: false,
        error: "No project output found. Generate images first.",
      });
    }

    const imageFiles = fs
      .readdirSync(projectOutputDir)
      .filter((file) => file.endsWith(".png"))
      .sort()
      .map((file) => path.join(projectOutputDir, file));

    if (!imageFiles.length) {
      return res.status(400).json({
        ok: false,
        error: "No generated images found.",
      });
    }

    const videoPath = path.join(OUTPUT_ROOT, `${projectId}.mp4`);

    if (!fs.existsSync(videoPath)) {
      return res.json({
        ok: false,
        error: "Video not rendered yet. Images exist but video missing.",
      });
    }

    return res.json({
      ok: true,
      video: videoPath,
      videoUrl: toPublicOutputUrl(videoPath),
      reusedImages: imageFiles,
      message: "Using existing rendered video.",
    });
  } catch (error) {
    console.error("/render-video error:", error);
    return res.status(500).json({
      ok: false,
      error: error.message || "Render video failed",
    });
  }
});

app.listen(PORT, () => {
  console.log(`Auto Reel Factory API running at http://localhost:${PORT}`);
});
