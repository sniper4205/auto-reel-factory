const crypto = require("crypto");

const characterRegistry = {};

function generateSeed() {
  return parseInt(
    crypto.createHash("md5").update(Date.now().toString()).digest("hex").slice(0,8),
    16
  );
}

function detectCharactersFromScenes(scenes) {
  const characters = {};

  for (const scene of scenes) {
    const text = scene.text || "";

const match = text.match(/\b(John|Sarah|Mike|David|Anna|Alex|Chris|Daniel|Emma|James)\b/);
    if (!match) continue;

    const name = match[0];

    if (!characters[name]) {
      characters[name] = {
        name,
        seed: generateSeed()
      };
    }
  }

  return characters;
}

function registerCharacters(characters) {
  for (const name in characters) {
    characterRegistry[name] = characters[name];
  }
}

function attachCharactersToScenes(scenes) {
  return scenes.map(scene => {

    const text = scene.text || "";
    const match = text.match(/\b[A-Z][a-z]+\b/);

    if (!match) return scene;

    const name = match[0];

    if (!characterRegistry[name]) return scene;

    return {
      ...scene,
      character: characterRegistry[name]
    };

  });
}

module.exports = {
  detectCharactersFromScenes,
  registerCharacters,
  attachCharactersToScenes
};
