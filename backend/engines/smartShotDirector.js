module.exports = async function smartShotDirector(scenes) {
  return scenes.map((scene, index) => {
    let shot = "medium shot";
    let cameraMove = "slow push-in";
    let staging = "main character clearly visible, centered, front-facing";
    let mood = "cinematic dramatic";
    let lighting = "cinematic golden dramatic lighting";

    if (index === 0) {
      shot = "medium shot";
      cameraMove = "slow push-in";
      staging =
        "main character standing near mysterious door, front-facing, full figure visible, face clearly visible, identity clear";
    }

    if (index === 1) {
      shot = "close-up";
      cameraMove = "slow push-in";
      staging =
        "main character reacting to glowing city, front-facing close-up, face clearly visible, emotional expression, identity clear";
    }

    if (index === 2) {
      shot = "close-up portrait";
      cameraMove = "slow push-in";
      staging =
        "main character close-up portrait, face clearly visible, same person, no silhouette, no back view";
    }

    return {
      ...scene,
      shot,
      cameraMove,
      staging,
      mood,
      lighting,
    };
  });
};
