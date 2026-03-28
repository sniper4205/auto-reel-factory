function getCamera(index) {
  const shots = [
    "wide shot",
    "medium shot",
    "close-up",
    "over-the-shoulder shot",
    "low angle shot",
    "high angle shot",
    "cinematic tracking shot"
  ];
  return shots[index % shots.length];
}

function getLighting(index) {
  const lights = [
    "cinematic lighting",
    "soft warm lighting",
    "dark moody lighting",
    "neon lighting",
    "golden hour lighting",
    "dramatic shadows"
  ];
  return lights[index % lights.length];
}

function getMood(index) {
  const moods = [
    "emotional",
    "dramatic",
    "intense",
    "peaceful",
    "epic",
    "sad",
    "suspenseful"
  ];
  return moods[index % moods.length];
}

function buildPrompt(scene, index = 0) {
  return `
${scene.action || ""},
${scene.environment || ""},

${getCamera(index)},
${getLighting(index)},
${getMood(index)},

cinematic composition,
highly detailed,
ultra realistic,
4k,
sharp focus,
depth of field,
professional photography,

no blur,
no distortion,
no low quality,
no duplicate subjects
`;
}

module.exports = { buildPrompt };
