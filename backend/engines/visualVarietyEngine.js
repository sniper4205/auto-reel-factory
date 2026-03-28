function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getVisualVariety() {

  const shotTypes = [
    "wide shot",
    "medium shot",
    "close-up shot",
    "macro shot",
    "overhead shot",
    "cinematic establishing shot"
  ];

  const cameraAngles = [
    "eye level camera",
    "low angle camera",
    "high angle camera",
    "over the shoulder camera",
    "side profile camera"
  ];

  const lensTypes = [
    "50mm cinematic lens",
    "35mm film lens",
    "85mm portrait lens",
    "wide angle lens",
    "cinematic depth of field"
  ];

  const lightingStyles = [
    "soft cinematic lighting",
    "dramatic moody lighting",
    "warm sunset lighting",
    "natural window lighting",
    "studio lighting"
  ];

  return `
${randomItem(shotTypes)}
${randomItem(cameraAngles)}
${randomItem(lensTypes)}
${randomItem(lightingStyles)}
`;

}

module.exports = getVisualVariety;
