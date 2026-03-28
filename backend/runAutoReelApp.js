const fs = require("fs");
const path = require("path");
const styleRouter = require("./engines/styleRouter");
const { generateScenePrompts } = require("./engines/ollamaPromptEngine");

function safeRequire(modulePath) {
  try {
    return require(modulePath);
  } catch (error) {
    return null;
  }
}

function pickFunction(mod, candidates) {
  if (!mod) return null;

  for (const name of candidates) {
    if (typeof mod === "function") return mod;
    if (typeof mod[name] === "function") return mod[name];
  }

  return null;
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function fileExists(filePath) {
  try {
    return fs.existsSync(filePath);
  } catch {
    return false;
  }
}

function normalizeConfig(input = {}) {
  return {
    projectId: input.projectId || `project_${Date.now()}`,
    niche: input.niche || "story",
    language: input.language || "english",
    voice: input.voice || "female",
    music: input.music || "auto",
    visualStyle: input.visualStyle || "cinematic",
    captionStyle: input.captionStyle || "bold",
    effects: input.effects || "parallax",
    subject: input.subject || "a dramatic short story",
    seed: Number.isFinite(input.seed) ? input.seed : 12345,
    testMode: Boolean(input.testMode),
    maxScenes: Number.isFinite(input.maxScenes) ? input.maxScenes : null,
    story: input.story || input.subject || "",
    hook: input.hook || "",
    scenes: Array.isArray(input.scenes) ? input.scenes : [],
    narration: input.narration || "",
    characters: Array.isArray(input.characters) ? input.characters : [],
    outputRoot: input.outputRoot || path.resolve(__dirname, "..", "output"),
    style: input.style || null,
  };
}

function buildFallbackScript(config) {
  const storyText = String(config.story || config.subject || "").trim();

  const rawLines = storyText
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);

  let hook = config.hook;
  let scenes = Array.isArray(config.scenes) ? [...config.scenes] : [];
  let narration = config.narration;

  if (!hook) {
    hook =
      rawLines[0] ||
      "This story begins with a simple moment that changes everything.";
  }

  if (!scenes.length) {
    const remaining = rawLines.slice(1);
    if (remaining.length) {
      scenes = remaining;
    } else {
      scenes = [
        `The story begins with ${config.subject}.`,
        "Something changes and raises the tension.",
        "The moment becomes more emotional and important.",
        "The story ends with a memorable payoff.",
      ];
    }
  }

  if (config.testMode && config.maxScenes && scenes.length > config.maxScenes) {
    scenes = scenes.slice(0, config.maxScenes);
  }

  if (!narration) {
    narration = [hook, ...scenes].join(" ");
  }

  return {
    niche: config.niche,
    subject: config.subject,
    hook,
    scenes,
    narration,
  };
}

function buildFallbackDialogue(script, config) {
  const characters = Array.isArray(config.characters) ? config.characters : [];
  if (!characters.length) return [];

  const dialogue = [];
  const lines = script.narration
    .split(/[.!?]+/)
    .map((line) => line.trim())
    .filter(Boolean);

  lines.forEach((line, index) => {
    const speaker = characters[index % characters.length];
    dialogue.push({
      character: speaker.name || `Character${index + 1}`,
      line,
    });
  });

  return dialogue;
}

function buildFallbackShotPlan(script, config) {
  const baseCharacters = Array.isArray(config.characters) ? config.characters : [];
  const styleMode = config.style?.mode || "story";

  const shots =
    styleMode === "viral"
      ? ["hook_close_up", "dynamic_medium", "reaction_close_up", "punch_in", "payoff_close"]
      : ["wide_establishing", "medium_story", "close_emotion", "reaction_close_up", "medium_payoff"];

  const prompts = script.scenes.map((scene, index) => {
    const shotType = shots[index % shots.length];
    const characterText = baseCharacters.length
      ? baseCharacters.map((c) => `${c.name}, ${c.look}`).join("; ")
      : "";

    return {
      sceneId: index + 1,
      shotType,
      location: "story_world",
      description: scene,
      prompt: `${shotType.replace(/_/g, " ")}, ${scene}, ${characterText}`.trim(),
      negativePrompt:
        "low quality, blurry, bad anatomy, extra fingers, extra limbs, deformed face, watermark, logo, text",
      visualStyle: config.visualStyle,
      steps: config.testMode ? 16 : 24,
      guidanceScale: 7.5,
    };
  });

  return {
    subject: script.subject,
    characters: baseCharacters,
    styleMode,
    prompts,
  };
}

