function generateDialogue(subject = "") {

  const dialogue = [];

  dialogue.push({
    character: "Alex",
    line: "I have been thinking about starting something online."
  });

  dialogue.push({
    character: "Maya",
    line: "Then stop thinking and just start."
  });

  dialogue.push({
    character: "Alex",
    line: "You really think I should try?"
  });

  dialogue.push({
    character: "Maya",
    line: "Every big idea starts with a small step."
  });

  dialogue.push({
    character: "Alex",
    line: "Alright... today is day one."
  });

  return dialogue;
}

module.exports = {
  generateDialogue
};
