function expandScenesIntoShots(scenes = []) {

  const shots = [];

  scenes.forEach((sceneText, index) => {

    shots.push({
      type: "wide",
      text: sceneText
    });

    shots.push({
      type: "medium",
      text: sceneText
    });

    shots.push({
      type: "close",
      text: sceneText
    });

  });

  return shots;
}

module.exports = {
  expandScenesIntoShots
};