function limitShotPlanForTestMode(shotPlan, config) {
  if (!config.testMode) return shotPlan;
  if (!config.maxScenes) return shotPlan;

  return {
    ...shotPlan,
    prompts: shotPlan.prompts.slice(0, config.maxScenes),
  };
}

async function runAutoReelApp(inputConfig = {}) {
  let config = normalizeConfig(inputConfig);

  const projectOutputDir = path.join(config.outputRoot, config.projectId);
  ensureDir(config.outputRoot);
  ensureDir(projectOutputDir);

  const generatedAssetsRoot = path.resolve(__dirname, "..", "assets", "generated");
  const subtitlesDir = path.join(generatedAssetsRoot, "subtitles");
  const voiceDir = path.join(generatedAssetsRoot, "voice");

  ensureDir(generatedAssetsRoot);
  ensureDir(subtitlesDir);
  ensureDir(voiceDir);

  const modules = {
    scriptGenerator: safeRequire("./engines/scriptGenerator"),
    storyExpander: safeRequire("./engines/storyExpander"),
    smartShotDirector: safeRequire("./engines/smartShotDirector"),
    characterRegistry: safeRequire("./engines/characterRegistry"),
    promptBuilder: safeRequire("./engines/promptBuilder"),
    visualGenerator: safeRequire("./engines/visualGenerator"),
    voiceGenerator: safeRequire("./engines/voiceGenerator"),
    subtitleGenerator: safeRequire("./engines/subtitleGenerator"),
    timelineBuilder: safeRequire("./engines/timelineBuilder"),
    reelComposer: safeRequire("./engines/reelComposer"),
  };

  const generateScript = pickFunction(modules.scriptGenerator, [
    "generateScript",
    "buildScript",
    "createScript",
  ]);

  const expandStory = pickFunction(modules.storyExpander, [
    "expandStory",
    "buildStoryScript",
  ]);

  const registerCharacters = pickFunction(modules.characterRegistry, [
    "registerCharacters",
    "buildCharacterRegistry",
  ]);

  const directShots = pickFunction(modules.smartShotDirector, [
    "buildShotPlan",
    "directShots",
    "createShotPlan",
  ]);

  const buildPrompts = pickFunction(modules.promptBuilder, [
    "buildPrompts",
    "enhanceShotPlan",
    "createPrompts",
  ]);

  const generateVisuals = pickFunction(modules.visualGenerator, [
    "generateVisuals",
    "generateImages",
    "createVisuals",
  ]);

  const generateVoice = pickFunction(modules.voiceGenerator, [
    "generateVoice",
    "generateNarration",
    "createVoice",
  ]);

  const generateSubtitles = pickFunction(modules.subtitleGenerator, [
    "generateSubtitles",
    "createSubtitles",
    "buildSubtitles",
  ]);

  const buildTimeline = pickFunction(modules.timelineBuilder, [
    "buildTimeline",
    "createTimeline",
  ]);

  const composeReel = pickFunction(modules.reelComposer, [
    "composeReel",
    "renderReel",
    "createReel",
  ]);

  let script;

  if (expandStory) {
    script = await expandStory(config);
  } else if (generateScript) {
    script = await generateScript(config);
  } else {
    script = buildFallbackScript(config);
  }

  if (!script || !Array.isArray(script.scenes) || !script.scenes.length) {
    throw new Error("Script generation failed: no scenes were produced.");
  }

  if (config.testMode && config.maxScenes && script.scenes.length > config.maxScenes) {
    script = {
      ...script,
      scenes: script.scenes.slice(0, config.maxScenes),
    };
  }

  if (!script.narration || !script.narration.trim()) {
    script.narration = [script.hook || "", ...(script.scenes || [])]
      .join(" ")
      .trim();
  }

  config = styleRouter(config, script);

  const characterPack = registerCharacters
    ? await registerCharacters({
        config,
        script,
        characters: config.characters,
      })
    : {
        characters: Array.isArray(config.characters) ? config.characters : [],
      };

  const dialogue =
    Array.isArray(script.dialogue) && script.dialogue.length
      ? script.dialogue
      : buildFallbackDialogue(script, config);

  let shotPlan;
  if (directShots) {
    shotPlan = await directShots({
      config,
      script,
      characters: characterPack.characters || config.characters || [],
      dialogue,
    });
  } else {
    shotPlan = buildFallbackShotPlan(script, {
      ...config,
      characters: characterPack.characters || config.characters || [],
    });
  }

  shotPlan = limitShotPlanForTestMode(shotPlan, config);

  let aiSceneData = null;
  try {
    aiSceneData = await generateScenePrompts({
      scenes: script.scenes || [],
      character:
        Array.isArray(characterPack.characters) && characterPack.characters.length
          ? characterPack.characters[0]
          : Array.isArray(config.characters) && config.characters.length
          ? config.characters[0]
          : null,
      niche: config.niche || "story",
    });

    console.log("Ollama output:", aiSceneData);
  } catch (error) {
    console.log("Ollama failed, fallback to JS:", error.message);
  }

  if (buildPrompts) {
    shotPlan = await buildPrompts({
      config,
      script,
      shotPlan,
      characters: characterPack.characters || config.characters || [],
      dialogue,
      aiSceneData,
    });
  }

  if (!shotPlan || !Array.isArray(shotPlan.prompts) || !shotPlan.prompts.length) {
    throw new Error("Shot planning failed: no prompts were produced.");
  }

  const reelOutputPath = path.join(config.outputRoot, `${config.projectId}.mp4`);
  const subtitlePath = path.join(subtitlesDir, `${config.projectId}.srt`);

  let visualsResult;
  if (generateVisuals) {
    visualsResult = await generateVisuals({
      config,
      script,
      shotPlan,
      outputDir: projectOutputDir,
    });
  } else {
    throw new Error("visualGenerator engine is missing.");
  }

  const imageFiles = Array.isArray(visualsResult)
    ? visualsResult
    : Array.isArray(visualsResult?.images)
    ? visualsResult.images
    : Array.isArray(visualsResult?.files)
    ? visualsResult.files
    : [];

  if (!imageFiles.length) {
    throw new Error("Visual generation failed: no images were created.");
  }

  let voiceResult = null;
  if (generateVoice) {
    voiceResult = await generateVoice({
      config,
      script,
      outputDir: voiceDir,
      projectId: config.projectId,
    });
  }

  let subtitlesResult = null;
  if (generateSubtitles) {
    subtitlesResult = await generateSubtitles({
      config,
      script,
      voiceResult,
      subtitlePath,
      outputDir: subtitlesDir,
      projectId: config.projectId,
    });
  }

  const finalSubtitlePath =
    subtitlesResult?.subtitlePath ||
    subtitlesResult?.output ||
    subtitlesResult?.file ||
    (fileExists(subtitlePath) ? subtitlePath : null);

  let timeline;
  if (buildTimeline) {
    timeline = await buildTimeline({
      config,
      script,
      imageFiles,
      shotPlan,
      subtitles: finalSubtitlePath,
      voiceResult,
    });
  } else {
    const fallbackDuration = script.scenes.length
      ? Number((Math.max(2, 12 / script.scenes.length)).toFixed(2))
      : 3;

    timeline = imageFiles.map((file, index) => ({
      file,
      start: Number((index * fallbackDuration).toFixed(3)),
      duration: fallbackDuration,
    }));
  }

  if (!Array.isArray(timeline) || !timeline.length) {
    throw new Error("Timeline build failed: no timeline entries were produced.");
  }

  if (!composeReel) {
    throw new Error("reelComposer engine is missing.");
  }

  const reelResult = await composeReel({
    config,
    script,
    shotPlan,
    timeline,
    images: imageFiles,
    voiceResult,
    subtitlePath: finalSubtitlePath,
    output: reelOutputPath,
  });

  const finalVideoPath =
    reelResult?.video ||
    reelResult?.output ||
    reelResult?.file ||
    reelOutputPath;

  const result = {
    config,
    script,
    dialogue,
    shotPlan,
    aiSceneData,
    render: {
      output: finalVideoPath,
    },
    timeline,
    video: finalVideoPath,
  };

  const reportPath = path.join(projectOutputDir, `${config.projectId}_report.json`);
  fs.writeFileSync(reportPath, JSON.stringify(result, null, 2), "utf8");

  return result;
}

module.exports = {
  runAutoReelApp,
};
