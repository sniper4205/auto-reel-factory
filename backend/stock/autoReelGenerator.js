const { generateScriptFromTopic } = require("./scriptGenerator");
const { attachAssetsToScenes } = require("./sceneAssetIntegrator");
const { generateScenePreviews } = require("./previewGenerator");
const { generateVisualJobs, markAllPreviewsApproved } = require("./visualGenerator");
const { routeVisualsForScenes } = require("./visualRouter");
const { renderScenes } = require("./sceneRenderer");
const { mergeSceneClips } = require("./sceneMerger");
const { generateVoiceover } = require("./voiceoverGenerator");
const { assembleFinalVideo } = require("./finalAssembler");
const { addBackgroundMusic } = require("./musicMixer");

async function generateAutoReel(options = {}) {
  let {
    script,
    topic,
    projectId,
    musicPath,
    visualStyle = "realism"
  } = options;

  if (!script && topic) {
    script = generateScriptFromTopic(topic);
  }

  if (!script) {
    return {
      ok: false,
      error: "script_required"
    };
  }

  if (!projectId) {
    projectId = "reel_" + Date.now();
  }

  // Build base scenes first
  let scenes = attachAssetsToScenes(script, projectId);

  // Build AI previews using selected style
  let previews = generateScenePreviews({
    script,
    visualStyle
  });

  // Auto approve previews for now
  previews = markAllPreviewsApproved(previews);

  // IMPORTANT FIX:
  // pass projectId so every generated image gets a unique filename
  const visualJobs = await generateVisualJobs(previews, { projectId });

  // Route generated visuals back into scenes
  scenes = routeVisualsForScenes(scenes, visualJobs);

  // Render scene clips
  const renderedScenes = renderScenes(scenes);

  // Merge all scene clips
  const merged = mergeSceneClips(renderedScenes, projectId);

  // Generate voice
  const voice = generateVoiceover(script, projectId);

  // Assemble final video with voice
  const finalVideo = assembleFinalVideo(
    merged.path,
    voice.path,
    projectId
  );

  let finalVideoPath = finalVideo.path;

  // Add background music if provided
  if (musicPath) {
    const withMusic = addBackgroundMusic(
      finalVideo.path,
      musicPath,
      projectId
    );
    finalVideoPath = withMusic.path;
  }

  return {
    ok: true,
    projectId,
    script,
    visualStyle,
    finalVideo: finalVideoPath,
    scenes,
    visualJobs,
    renderedScenes
  };
}

module.exports = {
  generateAutoReel
};
