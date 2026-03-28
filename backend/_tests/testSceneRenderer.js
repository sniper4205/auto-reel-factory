const { renderStoryScenes } = require("./stock/sceneRenderer");

async function main() {
  const script =
    "Sara and Zara are talking in the living room before going for a drive";

  try {
    const result = await renderStoryScenes(script, {
      visualStyle: "anime",
      projectId: "smart_director_test_001",
      seed: 12345
    });

    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error("scene renderer failed:");
    console.error(error);
    process.exit(1);
  }
}

main();
