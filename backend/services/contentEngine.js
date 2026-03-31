const hookList = [
  "You won't believe what happens next...",
  "This changed everything...",
  "Here’s a story you can't miss...",
  "It all started like this...",
];

function generateHook(text) {
  if (!text) return '';
  const idx = Math.floor(Math.random() * hookList.length);
  return hookList[idx];
}

function splitStory(text) {
  return text.replace(/\r?\n/g, ' ').split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter(Boolean);
}

function rewriteScenes(scenes) {
  return scenes.map((scene) => {
    const lower = scene.toLowerCase();
    const cleaned = lower.replace(/\b(the|a|an|and|but|or|so|because)\b/gi, '').trim();
    return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  });
}

function generateCaptions(text) {
  return splitStory(text).map((line) => line.trim());
}

module.exports = {
  generateHook,
  splitStory,
  rewriteScenes,
  generateCaptions,
};
