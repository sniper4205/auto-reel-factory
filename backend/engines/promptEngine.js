const { buildCharacterPrompt } = require('./characterEngine');

const GLOBAL_NEGATIVE = 'blurry, low quality, deformed, extra limbs, watermark, text, logo, nsfw, boring composition';

function buildPrompt(scene = {}, style = {}, characters = []) {
  const parts = [];
  const subject = String(scene.subject || '').trim();
  const action = String(scene.action || '').trim();
  const environment = String(scene.environment || '').trim();
  const camera = String(scene.camera || '').trim();
  const lighting = String(scene.lighting || '').trim();
  const mood = String(scene.mood || style.mood || '').trim();

  if (subject && action) {
    parts.push(`${subject} ${action}`);
  } else if (subject) {
    parts.push(subject);
  }
  if (environment) {
    parts.push(environment);
  }
  if (camera) {
    parts.push(camera);
  }
  if (style.promptTemplate) {
    parts.push(style.promptTemplate);
  }
  if (style.colour) {
    parts.push(`colours: ${style.colour}`);
  }
  if (style.lighting || lighting) {
    const combinedLighting = [lighting, style.lighting].filter(Boolean).join(', ');
    parts.push(`lighting: ${combinedLighting}`);
  }
  if (mood) {
    parts.push(`mood: ${mood}`);
  }
  const charPrompt = buildCharacterPrompt(characters);
  if (charPrompt) {
    parts.push(charPrompt);
  }
  const prompt = parts.filter(Boolean).join(', ');

  const negatives = [style.negative || '', GLOBAL_NEGATIVE]
    .filter(Boolean)
    .join(', ');
  return { prompt, negative: negatives };
}

module.exports = {
  buildPrompt,
};
