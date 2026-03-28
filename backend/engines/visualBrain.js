function analyzeScene(scene) {

  const text = scene.toLowerCase();

  const types = {
    location: ["room","office","house","city","street","cafe","park","school"],
    emotion: ["thinking","sad","happy","dream","hope","fear"],
    action: ["walking","running","driving","holding","looking","working"],
    object: ["phone","laptop","book","coffee","car","money"]
  };

  for (const key in types) {
    for (const word of types[key]) {
      if (text.includes(word)) {
        return key;
      }
    }
  }

  return "generic";
}

function buildVisual(sceneType) {

  const visuals = {

    location: `
cinematic environment
wide establishing shot
dramatic lighting
no people
`,

    emotion: `
cinematic mood shot
window light
soft shadows
atmospheric lighting
`,

    action: `
cinematic motion shot
dynamic composition
dramatic lighting
`,

    object: `
cinematic object close-up
shallow depth of field
macro photography
`,

    generic: `
cinematic atmosphere shot
light rays
dramatic lighting
`
  };

  return visuals[sceneType] || visuals.generic;

}

function visualBrain(scene) {

  const type = analyzeScene(scene);
  const visual = buildVisual(type);

  return {
    sceneType: type,
    prompt: visual
  };

}

module.exports = visualBrain;
