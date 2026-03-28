const { buildSceneRequests } = require("./sceneSplitter");
const { analyzeScenes } = require("./sceneAnalyzer");
const { buildPromptPackages } = require("./promptBuilder");

function generateScenePreviews(options = {}) {
  const {
    script = "",
    visualStyle = "realism"
  } = options;

  const scenes = buildSceneRequests(script);
  const analyzedScenes = analyzeScenes(scenes, visualStyle);
  const promptPackages = buildPromptPackages(analyzedScenes);

  return analyzedScenes.map((scene, index) => ({
    sceneId: scene.sceneId,
    text: scene.text,
    analysis: {
      ...scene,
      visualStyle
    },
    previewPrompt: promptPackages[index]?.prompt || "",
    negativePrompt: promptPackages[index]?.negativePrompt || "",
    approved: false
  }));
}

module.exports = {
  generateScenePreviews
};
