function normalizeText(text = "") {
  return String(text).toLowerCase().trim();
}

function detectNames(sceneText = "") {
  const matches = String(sceneText).match(/\b[A-Z][a-z]+\b/g) || [];
  return [...new Set(matches)];
}

function isDrivingScene(text) {
  const t = normalizeText(text);
  return (
    t.includes("drive") ||
    t.includes("driving") ||
    t.includes("car") ||
    t.includes("road trip") ||
    t.includes("passenger") ||
    t.includes("windshield")
  );
}

function isConversationScene(text) {
  const t = normalizeText(text);
  return (
    t.includes("talking") ||
    t.includes("conversation") ||
    t.includes("chatting") ||
    t.includes("talking to each other")
  );
}

function isIndoorScene(text) {
  const t = normalizeText(text);
  return (
    t.includes("living room") ||
    t.includes("bedroom") ||
    t.includes("kitchen") ||
    t.includes("inside") ||
    t.includes("room") ||
    t.includes("house") ||
    t.includes("home")
  );
}

function createShotPlan(sceneText = "") {
  const names = detectNames(sceneText);

  if (isDrivingScene(sceneText)) {
    return {
      originalScene: sceneText,
      sceneType: "driving",
      characters: names,
      shots: [
        {
          shotId: 1,
          shotType: "car_wide",
          prompt:
            "single scene illustration, inside a car, wide dashboard camera view, two young women in car, one driving and one sitting in passenger seat, both characters clearly visible, driver holding steering wheel, passenger looking ahead, road visible through windshield, sunset lighting entering car, clean composition, no extra people, no extra objects, anime style, vertical 9:16 frame"
        }
      ]
    };
  }

  if (isConversationScene(sceneText) && isIndoorScene(sceneText)) {
    return {
      originalScene: sceneText,
      sceneType: "indoor_conversation",
      characters: names,
      shots: [
        {
          shotId: 1,
          shotType: "conversation_medium",
          prompt:
            "single scene illustration, exactly two young women only, waist-up conversation shot, both sitting naturally and talking to each other, both characters clearly separated, natural posture, living room interior, warm sunlight through window, simple table, clean composition, vertical 9:16 composition, no extra people, no floating objects, anime style"
        },
        {
          shotId: 2,
          shotType: "environment_cutaway",
          prompt:
            "single scene illustration, empty cozy living room interior, warm sunlight through window, sofa, coffee table, indoor plants, clean composition, no people, no characters, anime background art, vertical 9:16 composition"
        }
      ]
    };
  }

  if (isIndoorScene(sceneText)) {
    return {
      originalScene: sceneText,
      sceneType: "indoor_environment",
      characters: names,
      shots: [
        {
          shotId: 1,
          shotType: "environment",
          prompt:
            "single scene illustration, empty indoor room, warm natural lighting, clean composition, no people, no characters, anime background art, vertical 9:16 composition"
        }
      ]
    };
  }

  return {
    originalScene: sceneText,
    sceneType: "generic",
    characters: names,
    shots: [
      {
        shotId: 1,
        shotType: "generic",
        prompt:
          "single scene illustration, simple cinematic composition, minimal subjects, clean composition, vertical 9:16 composition, anime style"
      }
    ]
  };
}

module.exports = {
  createShotPlan
};
