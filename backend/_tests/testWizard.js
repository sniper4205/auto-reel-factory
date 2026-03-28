const { createProjectConfig } = require("./engines/wizardEngine");

const config = createProjectConfig({

  projectId: "wizard_test_001",

  niche: "true_crime",

  language: "english",

  voice: "female",

  music: "dark_ambient",

  visualStyle: "cinematic",

  captionStyle: "tiktok_bold",

  effects: "parallax"

});

console.log(config);
