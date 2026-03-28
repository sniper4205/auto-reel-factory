const { buildPromptPackages } = require("./stock/promptBuilder");

const analyzedScenes = [
  {
    sceneId: 1,
    text: "Sara and Zara talking in a living room.",
    visualStyle: "anime",
    characterName: "Sara",
    seed: 12345,
    referenceImage: null
  },
  {
    sceneId: 2,
    text: "A quiet living room with warm sunlight through the window.",
    visualStyle: "anime",
    characterName: null,
    seed: 12345,
    referenceImage: null
  },
  {
    sceneId: 3,
    text: "Mark is sitting alone in his room and thinking.",
    visualStyle: "anime",
    characterName: "Mark",
    seed: 12345,
    referenceImage: null
  }
];

const result = buildPromptPackages(analyzedScenes);

console.log(JSON.stringify(result, null, 2));
