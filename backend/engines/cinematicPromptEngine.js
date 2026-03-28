function buildCinematicPrompt(sceneText, characters = []) {

  const characterText = characters
    .map(c => `${c.name}, ${c.look}`)
    .join(", ");

  const cinematicStyle = `
cinematic film still,
professional photography,
dramatic lighting,
soft shadows,
depth of field,
35mm lens,
ultra detailed,
high quality,
perfect composition,
vertical 9:16 frame
`;

  return `
${sceneText},
${characterText},
${cinematicStyle}
`;

}

module.exports = {
  buildCinematicPrompt
};
