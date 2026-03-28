const { routeScenes } = require("./engines/sceneComplexityRouter");

const scenes = [
  { sceneId: 1, text: "Sara and Zara talking in a living room." },
  { sceneId: 2, text: "A quiet living room with warm sunlight through the window." },
  { sceneId: 3, text: "Mark is sitting alone in his room and thinking." },
  { sceneId: 4, text: "A crowd is running on the street during a chaotic scene." },
  { sceneId: 5, text: "A coffee cup on a table near a sofa." }
];

const result = routeScenes(scenes);

console.log(JSON.stringify(result, null, 2));
