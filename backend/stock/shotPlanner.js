function normalize(text = "") {
  return String(text).toLowerCase().trim();
}

function detectConversation(text) {
  const t = normalize(text);
  return (
    t.includes("talk") ||
    t.includes("talking") ||
    t.includes("conversation") ||
    t.includes("chat")
  );
}

function detectDriving(text) {
  const t = normalize(text);
  return (
    t.includes("drive") ||
    t.includes("driving") ||
    t.includes("car") ||
    t.includes("road trip")
  );
}

function detectIndoor(text) {
  const t = normalize(text);
  return (
    t.includes("living room") ||
    t.includes("room") ||
    t.includes("house") ||
    t.includes("home") ||
    t.includes("inside")
  );
}

function buildScenes(scriptText = "") {
  const scenes = [];

  if (detectConversation(scriptText) && detectIndoor(scriptText)) {
    scenes.push({
      sceneType: "conversation",
      description: "two characters talking indoors"
    });
  }

  if (detectDriving(scriptText)) {
    scenes.push({
      sceneType: "transition_outside",
      description: "characters walking toward car outside"
    });

    scenes.push({
      sceneType: "driving",
      description: "characters inside car driving"
    });
  }

  if (scenes.length === 0) {
    scenes.push({
      sceneType: "generic",
      description: scriptText
    });
  }

  return scenes;
}

module.exports = {
  buildScenes
};
