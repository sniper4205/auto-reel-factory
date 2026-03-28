function extractCapitalizedNames(text = "") {
  const matches = String(text).match(/\b[A-Z][a-z]+\b/g) || [];
  return [...new Set(matches)];
}

function makeCharacterProfile(name, index = 0) {
  const presets = [
    {
      age: "young adult",
      gender: "female",
      hair: "long brown hair",
      face: "soft friendly face",
      outfit: "casual modern outfit"
    },
    {
      age: "young adult",
      gender: "female",
      hair: "short black hair",
      face: "sharp elegant face",
      outfit: "smart casual outfit"
    },
    {
      age: "young adult",
      gender: "female",
      hair: "wavy dark hair",
      face: "bright expressive face",
      outfit: "stylish everyday outfit"
    },
    {
      age: "young adult",
      gender: "male",
      hair: "short dark hair",
      face: "clean confident face",
      outfit: "casual streetwear outfit"
    }
  ];

  const preset = presets[index % presets.length];

  return {
    name,
    age: preset.age,
    gender: preset.gender,
    hair: preset.hair,
    face: preset.face,
    outfit: preset.outfit
  };
}

function buildCharacterMemory(scriptText = "") {
  const names = extractCapitalizedNames(scriptText);

  const characters = names.map((name, index) => makeCharacterProfile(name, index));

  const map = {};
  for (const character of characters) {
    map[character.name.toLowerCase()] = character;
  }

  return {
    names,
    characters,
    map
  };
}

function describeCharacter(character) {
  if (!character) return "";

  return [
    character.age,
    character.gender,
    character.hair,
    character.face,
    character.outfit
  ].join(", ");
}

function injectCharactersIntoPrompt(prompt = "", scriptText = "") {
  const memory = buildCharacterMemory(scriptText);

  if (!memory.characters.length) {
    return {
      prompt,
      characterMemory: memory
    };
  }

  const characterDescriptions = memory.characters
    .map((character) => `${character.name}: ${describeCharacter(character)}`)
    .join(". ");

  return {
    prompt: `${prompt}, consistent character design, ${characterDescriptions}`,
    characterMemory: memory
  };
}

module.exports = {
  buildCharacterMemory,
  injectCharactersIntoPrompt,
  describeCharacter
};
