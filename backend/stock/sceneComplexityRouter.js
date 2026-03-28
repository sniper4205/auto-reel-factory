function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function sceneComplexityRouter(scene) {

  const text = scene.toLowerCase();

  const dialogueWords = [
    "talk",
    "talking",
    "conversation",
    "chat",
    "meeting",
    "argue",
    "speaking",
    "discuss"
  ];

  const multiCharacterIndicators = [
    " and ",
    " with ",
    "together",
    "friends",
    "group",
    "family",
    "team"
  ];

  const crowdWords = [
    "crowd",
    "party",
    "people",
    "audience",
    "many people",
    "crowded"
  ];

  let riskScore = 0;

  dialogueWords.forEach(word => {
    if (text.includes(word)) riskScore += 2;
  });

  multiCharacterIndicators.forEach(word => {
    if (text.includes(word)) riskScore += 2;
  });

  crowdWords.forEach(word => {
    if (text.includes(word)) riskScore += 3;
  });

  const environmentShots = [
`cinematic living room interior, warm lighting, soft shadows, cozy atmosphere, modern sofa, window light, no people`,
`cinematic office interior, dramatic lighting, modern workspace, clean composition, no people`,
`cinematic coffee shop interior, moody lighting, empty tables, atmospheric lighting, no people`,
`cinematic apartment interior, evening light through window, realistic shadows, no people`
  ];

  const objectShots = [
`cinematic close-up of smartphone on wooden table, dramatic lighting, shallow depth of field`,
`cinematic close-up of coffee cup with steam, warm lighting, cozy atmosphere`,
`cinematic laptop on desk with city lights in background, shallow depth of field`,
`cinematic notebook and pen on table, soft window lighting`
  ];

  const atmosphereShots = [
`cinematic sunlight through window blinds, dust particles in air, dramatic lighting`,
`cinematic rain on window glass with city lights bokeh`,
`cinematic hallway with long shadows, dramatic lighting`,
`cinematic room illuminated by soft lamp light`
  ];

  // HIGH RISK
  if (riskScore >= 4) {

    const prompt = randomItem(environmentShots);

    return {
      strategy: "environment",
      prompt
    };

  }

  // MEDIUM RISK
  if (riskScore >= 2) {

    const prompt = randomItem(objectShots);

    return {
      strategy: "object",
      prompt
    };

  }

  // SAFE
  const prompt = randomItem(atmosphereShots);

  return {
    strategy: "atmosphere",
    prompt
  };

}

module.exports = sceneComplexityRouter;
