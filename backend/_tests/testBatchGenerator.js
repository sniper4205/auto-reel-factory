const { generateBatchReels } = require("./engines/batchReelGenerator");

async function main() {
  const items = [
    {
      projectId: "batch_story_001",
      niche: "scary_stories",
      visualStyle: "anime",
      script: "Sara and Zara are talking in the living room before going for a drive."
    },
    {
      projectId: "batch_story_002",
      niche: "true_crime",
      visualStyle: "cinematic",
      script: "Alex was sitting in a coffee shop when he noticed something unusual."
    }
  ];

  const results = await generateBatchReels(items);

  console.log(JSON.stringify(results, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
