const fs = require('fs');
const path = require('path');

const charactersDir = path.resolve(__dirname, '..', 'characters');

function ensureCharactersDir() {
  fs.mkdirSync(charactersDir, { recursive: true });
}

function computeSeed(input) {
  let hash = 0;
  const str = String(input || '');
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function saveCharacter(character) {
  ensureCharactersDir();
  const safeName = String(character.name || 'Unknown').trim();
  const filename = safeName.toLowerCase().replace(/\s+/g, '_') + '.json';
  const filePath = path.join(charactersDir, filename);
  fs.writeFileSync(filePath, JSON.stringify(character, null, 2), 'utf8');
}

function loadCharacter(name) {
  ensureCharactersDir();
  const safeName = String(name || 'Unknown').trim();
  const filename = safeName.toLowerCase().replace(/\s+/g, '_') + '.json';
  const filePath = path.join(charactersDir, filename);
  let character;
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    character = JSON.parse(raw);
  } catch (err) {
    character = {
      name: safeName,
      look: 'natural appearance',
      role: 'support',
    };
  }
  character.seed = computeSeed(character.name);
  if (!character.referenceImage) {
    character.referenceImage = null;
  }
  saveCharacter(character);
  return character;
}

function setReferenceImage(name, imagePath) {
  const character = loadCharacter(name);
  character.referenceImage = imagePath;
  saveCharacter(character);
}

function getReferenceImage(name) {
  const safeName = String(name || 'Unknown').trim();
  const filename = safeName.toLowerCase().replace(/\s+/g, '_') + '.json';
  const filePath = path.join(charactersDir, filename);
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    const character = JSON.parse(raw);
    return character.referenceImage || null;
  } catch (err) {
    return null;
  }
}

function buildCharacterPrompt(characters = []) {
  if (!Array.isArray(characters) || characters.length === 0) {
    return '';
  }
  const descriptors = characters.map((c) => {
    const parts = [];
    if (c.name) parts.push(c.name);
    if (c.look) parts.push(c.look);
    if (c.role) parts.push(c.role);
    return parts.join(', ');
  });
  const intro = 'consistent character identities, same face structure, same hairstyle, same clothing';
  return [intro, ...descriptors].filter(Boolean).join(', ');
}

module.exports = {
  loadCharacter,
  saveCharacter,
  computeSeed,
  buildCharacterPrompt,
  setReferenceImage,
  getReferenceImage,
};
