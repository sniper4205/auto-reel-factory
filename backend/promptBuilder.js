function buildPrompt(scene) {
  const characterBlock = `
same exact person from reference image, identical face, identical facial structure, identical beard, identical hairstyle, do not change identity, same outfit, same jacket, same colors, face consistency, identity consistency, highly detailed face
`;

  const styleBlock = `
ultra realistic, 8k, film look, color graded, shallow depth of field, sharp focus, professional photography, cinematic lighting, masterpiece, best quality, 9:16 vertical
`;

  // Convert abstract story → visual description
  function makeVisual(scene) {
    const desc = scene.scene_description.toLowerCase();

    if (desc.includes("rooftop")) {
      return "sitting alone on a rooftop at sunset, looking at city skyline, serious expression, wind blowing softly";
    }

    if (desc.includes("decides") || desc.includes("determined")) {
      return "walking forward on a city street at night, determined expression, moving with purpose, cinematic environment";
    }

    if (desc.includes("rejection") || desc.includes("failure")) {
      return "standing in heavy rain at night, wet face, emotional struggle, blurred city lights in background";
    }

    if (desc.includes("perseveres") || desc.includes("stronger")) {
      return "walking forward at sunrise, focused expression, training mindset, building strength and discipline";
    }

    if (desc.includes("successful") || desc.includes("top")) {
      return "standing confidently at a luxury penthouse overlooking city skyline at night, calm powerful expression";
    }

    return scene.scene_description;
  }

  const visualScene = makeVisual(scene);

  return `
${characterBlock},

${visualScene},

${scene.shot_type}, ${scene.mood} mood,

${styleBlock}
`.trim();
}

const { splitScenes } = require("./sceneSplitter.js");

const story = `
A struggling young man watches the city from his rooftop, feeling lost in life.
One night, he decides to stop waiting and starts chasing his dreams.
He faces rejection, failure, and moments of doubt on his journey.
But he keeps pushing forward, growing stronger with every setback.
In the end, he stands at the top, finally becoming the person he once dreamed of.
`;

const run = async () => {
  const scenes = await splitScenes(story);

  scenes.forEach(scene => {
    console.log(`\n--- Scene ${scene.scene_number} ---\n`);
    console.log(buildPrompt(scene));
  });
};

run();
