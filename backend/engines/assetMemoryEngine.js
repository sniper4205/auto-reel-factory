const usedPrompts = new Set();

function registerPrompt(prompt) {
  usedPrompts.add(prompt);
}

function isRepeated(prompt) {
  return usedPrompts.has(prompt);
}

function resetMemory() {
  usedPrompts.clear();
}

module.exports = {
  registerPrompt,
  isRepeated,
  resetMemory
};
