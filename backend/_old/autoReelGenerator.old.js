const { generateAIImage } = require("./stock/aiImageGenerator");
const { buildPrompt } = require("./stock/promptBuilder");
const path = require("path");

function buildScenes(script) {
  const sentences = script
    .split(".")
    .map((s) => s.trim())
    .filter(Boolean);

  return sentences.map((text, index) => ({
    sceneId: index + 1,
    text
  }));
}

async function generateAutoReel(options = {}) {
  let { script, projectId, visualStyle = "anime" } = options;

  if (!script) {
    return { ok: false, error: "script_required" };
  }

  if (!projectId) {
    projectId = "reel_" + Date.now();
  }

  const scenes = buildScenes(script);
  const visuals = [];

  for (const scene of scenes) {
    const promptData = buildPrompt(scene.text, {
      visualStyle,
      seed: 12345
    });

    const filename =
      projectId +
      "_" +
      String(scene.sceneId).padStart(3, "0") +
      ".png";

    const outputPath = path.resolve(
      process.env.HOME,
      "AutoReelFactory/assets/generated/ai-visuals",
      filename
    );

    await generateAIImage(
      promptData.prompt,
      outputPath,
      promptData.seed
    );

    visuals.push({
      sceneId: scene.sceneId,
      text: scene.text,
      prompt: promptData.prompt,
      negativePrompt: promptData.negativePrompt,
      sceneType: promptData.sceneType,
      image: outputPath
    });
  }

  return {
    ok: true,
    projectId,
    script,
    visualStyle,
    scenes: visuals
  };
}

module.exports = {
  generateAutoReel
};
