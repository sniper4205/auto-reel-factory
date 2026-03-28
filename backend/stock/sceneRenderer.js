const path = require("path");
const fs = require("fs");

const { buildPromptsFromScript } = require("./promptBuilder");
const { generateAIImage } = require("./aiImageGenerator");

async function renderStoryScenes(script, options = {}) {
  const {
    visualStyle = "anime",
    projectId = "project_" + Date.now(),
    seed = 12345,
    useCache = true,
    renderMode = "fast"
  } = options;

  const prompts = buildPromptsFromScript(script, { visualStyle, projectId });

  const outputDir = path.resolve(
    process.env.HOME,
    "AutoReelFactory/assets/generated/ai-visuals"
  );

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const results = [];

  for (let i = 0; i < prompts.length; i++) {
    const scene = prompts[i];

    const fileName =
      projectId +
      "_" +
      String(i + 1).padStart(3, "0") +
      "_" +
      scene.shotType +
      ".png";

    const outputPath = path.join(outputDir, fileName);
    const existsAlready = fs.existsSync(outputPath);

    if (useCache && existsAlready) {
      console.log("Using cached image:", fileName);
    } else {
      console.log(`Generating image (${renderMode}):`, fileName);

      await generateAIImage(
        scene.prompt,
        outputPath,
        seed,
        scene.negativePrompt,
        scene.steps,
        scene.guidanceScale
      );
    }

    results.push({
      sceneId: scene.sceneId,
      shotId: scene.shotId,
      sceneGroup: scene.sceneGroup,
      shotType: scene.shotType,
      description: scene.description,
      image: outputPath,
      prompt: scene.prompt,
      negativePrompt: scene.negativePrompt,
      visualStyle: scene.visualStyle,
      steps: scene.steps,
      guidanceScale: scene.guidanceScale,
      modelProfile: scene.modelProfile,
      characters: scene.characters || [],
      renderMode
    });
  }

  return {
    projectId,
    scenes: results
  };
}

module.exports = {
  renderStoryScenes
};
