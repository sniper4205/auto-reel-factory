const fs = require("fs");
const path = require("path");

const PROJECT_ROOT = path.resolve(__dirname, "..", "..");
const CHARACTER_DIR = path.join(PROJECT_ROOT, "characters");

function ensureCharacterDir() {
  fs.mkdirSync(CHARACTER_DIR, { recursive: true });
}

function safeText(value = "") {
  return String(value).replace(/\s+/g, " ").trim();
}

function slugify(value = "") {
  return safeText(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function stableSeedFromName(name = "") {
  const text = safeText(name || "character");
  let hash = 0;

  for (let i = 0; i < text.length; i++) {
    hash = (hash * 31 + text.charCodeAt(i)) >>> 0;
  }

  return 100000 + (hash % 900000);
}

function normalizeCharacter(character = {}, index = 0) {
  const rawName =
    character.name ||
    character.character ||
    character.id ||
    `Character_${index + 1}`;

  const name = safeText(rawName) || `Character_${index + 1}`;

  const look = safeText(
    character.look ||
      character.appearance ||
      character.face ||
      "natural human appearance"
  );

  const role = safeText(character.role || "support");

  const seed = Number.isFinite(character.seed)
    ? character.seed
    : stableSeedFromName(name);

  const slug = slugify(name) || `character_${index + 1}`;

  const referenceImage = safeText(
    character.referenceImage ||
      character.reference_image ||
      character.ref ||
      ""
  );

  return {
    id: `char_${index + 1}`,
    slug,
    name,
    look,
    role,
    seed,
    referenceImage,
  };
}

function loadSavedCharacter(slug = "") {
  ensureCharacterDir();

  const filePath = path.join(CHARACTER_DIR, `${slug}.json`);
  if (!fs.existsSync(filePath)) return null;

  try {
    const raw = fs.readFileSync(filePath, "utf8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function saveCharacter(character = {}) {
  ensureCharacterDir();

  const filePath = path.join(CHARACTER_DIR, `${character.slug}.json`);

  const payload = {
    name: character.name,
    seed: character.seed,
    role: character.role,
    look: character.look,
  };

  if (character.referenceImage) {
    payload.referenceImage = character.referenceImage;
  }

  fs.writeFileSync(filePath, JSON.stringify(payload, null, 2), "utf8");
}

function mergeCharacterData(baseCharacter = {}, savedCharacter = {}) {
  return {
    ...baseCharacter,
    look: safeText(savedCharacter.look || baseCharacter.look),
    role: safeText(savedCharacter.role || baseCharacter.role),
    seed: Number.isFinite(savedCharacter.seed)
      ? savedCharacter.seed
      : baseCharacter.seed,
    referenceImage: safeText(
      savedCharacter.referenceImage || baseCharacter.referenceImage || ""
    ),
  };
}

function buildCharacterPrompt(character = {}) {
  const parts = [
    safeText(character.name),
    safeText(character.look),
    safeText(character.role),
    Number.isFinite(character.seed) ? `seed ${character.seed}` : "",
  ].filter(Boolean);

  return parts.join(", ");
}

async function registerCharacters({ config, script, characters = [] }) {
  ensureCharacterDir();

  let detectedCharacters = [];

  if (Array.isArray(characters) && characters.length) {
    detectedCharacters = characters;
  } else if (script && Array.isArray(script.characters) && script.characters.length) {
    detectedCharacters = script.characters;
  }

  const registry = detectedCharacters.map((char, i) => {
    const normalized = normalizeCharacter(char, i);
    const saved = loadSavedCharacter(normalized.slug);

    const finalCharacter = saved
      ? mergeCharacterData(normalized, saved)
      : normalized;

    if (!saved) {
      saveCharacter(finalCharacter);
    }

    return finalCharacter;
  });

  const promptMap = registry.map((char) => ({
    id: char.id,
    slug: char.slug,
    name: char.name,
    prompt: buildCharacterPrompt(char),
    role: char.role,
    seed: char.seed,
    referenceImage: char.referenceImage || "",
  }));

  return {
    characters: registry,
    prompts: promptMap,
  };
}

module.exports = {
  registerCharacters,
};
