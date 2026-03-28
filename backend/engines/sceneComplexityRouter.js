function normalizeText(text) {
  return String(text || "").trim();
}

function lower(text) {
  return normalizeText(text).toLowerCase();
}

function detectNamedCharacters(text) {
  const raw = normalizeText(text);

  const stopWords = new Set([
    "The", "A", "An", "Then", "They", "Them", "Their", "There", "When", "While",
    "After", "Before", "And", "But", "Or", "So", "Because", "If", "On", "In",
    "At", "Into", "From", "To", "With", "Without", "Inside", "Outside", "He",
    "She", "His", "Her", "Him", "It", "Its", "We", "You", "I"
  ]);

  const matches = raw.match(/\b[A-Z][a-zA-Z]+\b/g) || [];
  const unique = [];

  for (const word of matches) {
    if (!stopWords.has(word) && !unique.includes(word)) {
      unique.push(word);
    }
  }

  return unique;
}

function countPeopleSignals(text) {
  const t = lower(text);

  let score = 0;

  const signals = [
    " two people ",
    " two women ",
    " two men ",
    " two friends ",
    " three people ",
    " group ",
    " crowd ",
    " family ",
    " everyone ",
    " all of them ",
    " together ",
    " talking ",
    " conversation ",
    " arguing ",
    " discuss ",
    " discussion ",
    " meet ",
    " meeting ",
    " dialogue "
  ];

  const padded = ` ${t} `;

  for (const item of signals) {
    if (padded.includes(item)) {
      score += 1;
    }
  }

  return score;
}

function detectSceneType(text) {
  const t = lower(text);

  if (
    t.includes("living room") ||
    t.includes("bedroom") ||
    t.includes("office") ||
    t.includes("street") ||
    t.includes("road") ||
    t.includes("car") ||
    t.includes("house") ||
    t.includes("room") ||
    t.includes("kitchen") ||
    t.includes("cafe") ||
    t.includes("restaurant")
  ) {
    return "environment";
  }

  return "generic";
}

function detectDialogue(text) {
  const t = lower(text);

  return (
    t.includes("talk") ||
    t.includes("conversation") ||
    t.includes("argue") ||
    t.includes("say") ||
    t.includes("told") ||
    t.includes("asked") ||
    t.includes("replied") ||
    t.includes("meet and talk") ||
    t.includes("discuss")
  );
}

function detectActionRisk(text) {
  const t = lower(text);

  return (
    t.includes("fight") ||
    t.includes("running") ||
    t.includes("chasing") ||
    t.includes("explosion") ||
    t.includes("crash") ||
    t.includes("crowd") ||
    t.includes("party") ||
    t.includes("wedding") ||
    t.includes("classroom") ||
    t.includes("meeting room full") ||
    t.includes("many people")
  );
}

function chooseSafeVisualStrategy(sceneText) {
  const names = detectNamedCharacters(sceneText);
  const namedCount = names.length;
  const peopleSignals = countPeopleSignals(sceneText);
  const isDialogue = detectDialogue(sceneText);
  const isActionRisk = detectActionRisk(sceneText);
  const sceneType = detectSceneType(sceneText);

  if (isActionRisk) {
    return {
      route: "SAFE_ENVIRONMENT_OR_OBJECT",
      riskLevel: "high",
      reason: "complex action or crowd risk",
      promptMode: "environment_cutaway",
      safePrompt:
        "cinematic vertical frame, empty environment shot, clean composition, no people, story location only"
    };
  }

  if ((namedCount >= 2 && isDialogue) || peopleSignals >= 2) {
    if (sceneType === "environment") {
      return {
        route: "SAFE_ENVIRONMENT_OR_SINGLE_SUBJECT",
        riskLevel: "high",
        reason: "multi-character dialogue scene is unsafe for direct AI character generation",
        promptMode: "environment_cutaway",
        safePrompt:
          "cinematic vertical frame, living room interior, warm indoor lighting, sofa, table, window light, clean composition, no people"
      };
    }

    return {
      route: "SAFE_SINGLE_SUBJECT_OR_OBJECT",
      riskLevel: "high",
      reason: "multi-character dialogue scene is unsafe for direct AI character generation",
      promptMode: "single_subject_reaction",
      safePrompt:
        "cinematic vertical frame, one person reaction shot, simple background, clean composition, no extra people"
    };
  }

  if (namedCount === 1 && !isDialogue) {
    return {
      route: "DIRECT_AI_IMAGE",
      riskLevel: "low",
      reason: "single named subject scene",
      promptMode: "single_subject",
      safePrompt:
        "cinematic vertical frame, one person only, clean composition, simple background"
    };
  }

  if (sceneType === "environment" && !isDialogue) {
    return {
      route: "DIRECT_AI_IMAGE",
      riskLevel: "low",
      reason: "environment scene is safe",
      promptMode: "environment",
      safePrompt:
        "cinematic vertical frame, environment only, no people, clean composition"
    };
  }

  return {
    route: "DIRECT_AI_IMAGE",
    riskLevel: "medium",
    reason: "generic scene, acceptable for direct generation",
    promptMode: "generic_safe",
    safePrompt:
      "cinematic vertical frame, simple scene, minimal subjects, clean composition"
  };
}

function buildRouterDecision(scene) {
  const sceneText = typeof scene === "string" ? scene : scene.text || scene.description || "";

  const strategy = chooseSafeVisualStrategy(sceneText);

  return {
    originalScene: sceneText,
    detectedNames: detectNamedCharacters(sceneText),
    dialogueDetected: detectDialogue(sceneText),
    sceneType: detectSceneType(sceneText),
    strategy
  };
}

function routeScenes(scenes) {
  return (scenes || []).map((scene, index) => {
    const decision = buildRouterDecision(scene);

    return {
      sceneId: scene.sceneId || index + 1,
      text: typeof scene === "string" ? scene : scene.text || scene.description || "",
      router: decision
    };
  });
}

module.exports = {
  normalizeText,
  detectNamedCharacters,
  detectDialogue,
  detectSceneType,
  detectActionRisk,
  chooseSafeVisualStrategy,
  buildRouterDecision,
  routeScenes
};
