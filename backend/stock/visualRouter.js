const fs = require("fs");

function useGeneratedVisual(job) {
  if (!job || !job.outputPath) {
    return null;
  }

  if (!fs.existsSync(job.outputPath)) {
    return null;
  }

  return {
    id: `ai_scene_${job.sceneId}`,
    filename: job.outputPath.split("/").pop(),
    path: job.outputPath,
    type: "image",
    durationSec: null,
    orientation: "portrait",
    source: "ai_generated"
  };
}

function useStockFallback(scene) {
  if (!scene || !scene.asset) {
    return null;
  }

  return {
    ...scene.asset,
    source: "stock_fallback"
  };
}

function routeVisualForScene(scene, visualJob) {
  const generated = useGeneratedVisual(visualJob);

  if (generated) {
    return {
      ...scene,
      asset: generated,
      visualSource: "ai_generated"
    };
  }

  const stock = useStockFallback(scene);

  if (stock) {
    return {
      ...scene,
      asset: stock,
      visualSource: "stock_fallback"
    };
  }

  return {
    ...scene,
    asset: null,
    visualSource: "missing",
    assetError: "no_visual_available"
  };
}

function routeVisualsForScenes(scenes, visualJobs) {
  const sceneList = Array.isArray(scenes) ? scenes : [];
  const jobList = Array.isArray(visualJobs) ? visualJobs : [];

  return sceneList.map((scene) => {
    const matchingJob = jobList.find((job) => job.sceneId === scene.sceneId);
    return routeVisualForScene(scene, matchingJob);
  });
}

module.exports = {
  useGeneratedVisual,
  useStockFallback,
  routeVisualForScene,
  routeVisualsForScenes
};
