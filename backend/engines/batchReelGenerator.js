const { createProjectConfig } = require("./wizardEngine");
const { renderStoryScenes } = require("../stock/sceneRenderer");
const { buildMotionPlan, renderMotionTimeline } = require("./motionEngine");
const { generateVoices } = require("./voiceEngine");
const { generateSubtitles } = require("./subtitleEngine");
const { composeReel } = require("./reelComposer");

async function generateBatchReels(items = []) {
  const results = [];

  for (let i = 0; i < items.length; i++) {
    const item = items[i];

    const config = createProjectConfig({
      projectId: item.projectId || `batch_${Date.now()}_${i + 1}`,
      niche: item.niche || "general",
      language: item.language || "english",
      voice: item.voice || "female",
      music: item.music || "auto",
      visualStyle: item.visualStyle || "anime",
      captionStyle: item.captionStyle || "bold",
      effects: item.effects || "pan_zoom",
      renderMode: item.renderMode || "fast"
    });

    console.log(`\n=== STARTING PROJECT: ${config.projectId} ===`);

    const render = await renderStoryScenes(item.script, {
      visualStyle: config.visualStyle,
      projectId: config.projectId,
      seed: item.seed || 12345,
      useCache: true,
      renderMode: config.renderMode
    });

    const motionScenes = buildMotionPlan(render.scenes);
    const timeline = renderMotionTimeline(motionScenes);

const voicePack = generateVoices(item.script, config.projectId);
const mergedVoiceFile = voicePack.mergedAudio;
const subtitleFile = await generateSubtitles(voicePack.lines, config.projectId);

const outputVideo = composeReel(
  timeline,
  config.projectId,
  mergedVoiceFile,
  subtitleFile
);

    results.push({
      projectId: config.projectId,
      niche: config.niche,
      visualStyle: config.visualStyle,
      renderMode: config.renderMode,
      output: outputVideo
    });

    console.log(`=== FINISHED PROJECT: ${config.projectId} ===\n`);
  }

  return results;
}

module.exports = {
  generateBatchReels
};
