const { selectAssetForScene } = require("./assetSelector");

function splitScriptIntoScenes(script) {

  const sentences = script
    .split(".")
    .map(s => s.trim())
    .filter(Boolean);

  const scenes = [];

  let id = 1;

  for (const sentence of sentences) {

    scenes.push({
      sceneId: id++,
      text: sentence + ".",
      sceneType: "visual",
      requiredType: "image",
      orientation: "portrait",
      minDuration: 2,
      maxDuration: 4
    });

  }

  return scenes;

}

function attachAssetsToScenes(script, projectId) {

  const scenes = splitScriptIntoScenes(script);

  const usedIds = [];

  for (const scene of scenes) {

    try {

      const result = selectAssetForScene({
        requiredType: scene.requiredType,
        orientation: scene.orientation,
        minDuration: scene.minDuration,
        maxDuration: scene.maxDuration,
        projectId,
        excludedAssetIds: usedIds
      });

      if (result && result.selected && result.asset) {

        scene.asset = result.asset;
        usedIds.push(result.asset.id);

      } else {

        scene.asset = null;
        scene.assetError = "no_matching_assets";

      }

    } catch (err) {

      scene.asset = null;
      scene.assetError = err.message;

    }

  }

  return scenes;

}

module.exports = {
  attachAssetsToScenes
};
