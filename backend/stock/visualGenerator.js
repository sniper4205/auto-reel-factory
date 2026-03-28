const fs = require("fs");
const path = require("path");
const { generateAIImage } = require("./aiImageGenerator");

const OUTPUT_DIR = path.resolve(
  process.env.HOME,
  "AutoReelFactory/assets/generated/ai-visuals"
);

function ensureOutputDir() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
}

function makeSafeName(text) {
  return String(text || "scene")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 60);
}

function getSceneSeed(preview) {
  return (
    preview.analysis?.characterSeed ||
    preview.analysis?.seed ||
    12345
  );
}

function getCharacterName(preview) {
  return preview.analysis?.characterName || null;
}

function getOutputPath(preview, projectId = "project") {
  const safeProjectId = makeSafeName(projectId);

  return path.join(
    OUTPUT_DIR,
    `${safeProjectId}_${String(preview.sceneId).padStart(3, "0")}_${makeSafeName(preview.text)}.png`
  );
}

async function generateVisualJobs(previews, options = {}) {
  ensureOutputDir();

  const jobs = [];
  const characterReferenceMap = {};
  const projectId = options.projectId || "project";

  for (const preview of previews) {
    if (!preview.approved) continue;

    const outputPath = getOutputPath(preview, projectId);
    const seed = getSceneSeed(preview);
    const characterName = getCharacterName(preview);

    let referenceImage = "";

    if (characterName && characterReferenceMap[characterName]) {
      referenceImage = characterReferenceMap[characterName];
    }

    await generateAIImage(
      preview.previewPrompt,
      outputPath,
      seed,
      referenceImage
    );

    if (characterName && !characterReferenceMap[characterName]) {
      characterReferenceMap[characterName] = outputPath;
    }

    jobs.push({
      sceneId: preview.sceneId,
      text: preview.text,
      prompt: preview.previewPrompt,
      negativePrompt: preview.negativePrompt,
      visualStyle: preview.analysis?.visualStyle || "realism",
      characterName,
      seed,
      referenceImage: referenceImage || null,
      approved: true,
      outputPath,
      status: "generated"
    });
  }

  return jobs;
}

function markPreviewApproved(previews, sceneId) {
  return previews.map((p) => ({
    ...p,
    approved: p.sceneId === sceneId ? true : p.approved
  }));
}

function markAllPreviewsApproved(previews) {
  return previews.map((p) => ({
    ...p,
    approved: true
  }));
}

module.exports = {
  generateVisualJobs,
  markPreviewApproved,
  markAllPreviewsApproved
};
