function safeText(value = "") {
  return String(value).replace(/\s+/g, " ").trim();
}

function buildCharacterLine(character = {}) {
  const name = safeText(character.name || "Unknown Character");
  const look = safeText(character.look || "natural human appearance");
  const role = safeText(character.role || "support");
  const seed =
    Number.isFinite(character.seed) || /^\d+$/.test(String(character.seed || ""))
      ? `seed ${character.seed}`
      : "";

  const parts = [name, look, role, seed].filter(Boolean);
  return parts.join(", ");
}

function buildCharacterPrompt(characters = []) {
  if (!Array.isArray(characters) || characters.length === 0) {
    return "";
  }

  const descriptions = characters.map(buildCharacterLine).filter(Boolean);

  if (!descriptions.length) {
    return "";
  }

  return [
    "consistent characters across scenes",
    "same character identity in every scene",
    "same face structure",
    "same hairstyle",
    "same clothing",
    "same age and appearance",
    ...descriptions,
  ].join(", ");
}

function injectCharactersIntoPrompt(basePrompt = "", characters = []) {
  const cleanBase = safeText(basePrompt);
  const characterText = buildCharacterPrompt(characters);

  if (!characterText) {
    return cleanBase;
  }

  return [
    cleanBase,
    characterText,
    "cinematic lighting",
    "high detail",
    "film still composition",
  ]
    .filter(Boolean)
    .join(", ");
}

module.exports = {
  buildCharacterPrompt,
  injectCharactersIntoPrompt,
};
