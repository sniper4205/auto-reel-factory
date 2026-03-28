function normalizeText(text = "") {
  return String(text).toLowerCase().trim();
}

function detectSceneIntent(sceneText = "") {
  const text = normalizeText(sceneText);

  if (
    text.includes("drive") ||
    text.includes("driving") ||
    text.includes("car") ||
    text.includes("road trip") ||
    text.includes("passenger") ||
    text.includes("windshield")
  ) {
    return "driving_scene";
  }

  if (
    text.includes("talking") ||
    text.includes("talking to each other") ||
    text.includes("conversation") ||
    text.includes("chatting")
  ) {
    return "conversation_scene";
  }

  if (
    text.includes("living room") ||
    text.includes("bedroom") ||
    text.includes("kitchen") ||
    text.includes("window") ||
    text.includes("sofa") ||
    text.includes("interior") ||
    text.includes("room")
  ) {
    return "environment_scene";
  }

  if (
    text.includes("alone") ||
    text.includes("one person") ||
    text.includes("single person") ||
    text.includes("single woman") ||
    text.includes("single man")
  ) {
    return "single_character_scene";
  }

  return "generic_scene";
}

function buildScenePlan(sceneText = "", visualStyle = "anime") {
  const intent = detectSceneIntent(sceneText);

  if (intent === "driving_scene") {
    return {
      intent,
      shotType: "car_interior",
      prompt:
        "single scene illustration, car interior, one young woman driving, one young woman in passenger seat, road visible through windshield, sunlight entering car, clean composition, both characters fully separate, no extra people, no extra objects, vertical 9:16 composition",
      negativePrompt:
        "third person, crowd, extra passenger, extra hands, extra legs, duplicate body, fused body, floating object, floating steering wheel, text, watermark, logo"
    };
  }

  if (intent === "conversation_scene") {
    return {
      intent,
      shotType: "two_character_conversation",
      prompt:
        "single scene illustration, exactly two young women only, waist-up conversation shot, both sitting naturally and talking to each other, both characters clearly separated, natural posture, living room interior, warm sunlight through window, simple table, clean composition, vertical 9:16 composition, no extra people, no floating objects",
      negativePrompt:
        "third person, crowd, extra people, duplicate body, fused body, bad anatomy, extra arms, extra legs, floating cup, floating object, text, watermark, logo"
    };
  }

  if (intent === "single_character_scene") {
    return {
      intent,
      shotType: "single_character",
      prompt:
        "single scene illustration, one young woman only, standing naturally, correct anatomy, simple indoor background, clean composition, vertical 9:16 composition, no extra people",
      negativePrompt:
        "two people, crowd, extra person, duplicate body, fused body, extra limbs, text, watermark, logo"
    };
  }

  if (intent === "environment_scene") {
    return {
      intent,
      shotType: "environment",
      prompt:
        "single scene illustration, empty living room interior, warm sunlight through window, sofa, coffee table, indoor plants, clean composition, no people, no characters, vertical 9:16 composition",
      negativePrompt:
        "person, people, crowd, character, duplicate person, text, watermark, logo"
    };
  }

  return {
    intent,
    shotType: "generic",
    prompt:
      "single scene illustration, simple cinematic composition, minimal subjects, clean composition, vertical 9:16 composition",
    negativePrompt:
      "crowd, duplicate person, bad anatomy, text, watermark, logo"
  };
}

module.exports = {
  detectSceneIntent,
  buildScenePlan
};
