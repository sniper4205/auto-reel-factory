function extractCharacters(script) {
  const stopWords = [
    "Then", "They", "There", "When", "While", "After", "Before",
    "On", "At", "In", "And", "But", "The", "He", "She", "His", "Her",
    "Years", "Later", "One", "Two", "Three"
  ];

  const words = script.split(/\s+/);
  const names = [];

  for (let word of words) {
    const clean = word
      .replace(/[^a-zA-Z]/g, "")
      .replace(/s$/, "");

    if (
      clean.length > 2 &&
      clean[0] === clean[0].toUpperCase() &&
      !stopWords.includes(clean)
    ) {
      if (!names.includes(clean)) {
        names.push(clean);
      }
    }
  }

  return names;
}

function splitScenes(script) {
  const sentences = script
    .split(/[.!?]/)
    .map((s) => s.trim())
    .filter(Boolean);

  const scenes = [];
  let index = 1;

  for (const sentence of sentences) {
    scenes.push({
      sceneId: index,
      description: sentence
    });
    index++;
  }

  return scenes;
}

function detectLocation(description, activeCharacters = []) {
  const text = description.toLowerCase();

  if (text.includes("white house")) return "white_house";
  if (text.includes("office")) return "office";
  if (text.includes("shop")) return "shop";
  if (text.includes("school")) return "school";
  if (text.includes("house")) return "house";
  if (text.includes("cabin")) return "cabin";
  if (text.includes("farm")) return "farm";
  if (text.includes("street") || text.includes("road") || text.includes("way")) return "road";
  if (text.includes("airport")) return "airport";
  if (text.includes("church")) return "church";
  if (text.includes("battlefield")) return "battlefield";

  const explicitPlaceMatch = description.match(/\b([A-Z][a-z]+)'s place\b/);
  if (explicitPlaceMatch) {
    return `${explicitPlaceMatch[1]}_place`;
  }

  const explicitHouseMatch = description.match(/\b([A-Z][a-z]+)'s house\b/);
  if (explicitHouseMatch) {
    return `${explicitHouseMatch[1]}_house`;
  }

  if (text.includes("his house")) {
    const owner = activeCharacters.length ? activeCharacters[activeCharacters.length - 1] : null;
    return owner ? `${owner}_house` : "house";
  }

  if (text.includes("her place")) {
    const owner = activeCharacters.length ? activeCharacters[activeCharacters.length - 1] : null;
    return owner ? `${owner}_place` : "place";
  }

  return "unknown";
}

function detectAction(description) {
  const text = description.toLowerCase();

  if (text.includes("write") || text.includes("letter")) return "writing";
  if (text.includes("talk")) return "talking";
  if (text.includes("drive") || text.includes("car")) return "driving";
  if (text.includes("walk")) return "walking";
  if (text.includes("run")) return "running";
  if (text.includes("study")) return "studying";
  if (text.includes("work")) return "working";
  if (text.includes("meet")) return "meeting";
  if (text.includes("greet") || text.includes("hi")) return "greeting";
  if (text.includes("arrive")) return "arriving";
  if (text.includes("see") || text.includes("saw")) return "seeing";
  if (text.includes("go")) return "traveling";
  if (text.includes("lead")) return "leading";
  if (text.includes("speak")) return "speaking";

  return "neutral";
}

function detectAgeStage(description) {
  const text = description.toLowerCase();

  if (
    text.includes("baby") ||
    text.includes("born") ||
    text.includes("newborn") ||
    text.includes("infant")
  ) {
    return "baby";
  }

  if (
    text.includes("child") ||
    text.includes("little boy") ||
    text.includes("little girl") ||
    text.includes("kid")
  ) {
    return "child";
  }

  if (
    text.includes("teen") ||
    text.includes("teenager") ||
    text.includes("young boy") ||
    text.includes("young girl")
  ) {
    return "teen";
  }

  if (
    text.includes("young man") ||
    text.includes("young woman") ||
    text.includes("early twenties") ||
    text.includes("student")
  ) {
    return "young_adult";
  }

  if (
    text.includes("old man") ||
    text.includes("old woman") ||
    text.includes("elderly") ||
    text.includes("aged")
  ) {
    return "old";
  }

  if (
    text.includes("president") ||
    text.includes("adult") ||
    text.includes("leader") ||
    text.includes("father") ||
    text.includes("mother")
  ) {
    return "adult";
  }

  return "adult";
}

function getExplicitCharacters(description, knownCharacters) {
  const found = [];

  for (const char of knownCharacters) {
    if (description.includes(char)) {
      found.push(char);
    }
  }

  return found;
}

function uniqueList(items) {
  return [...new Set(items)];
}

function detectSceneCharacters(description, knownCharacters, persistentGroup = [], encounterMemory = []) {
  const lower = description.toLowerCase();
  const explicitCharacters = getExplicitCharacters(description, knownCharacters);

  const hasPluralCarry = lower.includes("they") || lower.includes("them");
  const hasMeet = lower.includes("meet");
  const hasSee = lower.includes("see") || lower.includes("saw");
  const hasGreet = lower.includes("greet") || lower.includes("hi");
  const hasArrive = lower.includes("arrive");

  let sceneCharacters = [...explicitCharacters];

  if (hasPluralCarry) {
    sceneCharacters = uniqueList([...persistentGroup, ...sceneCharacters]);
  }

  if (hasMeet && explicitCharacters.length > 0) {
    sceneCharacters = uniqueList([...persistentGroup, ...explicitCharacters]);
  }

  if ((hasSee || hasGreet) && explicitCharacters.length > 0) {
    const encounterChars = explicitCharacters.filter(
      (name) => !persistentGroup.includes(name)
    );
    sceneCharacters = uniqueList([...persistentGroup, ...encounterChars]);
  }

  if (sceneCharacters.length === 0 && hasPluralCarry) {
    sceneCharacters = [...persistentGroup];
  }

  if (hasArrive && hasPluralCarry && explicitCharacters.length === 1) {
    sceneCharacters = uniqueList([...persistentGroup, ...explicitCharacters]);
  }

  if (
    (lower.includes("him") || lower.includes("her")) &&
    explicitCharacters.length === 0 &&
    encounterMemory.length > 0
  ) {
    sceneCharacters = uniqueList([...sceneCharacters, ...encounterMemory]);
  }

  return sceneCharacters;
}

function computeNextState(description, sceneCharacters, persistentGroup = []) {
  const lower = description.toLowerCase();

  const hasMeet = lower.includes("meet");
  const hasSee = lower.includes("see") || lower.includes("saw");
  const hasGreet = lower.includes("greet") || lower.includes("hi");
  const hasArrive = lower.includes("arrive");
  const hasPluralCarry = lower.includes("they") || lower.includes("them");

  let nextPersistentGroup = [...persistentGroup];
  let encounterMemory = [];

  if (hasMeet) {
    nextPersistentGroup = [...persistentGroup];
    const temp = sceneCharacters.filter((name) => !persistentGroup.includes(name));
    encounterMemory = [...temp];
    return {
      persistentGroup: nextPersistentGroup,
      encounterMemory
    };
  }

  if (hasSee || hasGreet) {
    const temp = sceneCharacters.filter((name) => !persistentGroup.includes(name));
    encounterMemory = [...temp];
    return {
      persistentGroup: [...persistentGroup],
      encounterMemory
    };
  }

  if (hasArrive) {
    nextPersistentGroup = [...sceneCharacters];
    encounterMemory = [];
    return {
      persistentGroup: nextPersistentGroup,
      encounterMemory
    };
  }

  if (hasPluralCarry && sceneCharacters.length > 0) {
    nextPersistentGroup = [...sceneCharacters];
    encounterMemory = [];
    return {
      persistentGroup: nextPersistentGroup,
      encounterMemory
    };
  }

  if (sceneCharacters.length > 0 && persistentGroup.length === 0) {
    nextPersistentGroup = [...sceneCharacters];
    encounterMemory = [];
    return {
      persistentGroup: nextPersistentGroup,
      encounterMemory
    };
  }

  return {
    persistentGroup: [...nextPersistentGroup],
    encounterMemory
  };
}

function attachSceneData(scenes, characters) {
  const results = [];
  let persistentGroup = [];
  let encounterMemory = [];

  for (const scene of scenes) {
    const sceneCharacters = detectSceneCharacters(
      scene.description,
      characters,
      persistentGroup,
      encounterMemory
    );

    const location = detectLocation(scene.description, sceneCharacters);
    const action = detectAction(scene.description);
    const ageStage = detectAgeStage(scene.description);

    results.push({
      ...scene,
      characters: sceneCharacters,
      location,
      action,
      ageStage
    });

    const nextState = computeNextState(
      scene.description,
      sceneCharacters,
      persistentGroup
    );

    persistentGroup = nextState.persistentGroup;
    encounterMemory = nextState.encounterMemory;
  }

  return results;
}

function buildStoryGraph(script) {
  const characters = extractCharacters(script);
  const scenes = splitScenes(script);
  const enrichedScenes = attachSceneData(scenes, characters);

  return {
    characters,
    scenes: enrichedScenes
  };
}

module.exports = {
  buildStoryGraph,
  extractCharacters,
  splitScenes,
  detectLocation,
  detectAction,
  detectAgeStage,
  detectSceneCharacters,
  attachSceneData
};
