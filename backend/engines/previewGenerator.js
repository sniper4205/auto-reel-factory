const { buildPromptPackages } = require("../stock/promptBuilder");

function splitScriptIntoScenes(script) {
  if (!script) return [];

  const sentences = script
    .split(".")
    .map((s) => s.trim())
    .filter(Boolean);

  return sentences.map((text, index) => ({
    sceneId: index + 1,
    text
  }));
}

function generateScenePreviews({ script, visualStyle = "realism" }) {
  const scenes = splitScriptIntoScenes(script);

  const analyzedScenes = scenes.map((scene) => ({
    sceneId: scene.sceneId,
    text: scene.text,
    visualStyle
  }));

  const prompts = buildPromptPackages(analyzedScenes);

  return prompts.map((p) => ({
    sceneId: p.sceneId,
    text: analyzedScenes.find((s) => s.sceneId === p.sceneId).text,
    prompt: p.prompt,
    negativePrompt: p.negativePrompt,
    visualStyle: p.visualStyle,
    seed: p.seed,
    referenceImage: p.referenceImage,
    router: p.router
  }));
}

module.exports = {
  generateScenePreviews
};
