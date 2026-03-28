const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

const { getStyleProfile } = require("./engines/styleProfiles");
const { generateCharacter } = require("./engines/characterGenerator");
const { generateVisuals } = require("./engines/visualGenerator");
const { generateAISceneData } = require("./engines/ollamaPromptEngine");

let smartShotDirector = null;
let realMotionEngine = null;

try {
  smartShotDirector = require("./engines/smartShotDirector");
} catch (error) {
  console.warn("⚠️ Could not load smartShotDirector.js, using fallback shot director.");
}

try {
  realMotionEngine = require("./engines/motionEngine");
} catch (error) {
  console.warn("⚠️ Could not load motionEngine.js, using fallback motion engine.");
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function buildMainCharacterProfile() {
  return {
    name: "Main Hero",
    gender: "male",
    age: "mid 30s",
    ethnicity: "Middle Eastern",
    hair: "short black hair",
    face: "sharp jawline, thick eyebrows, deep-set eyes, straight nose",
    beard: "trimmed beard",
    body: "lean athletic build",
    outfit: "dark robe style outfit",
    accessory: "none",
  };
}

function runFaceSwap(sourcePath, targetPath, outputPath) {
  return new Promise((resolve, reject) => {
    const pythonPath =
      process.env.PYTHON_PATH ||
      path.join(process.cwd(), "ai-env", "bin", "python");

    const py = spawn(
      pythonPath,
      ["ai/face_swap.py", sourcePath, targetPath, outputPath],
      { cwd: process.cwd() }
    );

    let stdout = "";
    let stderr = "";

    py.stdout.on("data", (data) => {
      const text = data.toString();
      stdout += text;
      process.stdout.write(text);
    });

    py.stderr.on("data", (data) => {
      const text = data.toString();
      stderr += text;
      process.stderr.write(text);
    });

    py.on("close", (code) => {
      if (code === 0) {
        resolve({ stdout, stderr, outputPath });
      } else {
        reject(new Error(stderr || stdout || "Face swap failed"));
      }
    });
  });
}

async function sceneSplitter(story) {
  console.log("🎬 Splitting story into scenes...");

  if (!story || typeof story !== "string") {
    return ["Scene 1", "Scene 2", "Scene 3"];
  }

  const rawScenes = story
    .split(/[.!?]+/)
    .map((line) => line.trim())
    .filter(Boolean);

  return rawScenes.length ? rawScenes : ["Scene 1", "Scene 2", "Scene 3"];
}

async function characterEngine(sceneTexts) {
  console.log("👤 Creating locked character profile...");

  const mainCharacter = buildMainCharacterProfile();

  return sceneTexts.map((sceneText, index) => ({
    id: index + 1,
    text: sceneText,
    mainCharacter,
  }));
}

async function enrichScenesWithOllama(story, characters) {
  console.log("🧠 Restoring AI prompt brain with Ollama...");

  try {
    const aiScenes = await generateAISceneData({
      story,
      characters: [characters[0]?.mainCharacter || buildMainCharacterProfile()],
      maxScenes: 3,
    });

    return characters.map((scene, index) => ({
      ...scene,
      aiSubject: aiScenes[index]?.subject || scene.mainCharacter.name,
      aiAge: aiScenes[index]?.age || scene.mainCharacter.age,
      aiAction: aiScenes[index]?.action || scene.text,
      aiEnvironment: aiScenes[index]?.environment || "cinematic setting",
    }));
  } catch (error) {
    console.warn("⚠️ Ollama failed, using fallback scene understanding:", error.message);

    return characters.map((scene) => ({
      ...scene,
      aiSubject: scene.mainCharacter.name,
      aiAge: scene.mainCharacter.age,
      aiAction: scene.text,
      aiEnvironment: "cinematic setting",
    }));
  }
}

async function shotDirector(scenes, styleProfile) {
  console.log("🎥 Adding cinematic direction...");

  try {
    if (typeof smartShotDirector === "function") {
      const result = await smartShotDirector(scenes);
      if (result) {
        return result.map((scene, index) => ({
          ...scene,
          aiSubject: scenes[index]?.aiSubject,
          aiAge: scenes[index]?.aiAge,
          aiAction: scenes[index]?.aiAction,
          aiEnvironment: scenes[index]?.aiEnvironment,
          mainCharacter: scene.mainCharacter || scenes[index]?.mainCharacter,
          visualProfile: styleProfile.visualProfile,
          modelKey: styleProfile.modelKey,
        }));
      }
    }

    if (smartShotDirector && typeof smartShotDirector.run === "function") {
      const result = await smartShotDirector.run(scenes);
      if (result) {
        return result.map((scene, index) => ({
          ...scene,
          aiSubject: scenes[index]?.aiSubject,
          aiAge: scenes[index]?.aiAge,
          aiAction: scenes[index]?.aiAction,
          aiEnvironment: scenes[index]?.aiEnvironment,
          mainCharacter: scene.mainCharacter || scenes[index]?.mainCharacter,
          visualProfile: styleProfile.visualProfile,
          modelKey: styleProfile.modelKey,
        }));
      }
    }
  } catch (error) {
    console.warn("⚠️ smartShotDirector failed, using fallback:", error.message);
  }

  return scenes.map((scene, index) => {
    let shot = "close-up portrait";
    let cameraMove = "slow push-in";
    let staging = "neutral background";
    let mood = "dramatic";
    let lighting = "cinematic lighting";

    if (index === 0) {
      shot = "medium close-up";
      staging = "desert ruins at golden hour with a mysterious door";
      lighting = "golden hour desert lighting";
      mood = "mysterious";
    } else if (index === 1) {
      shot = "close-up portrait";
      staging = "threshold between desert and glowing city";
      lighting = "city glow reflecting on face";
      mood = "shock and awe";
    } else if (index === 2) {
      shot = "close-up portrait";
      staging = "futuristic glowing skyline";
      lighting = "dramatic rim lighting";
      mood = "tense and curious";
    }

    return {
      ...scene,
      shot,
      cameraMove,
      staging,
      mood,
      lighting,
      visualProfile: styleProfile.visualProfile,
      modelKey: styleProfile.modelKey,
    };
  });
}

async function promptBuilder(directedScenes, styleProfile, characterImage) {
  console.log(`🧠 Building prompts in style: ${styleProfile.label}...`);

  return directedScenes.map((scene) => {
    const prompt = [
      "photorealistic",
      "middle eastern man",
      "mid 30s",
      "short black hair",
      "trimmed beard",
      scene.aiAction,
      scene.aiEnvironment,
      scene.shot,
      "front facing face",
      "one person only",
      "close facial detail"
    ].join(", ");

    return {
      ...scene,
      prompt,
      negativePrompt: "cartoon, anime, text, logo, blurry, multiple people",
      characterImage,
    };
  });
}

async function generateImages(promptedScenes, styleProfile, lockedCharacter) {
  console.log(`🖼 Generating ${styleProfile.label} images...`);

  const imagePaths = await generateVisuals(promptedScenes, styleProfile, lockedCharacter);

  return promptedScenes.map((scene, index) => ({
    ...scene,
    imagePath: imagePaths[index],
  }));
}

async function applyFaceLockToScenes(imageScenes, characterManifestPath) {
  const lockedScenes = [];

  for (let i = 0; i < imageScenes.length; i++) {
    const scene = imageScenes[i];
    const lockedPath = scene.imagePath.replace(".png", "_locked.png");

    try {
      console.log(`🔒 Applying face lock to scene ${i + 1}...`);
      await runFaceSwap(characterManifestPath, scene.imagePath, lockedPath);

      if (fs.existsSync(lockedPath)) {
        lockedScenes.push({
          ...scene,
          imagePath: lockedPath,
        });
        continue;
      }
    } catch (error) {
      console.warn(`⚠️ Face lock failed on scene ${i + 1}, using original image: ${error.message}`);
    }

    lockedScenes.push(scene);
  }

  return lockedScenes;
}

async function motionEngine(imageScenes) {
  if (typeof realMotionEngine === "function") {
    return await realMotionEngine(imageScenes);
  }

  console.log("🎞 Applying fallback motion...");

  return imageScenes.map((scene, index) => ({
    ...scene,
    clipPath: path.join(process.cwd(), "outputs", `clip_${index + 1}.mp4`),
  }));
}

async function voiceEngine(directedScenes) {
  console.log("🎤 Generating voice...");
  return directedScenes.map((scene, index) => ({
    ...scene,
    voicePath: path.join("outputs", `voice_${index + 1}.wav`),
  }));
}

async function subtitleEngine(voiceScenes) {
  console.log("📝 Generating subtitles...");
  return voiceScenes.map((scene, index) => ({
    ...scene,
    subtitlePath: path.join("outputs", `subtitle_${index + 1}.srt`),
  }));
}

async function musicEngine(videoScenes) {
  console.log("🎵 Adding music...");
  return {
    scenes: videoScenes,
    musicPath: path.join("assets", "music", "background.mp3"),
  };
}

async function reelComposer(finalData) {
  console.log("🎬 Creating final video...");
  return path.join("outputs", "final_video.mp4");
}

async function runPipeline(story, styleId = "realism") {
  try {
    const styleProfile = getStyleProfile(styleId);

    console.log("🚀 Starting AutoReelFactory Pipeline...");
    console.log(`🎨 Selected style: ${styleProfile.label}`);

    const outputsDir = path.join(process.cwd(), "outputs");
    ensureDir(outputsDir);

    const characterManifestPath = await generateCharacter(styleProfile);
    const sceneTexts = await sceneSplitter(story);
    const baseScenes = await characterEngine(sceneTexts);
    const aiScenes = await enrichScenesWithOllama(story, baseScenes);
    const directedScenes = await shotDirector(aiScenes, styleProfile);
    const promptedScenes = await promptBuilder(
      directedScenes,
      styleProfile,
      characterManifestPath
    );

    const imageScenes = await generateImages(
      promptedScenes,
      styleProfile,
      characterManifestPath
    );

    const lockedScenes = await applyFaceLockToScenes(
      imageScenes,
      characterManifestPath
    );

    const motionScenes = await motionEngine(lockedScenes);
    const voiceScenes = await voiceEngine(directedScenes);
    await subtitleEngine(voiceScenes);
    const musicData = await musicEngine(motionScenes);
    const finalVideo = await reelComposer(musicData);

    console.log("✅ DONE:", finalVideo);
    return finalVideo;
  } catch (error) {
    console.error("❌ Pipeline failed:", error.message);
    throw error;
  }
}

runPipeline(
  "A man lost in the desert finds a mysterious door. He opens it and sees a glowing city. He walks forward in shock.",
  "realism"
);
