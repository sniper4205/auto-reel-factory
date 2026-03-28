function splitIntoScenes(script) {

  const sentences = script
    .split(/[.!?]/)
    .map(s => s.trim())
    .filter(Boolean);

  const scenes = [];

  sentences.forEach((sentence, i) => {

    scenes.push({
      text: sentence,
      duration: 4,
      index: i
    });

  });

  return scenes;

}

function optimizeScenes(scenes) {

  return scenes.map((scene, i) => {

    let duration = 4;

    if (scene.text.length > 80) {
      duration = 5;
    }

    if (scene.text.length < 30) {
      duration = 3;
    }

    return {
      ...scene,
      duration,
      index: i
    };

  });

}

function reelDirector(script) {

  const scenes = splitIntoScenes(script);

  const optimized = optimizeScenes(scenes);

  return optimized;

}

module.exports = reelDirector;
