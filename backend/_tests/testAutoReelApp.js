const { runAutoReelApp } = require("./runAutoReelApp");

async function main() {
  const config = {
    projectId: "fast_test",
    niche: "history",
    language: "english",
    voice: "female",
    music: "none",
    visualStyle: "cinematic",
    captionStyle: "bold",
    effects: "none",
    seed: 12345,

    // Fast testing mode
    testMode: true,
    maxScenes: 4,

    // User gives only story
    story: `
In 1860, a poor boy worked in a small shop in America.
He failed in business.
He lost elections.
People said he would never succeed.
But he never quit.
Years later...
That same boy became the President of the United States.
His name was Abraham Lincoln.
    `.trim(),
  };

  const result = await runAutoReelApp(config);
  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
