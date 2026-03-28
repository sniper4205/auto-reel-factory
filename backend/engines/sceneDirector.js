function buildCameraShot(text) {

  const t = text.toLowerCase();

  if (t.includes("talk") || t.includes("conversation")) {
    return "medium shot of two women sitting and talking to each other";
  }

  if (t.includes("walking")) {
    return "wide shot of a woman walking forward";
  }

  if (t.includes("thinking")) {
    return "close up of a woman thinking quietly";
  }

  if (t.includes("phone")) {
    return "medium shot of a woman using a phone";
  }

  return "medium shot of a woman in a room";
}


function buildEnvironment(text) {

  const t = text.toLowerCase();

  if (t.includes("living room")) {
    return "living room interior";
  }

  if (t.includes("office")) {
    return "office interior";
  }

  if (t.includes("street")) {
    return "city street";
  }

  if (t.includes("bedroom")) {
    return "bedroom interior";
  }

  return "indoor environment";
}


function buildScenePrompt(sceneText) {

  const shot = buildCameraShot(sceneText);
  const environment = buildEnvironment(sceneText);

  return `${shot}, ${environment}, vertical composition, clean background`;
}


module.exports = {
  buildScenePrompt
};

