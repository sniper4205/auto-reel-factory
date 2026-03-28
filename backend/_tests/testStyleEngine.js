const { buildStyledPrompt } = require("./engines/styleEngine");

const basePrompt = "Sara and Zara talking inside a living room, vertical composition, high detail";

console.log("REALISM:");
console.log(buildStyledPrompt(basePrompt, "realism"));
console.log("");

console.log("ANIME:");
console.log(buildStyledPrompt(basePrompt, "anime"));
console.log("");

console.log("GHIBLI:");
console.log(buildStyledPrompt(basePrompt, "ghibli"));
console.log("");

console.log("CREEPY COMIC:");
console.log(buildStyledPrompt(basePrompt, "creepy comic"));
