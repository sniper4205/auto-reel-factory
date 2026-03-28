const { getStyleConfig } = require("./styleEngine");
const { buildCinematicShots } = require("./cinematicShotPlanner");
const { directShots } = require("./smartShotDirector");
const { buildCharacterPrompt, extractCharacters } = require("../characters/characterEngine");
const { buildIdentityBlock } = require("../characters/characterIdentityEngine");

function getGlobalQualityRules() {
  return "correct anatomy, natural proportions, clean composition, no extra objects, no background people, no logos";
}

function getShotBase(shotType) {
  if (shotType === "coffee_shop_wide") {
    return {
      prompt: "one young man, Alex alone at a coffee shop table, coffee cup, warm cafe interior, vertical 9:16",
      negativePrompt: "extra people, second person, duplicate body, bad anatomy, logo, text, watermark"
    };
  }

  if (shotType === "alex_reaction_closeup") {
    return {
      prompt: "one young man, close-up of Alex in coffee shop, suspicious expression, warm cafe light, vertical 9:16",
      negativePrompt: "extra people, second face, duplicate person, bad anatomy, logo, text, watermark"
    };
  }

  if (shotType === "suspicious_detail_closeup") {
    return {
      prompt: "close-up detail shot, suspicious clue on coffee shop table, tense mood, cafe blur, vertical 9:16",
      negativePrompt: "extra people, duplicate object, bad anatomy, logo, text, watermark"
    };
  }

  if (shotType === "wide_two_shot") {
    return {
      prompt: "two women talking in living room, medium wide shot, warm interior, sunlight, vertical 9:16",
      negativePrompt: "extra person, third person, crowd, duplicate body, fused body, bad anatomy, logo, text, watermark"
    };
  }

  if (shotType === "speaker_closeup") {
    return {
      prompt: "one young woman, close-up conversation shot, expressive face, warm interior blur, vertical 9:16",
      negativePrompt: "second face, duplicate person, bad anatomy, logo, text, watermark"
    };
  }

  if (shotType === "listener_closeup") {
    return {
      prompt: "one young woman, close-up listening reaction, expressive face, warm interior blur, vertical 9:16",
      negativePrompt: "second face, duplicate person, bad anatomy, logo, text, watermark"
    };
  }

  if (shotType === "outside_transition") {
    return {
      prompt: "two women walking toward parked car, rear wide shot, evening street, vertical 9:16",
      negativePrompt: "third person, crowd, extra people, duplicate body, bad anatomy, logo, text, watermark"
    };
  }

  if (shotType === "car_dashboard_wide") {
    return {
      prompt: "inside generic car, wide dashboard shot, two women in car, road through windshield, sunset, vertical 9:16",
      negativePrompt: "extra passenger, third person, duplicate body, bad anatomy, car logo, text, watermark"
    };
  }

  if (shotType === "driver_closeup") {
    return {
      prompt: "one young woman driving generic car, close-up, hands on wheel, sunset road, vertical 9:16",
      negativePrompt: "second person, duplicate body, bad anatomy, car logo, text, watermark"
    };
  }

  if (shotType === "generic_wide") {
    return {
      prompt: "wide cinematic shot matching script, main subject visible, vertical 9:16",
      negativePrompt: "duplicate person, bad anatomy, logo, text, watermark"
    };
  }

  if (shotType === "generic_closeup") {
    return {
      prompt: "close-up reaction shot matching script, subject face visible, vertical 9:16",
      negativePrompt: "duplicate person, bad anatomy, logo, text, watermark"
    };
  }

  if (shotType === "generic_detail") {
    return {
      prompt: "detail shot matching script, important clue visible, vertical 9:16",
      negativePrompt: "duplicate object, bad anatomy, logo, text, watermark"
    };
  }

  return {
    prompt: "cinematic illustration, vertical 9:16",
    negativePrompt: "duplicate person, bad anatomy, logo, text, watermark"
  };
}

function buildSceneOutfitHint(description = "") {
  const text = String(description).toLowerCase();

  if (text.includes("gym")) return "gym outfit";
  if (text.includes("office")) return "office outfit";
  if (text.includes("car") || text.includes("driving")) return "casual outdoor outfit";
  if (text.includes("coffee shop") || text.includes("cafe")) return "casual modern outfit";
  if (text.includes("living room") || text.includes("indoors") || text.includes("talking")) return "casual home outfit";
  return "scene outfit";
}

function shortCharacterPrompt(characters = []) {
  if (!characters.length) return "";
  return characters
    .slice(0, 2)
    .map((c) => `${c.name}: ${c.description}`)
    .join(", ");
}

function shortIdentityBlock(identityBlock = "") {
  if (!identityBlock) return "";
  return identityBlock
    .replace(/\s+/g, " ")
    .replace(/consistent face/gi, "same face")
    .replace(/same facial structure/gi, "same face shape")
    .replace(/same eye shape/gi, "same eyes")
    .replace(/same hairstyle/gi, "same hair")
    .replace(/same hair color/gi, "same hair color")
    .replace(/same age appearance/gi, "same age")
    .replace(/same body type/gi, "same body")
    .replace(/recognizable character identity/gi, "same identity")
    .replace(/identity:/gi, "")
    .trim();
}

function compactText(text = "") {
  return text
    .replace(/\s+/g, " ")
    .replace(/\s*,\s*/g, ", ")
    .trim();
}

function trimPromptToLimit(parts = [], maxParts = 5) {
  return compactText(parts.filter(Boolean).slice(0, maxParts).join(", "));
}

function buildPromptsFromScript(scriptText, options = {}) {
  const { visualStyle = "anime", projectId = "default_project" } = options;

  const style = getStyleConfig(visualStyle);
  const rawShots = buildCinematicShots(scriptText);
  const directedShots = directShots(rawShots);

  const characters = extractCharacters(scriptText);
  const characterPrompt = shortCharacterPrompt(characters);
  const identityBlock = characters.length ? shortIdentityBlock(buildIdentityBlock(projectId, characters)) : "";
  const globalQualityRules = getGlobalQualityRules();

  return directedShots.map((shot, index) => {
    const base = getShotBase(shot.directedShotType || shot.shotType);
    const outfitHint = buildSceneOutfitHint(shot.description);

    const prompt = trimPromptToLimit([
      base.prompt,
      style.stylePrompt,
      globalQualityRules,
      characterPrompt,
      identityBlock ? `identity: ${identityBlock}` : "",
      outfitHint ? `${outfitHint}` : ""
    ], 5);

    const negativePrompt = trimPromptToLimit([
      base.negativePrompt,
      style.negativePrompt,
      "caption, watermark"
    ], 3);

    return {
      sceneId: index + 1,
      shotId: shot.shotId,
      sceneGroup: shot.sceneGroup,
      shotType: shot.directedShotType || shot.shotType,
      originalShotType: shot.shotType,
      camera: shot.camera,
      framing: shot.framing,
      directorReason: shot.directorReason,
      description: shot.description,
      prompt,
      negativePrompt,
      visualStyle,
      steps: style.steps,
      guidanceScale: style.guidanceScale,
      modelProfile: style.modelProfile,
      characters,
      projectId
    };
  });
}

module.exports = {
  buildPromptsFromScript
};
