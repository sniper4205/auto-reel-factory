const fs = require("fs");
const { splitScenes } = require("./sceneSplitter.js");

// SAME prompt builder logic (copied here)
function buildPrompt(scene) {
  const characterBlock = `
same exact person from reference image, identical face, identical facial structure, identical beard, identical hairstyle, do not change identity, same outfit, same jacket, same colors, face consistency, identity consistency, highly detailed face
`;

  const styleBlock = `
ultra realistic, 8k, film look, color graded, shallow depth of field, sharp focus, professional photography, cinematic lighting, masterpiece, best quality, 9:16 vertical
`;

  function makeVisual(scene) {
    const desc = scene.scene_description.toLowerCase();

    if (desc.includes("rooftop")) {
      return "sitting alone on a rooftop at sunset, looking at city skyline, serious expression, wind blowing softly";
    }

    if (desc.includes("decides") || desc.includes("determined")) {
      return "walking forward on a city street at night, determined expression, moving with purpose";
    }

    if (desc.includes("rejection") || desc.includes("failure")) {
      return "standing in heavy rain at night, wet face, emotional struggle, blurred city lights in background";
    }

    if (desc.includes("perseveres") || desc.includes("stronger")) {
      return "walking forward at sunrise, focused expression, training mindset, building strength";
    }

    if (desc.includes("top") || desc.includes("successful")) {
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

// MAIN FUNCTION
const story = `
A struggling young man watches the city from his rooftop, feeling lost in life.
One night, he decides to stop waiting and starts chasing his dreams.
He faces rejection, failure, and moments of doubt on his journey.
But he keeps pushing forward, growing stronger with every setback.
In the end, he stands at the top, finally becoming the person he once dreamed of.
`;

async function run() {
  const scenes = await splitScenes(story);

  const prompts = scenes.map(scene => ({
    scene_number: scene.scene_number,
    prompt: buildPrompt(scene)
  }));

  // SAVE FILE
  fs.writeFileSync("prompts.json", JSON.stringify(prompts, null, 2));

  console.log("✅ prompts.json created");
}

run();
