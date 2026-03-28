const { attachCharacterSeeds } = require("./characterMemory");

function buildCharacterPrompt(characters = []) {
  if (!characters.length) return "";

  const descriptions = characters.map((c) => {
    return `${c.name}: ${c.description}, fixed seed ${c.seed}`;
  });

  return descriptions.join(". ") + ".";
}

function extractCharacters(script) {
  const characters = [];

  if (script.toLowerCase().includes("sara")) {
    characters.push({
      name: "Sara",
      description: "young adult woman, long brown hair, soft friendly face, casual modern outfit"
    });
  }

  if (script.toLowerCase().includes("zara")) {
    characters.push({
      name: "Zara",
      description: "young adult woman, short black hair, sharp elegant face, smart casual outfit"
    });
  }

  return attachCharacterSeeds(characters);
}

module.exports = {
  buildCharacterPrompt,
  extractCharacters
};
