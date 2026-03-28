function buildHook(niche) {
  const hooks = {
    scary_stories: "It started with a strange sound in the middle of the night.",
    history: "Most people do not know what really happened that day.",
    true_crime: "What happened next made investigators question everything.",
    stoic_motivation: "The strongest people stay calm when life becomes difficult.",
    general: "This story begins with a simple moment that changes everything."
  };

  return hooks[niche] || hooks.general;
}

function buildScenes(niche, subject = "") {
  const sceneMap = {
    scary_stories: [
      "A person is alone inside a dark house at night.",
      "A strange sound comes from another room.",
      "The person slowly walks toward the sound.",
      "A shadow appears near the doorway.",
      "The phone screen lights up with a warning message.",
      "Everything suddenly goes silent."
    ],
    history: [
      "An important historical setting is introduced.",
      "A key figure appears and faces a difficult decision.",
      "Public tension grows around the event.",
      "A turning point changes the course of events.",
      "The consequences spread quickly.",
      "The moment leaves a lasting historical impact."
    ],
    true_crime: [
      "A man named Alex is sitting alone in a coffee shop.",
      "Alex notices something unusual across the room.",
      "A suspicious detail begins to stand out near another table.",
      "The tension rises as Alex keeps watching carefully.",
      "A dangerous truth starts to become clear in the coffee shop.",
      "The scene ends with a dramatic unanswered question."
    ],
    stoic_motivation: [
      "A person faces a difficult moment in life.",
      "Pressure builds and emotions begin to rise.",
      "They pause and choose self-control instead of panic.",
      "A calm decision changes the situation.",
      "Discipline and patience guide the next step.",
      "The lesson becomes clear through action."
    ],
    general: [
      "The story opens with an ordinary moment.",
      "Something unexpected changes the mood.",
      "The main character reacts with curiosity.",
      "A new challenge appears.",
      "The tension rises.",
      "The story ends with a strong takeaway."
    ]
  };

  const scenes = sceneMap[niche] || sceneMap.general;

  if (subject && niche !== "true_crime") {
    return scenes.map((s, i) => (i === 0 ? `${s} This story is about ${subject}.` : s));
  }

  return scenes;
}

function buildNarration(niche, subject = "") {
  const hook = buildHook(niche);
  const scenes = buildScenes(niche, subject);

  return [hook, ...scenes].join(" ");
}

function generateScript(config = {}) {
  const niche = config.niche || "general";
  const subject = config.subject || "";

  return {
    niche,
    subject,
    hook: buildHook(niche),
    scenes: buildScenes(niche, subject),
    narration: buildNarration(niche, subject)
  };
}

module.exports = {
  generateScript
};
