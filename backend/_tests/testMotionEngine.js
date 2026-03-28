const { renderStoryScenes } = require("./stock/sceneRenderer");
const { buildMotionPlan, renderMotionTimeline } = require("./engines/motionEngine");

async function test() {

  const script =
    "Sara and Zara are talking in the living room before going for a drive";

  const render = await renderStoryScenes(script, {
    visualStyle: "anime",
    projectId: "motion_connect_test",
    seed: 12345
  });

  const motionScenes = buildMotionPlan(render.scenes);

  const timeline = renderMotionTimeline(motionScenes);

  console.log(JSON.stringify(timeline, null, 2));
}

test();
