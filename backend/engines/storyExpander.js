function cleanLine(line) {
  return String(line || "")
    .replace(/\r/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function splitStoryIntoParagraphs(story) {
  return String(story || "")
    .split(/\n+/)
    .map(cleanLine)
    .filter(Boolean);
}

function splitParagraphIntoSentences(paragraph) {
  return (
    String(paragraph || "")
      .match(/[^.!?]+[.!?]?/g)
      ?.map(cleanLine)
      .filter(Boolean) || []
  );
}

function detectSubjectFromStory(storyText) {
  const text = String(storyText || "").toLowerCase();

  if (text.includes("abraham lincoln")) {
    return "the rise of Abraham Lincoln";
  }

  if (text.includes("president of the united states")) {
    return "an underdog who becomes President of the United States";
  }

  if (text.includes("poor boy") && text.includes("america")) {
    return "a poor boy in America who never gives up";
  }

  return "a dramatic short story";
}

function detectCharactersFromStory(storyText) {
  const text = String(storyText || "");
  const characters = [];

  if (/abraham lincoln/i.test(text)) {
    characters.push({
      name: "Abraham Lincoln",
      look:
        "historically inspired young Abraham Lincoln, tall thin face, dark hair, simple 1800s American clothes",
      role: "main_character",
    });
  } else if (/poor boy/i.test(text)) {
    characters.push({
      name: "Young Boy",
      look:
        "poor young boy, humble clothing, determined face, historical American style",
      role: "main_character",
    });
  }

  return characters;
}

function buildHook(sentences, subject) {
  const joined = sentences.join(" ").toLowerCase();

  if (joined.includes("years later")) {
    return "It started with struggle, but it ended in a way nobody expected.";
  }

  if (subject && subject !== "a dramatic short story") {
    return `This is the story of ${subject}.`;
  }

  if (sentences.length) {
    const first = cleanLine(sentences[0]);
    return /[.!?]$/.test(first) ? first : `${first}.`;
  }

  return "A simple beginning can lead to an unforgettable ending.";
}

function expandToStoryBeats(sentences) {
  if (!sentences.length) {
    return [
      "A humble beginning introduces the main character.",
      "Life becomes difficult and the first setback appears.",
      "The pressure grows and the struggle becomes more serious.",
      "Doubt and criticism make success seem impossible.",
      "The character refuses to give up.",
      "A major turning point changes everything.",
      "The story reaches its emotional peak.",
      "The ending reveals the true payoff of the journey.",
    ];
  }

  const beats = [];

  if (sentences[0]) {
    beats.push(`The story begins: ${sentences[0]}`);
  }

  for (let i = 1; i < sentences.length; i += 1) {
    beats.push(sentences[i]);
  }

  return beats.map((beat) => {
    const cleaned = cleanLine(beat);
    return /[.!?]$/.test(cleaned) ? cleaned : `${cleaned}.`;
  });
}

function condenseScenesToMax(scenes, maxScenes) {
  if (scenes.length <= maxScenes) return scenes;

  const result = [];
  const chunkSize = Math.ceil(scenes.length / maxScenes);

  for (let i = 0; i < scenes.length; i += chunkSize) {
    const chunk = scenes.slice(i, i + chunkSize).join(" ");
    result.push(cleanLine(chunk));
  }

  return result.slice(0, maxScenes).map((scene) => {
    return /[.!?]$/.test(scene) ? scene : `${scene}.`;
  });
}

function padScenesToMin(scenes, minScenes) {
  const result = [...scenes];

  while (result.length < minScenes) {
    const last = result[result.length - 1] || "The story continues.";
    result.push(last);
  }

  return result;
}

function buildNarration(hook, scenes) {
  return [hook, ...scenes].map(cleanLine).filter(Boolean).join(" ");
}

async function expandStory(config = {}) {
  const rawStory = String(config.story || config.subject || "").trim();

  const paragraphs = splitStoryIntoParagraphs(rawStory);
  const sentences = paragraphs.flatMap(splitParagraphIntoSentences);

  const subject =
    cleanLine(config.subject) && config.subject !== "a dramatic short story"
      ? cleanLine(config.subject)
      : detectSubjectFromStory(rawStory);

  const hook = cleanLine(config.hook) || buildHook(sentences, subject);

  const targetScenes = config.testMode ? 4 : 8;

  let scenes =
    Array.isArray(config.scenes) && config.scenes.length
      ? config.scenes.map(cleanLine).filter(Boolean)
      : expandToStoryBeats(sentences);

  scenes = condenseScenesToMax(scenes, targetScenes);
  scenes = padScenesToMin(scenes, Math.min(targetScenes, Math.max(4, scenes.length)));

  if (config.testMode && config.maxScenes) {
    scenes = scenes.slice(0, config.maxScenes);
  }

  const narration = cleanLine(config.narration) || buildNarration(hook, scenes);

  const characters =
    Array.isArray(config.characters) && config.characters.length
      ? config.characters
      : detectCharactersFromStory(rawStory);

  return {
    niche: config.niche || "story",
    subject,
    hook,
    scenes,
    narration,
    characters,
    sourceStory: rawStory,
  };
}

module.exports = {
  expandStory,
};
