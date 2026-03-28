const { generateScript } = require("./engines/scriptGenerator");

const result = generateScript({
  niche: "true_crime",
  subject: "a man in a coffee shop noticing something strange"
});

console.log(JSON.stringify(result, null, 2));
