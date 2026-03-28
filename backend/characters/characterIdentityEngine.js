const fs = require("fs");
const path = require("path");

const PROJECT_CHARACTER_STORE = path.join(
  process.env.HOME,
  "AutoReelFactory",
  "data",
  "character_identity.json"
);

function loadStore() {
  if (!fs.existsSync(PROJECT_CHARACTER_STORE)) {
    return {};
  }

  return JSON.parse(fs.readFileSync(PROJECT_CHARACTER_STORE));
}

function saveStore(data) {
  fs.writeFileSync(
    PROJECT_CHARACTER_STORE,
    JSON.stringify(data, null, 2)
  );
}

function buildIdentityPrompt(character) {
  return `${character.name} identity:
  consistent face,
  same facial structure,
  same eye shape,
  same hairstyle,
  same hair color,
  same age appearance,
  same body type,
  recognizable character identity`;
}

function ensureProjectCharacters(projectId, characters) {
  const store = loadStore();

  if (!store[projectId]) {
    store[projectId] = characters.map((c) => ({
      name: c.name,
      description: c.description,
      seed: c.seed
    }));

    saveStore(store);
  }

  return store[projectId];
}

function buildIdentityBlock(projectId, characters) {
  const locked = ensureProjectCharacters(projectId, characters);

  return locked
    .map((c) => buildIdentityPrompt(c))
    .join(", ");
}

module.exports = {
  buildIdentityBlock
};
