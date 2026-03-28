const { renderStoryScenes } = require("./stock/sceneRenderer");
const { buildMotionPlan, renderMotionTimeline } = require("./engines/motionEngine");
const { composeReel } = require("./engines/reelComposer");

async function main() {
  const script =
    "Sara and Zara are talking in the living room before going for a drive";

  try {
    const render = await renderStoryScenes(script, {
      visualStyle: "anime",
      projectId: "final_reel_test_001",
      seed: 12345
    });

    const motionScenes = buildMotionPlan(render.scenes);
    const timeline = renderMotionTimeline(motionScenes);

    const result = composeReel(timeline, {
      projectId: "final_reel_test_001"
    });

    console.log(JSON.stringify({
      render,
      timeline,
      result
    }, null, 2));
  } catch (error) {
    console.error("reel composer failed:");
    console.error(error);
    process.exit(1);
  }
}

main();
