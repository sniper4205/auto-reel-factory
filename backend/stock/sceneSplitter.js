function cleanText(text) {
  return String(text || "")
    .replace(/\s+/g, " ")
    .trim();
}

function splitLongText(text, maxLength = 140) {
  const cleaned = cleanText(text);

  if (cleaned.length <= maxLength) {
    return [cleaned];
  }

  const words = cleaned.split(" ");
  const chunks = [];
  let current = "";

  for (const word of words) {
    const test = current ? `${current} ${word}` : word;

    if (test.length <= maxLength) {
      current = test;
    } else {
      if (current) {
        chunks.push(current);
      }
      current = word;
    }
  }

  if (current) {
    chunks.push(current);
  }

  return chunks;
}

function splitScriptIntoScenes(script) {
  const raw = String(script || "");

  const primaryParts = raw
    .split(/(?<=[.!?])\s+|\n+/)
    .map((part) => cleanText(part))
    .filter(Boolean);

  const merged = [];

  for (let i = 0; i < primaryParts.length; i++) {
    const current = primaryParts[i];

    if (current.length < 35 && i < primaryParts.length - 1) {
      const next = primaryParts[i + 1];
      merged.push(cleanText(`${current} ${next}`));
      i += 1;
    } else {
      merged.push(current);
    }
  }

  const finalScenes = [];

  for (const item of merged) {
    const chunks = splitLongText(item, 140);
    finalScenes.push(...chunks);
  }

  return finalScenes;
}

function classifySceneTiming(text) {
  const cleaned = cleanText(text);
  const length = cleaned.length;

  if (length <= 45) {
    return {
      minDuration: 2,
      maxDuration: 3
    };
  }

  if (length <= 110) {
    return {
      minDuration: 3,
      maxDuration: 4
    };
  }

  return {
    minDuration: 4,
    maxDuration: 6
  };
}

function buildSceneRequest(text, sceneId) {
  const timing = classifySceneTiming(text);

  return {
    sceneId,
    text: cleanText(text),
    sceneType: "visual",
    requiredType: "image",
    orientation: "portrait",
    minDuration: timing.minDuration,
    maxDuration: timing.maxDuration
  };
}

function buildSceneRequests(script) {
  const scenes = splitScriptIntoScenes(script);

  return scenes.map((sceneText, index) =>
    buildSceneRequest(sceneText, index + 1)
  );
}

module.exports = {
  cleanText,
  splitLongText,
  splitScriptIntoScenes,
  classifySceneTiming,
  buildSceneRequest,
  buildSceneRequests
};
