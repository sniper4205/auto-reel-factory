function cleanText(text) {
  return String(text || "").replace(/\s+/g, " ").trim();
}

function detectMood(text) {
  const t = text.toLowerCase();

  if (/(sad|cry|alone|loss|pain|dark|fear|scared|emotional)/.test(t)) {
    return "emotional";
  }

  if (/(luxury|rich|expensive|wealth|premium|elite)/.test(t)) {
    return "luxury";
  }

  if (/(first time|dream|hope|journey|arrival|travel|airport)/.test(t)) {
    return "cinematic";
  }

  if (/(war|history|ancient|documentary|facts|explained)/.test(t)) {
    return "documentary";
  }

  return "neutral";
}

function detectPlace(text) {
  const t = text.toLowerCase();

  if (/(airport|flight|plane|terminal)/.test(t)) return "airport";
  if (/(new york|nyc|manhattan)/.test(t)) return "new_york";
  if (/(school|classroom|college|university)/.test(t)) return "school";
  if (/(office|startup|company|meeting)/.test(t)) return "office";
  if (/(street|city|downtown)/.test(t)) return "city";
  if (/(home|house|room|bedroom)/.test(t)) return "home";

  return "generic";
}

function detectAge(text) {
  const match = String(text || "").match(/\b(\d{1,2})\s*(year old|years old)\b/i);
  if (!match) return null;

  const age = Number(match[1]);
  return Number.isFinite(age) ? age : null;
}

function detectCharacterType(text, age) {
  const t = text.toLowerCase();

  if (/(girl|daughter|woman|lady|female)/.test(t)) {
    if (age && age < 18) return "teen_girl";
    return "female";
  }

  if (/(boy|son|man|male|guy)/.test(t)) {
    if (age && age < 18) return "teen_boy";
    return "male";
  }

  if (age && age < 18) return "teen";
  return "person";
}

function extractNames(text) {
  const matches = String(text || "").match(/\b[A-Z][a-z]+\b/g) || [];
  const filtered = matches.filter((w) => !["I", "At", "But", "The", "A", "An"].includes(w));
  return [...new Set(filtered)];
}

function detectAction(text) {
  const t = text.toLowerCase();

  if (/(arriv|landing|reached)/.test(t)) return "arriving";
  if (/(walk|walking)/.test(t)) return "walking";
  if (/(run|running)/.test(t)) return "running";
  if (/(talk|speaking|say|said)/.test(t)) return "speaking";
  if (/(look|watch|seeing)/.test(t)) return "looking";
  if (/(build|creating|working)/.test(t)) return "working";

  return "standing";
}

function analyzeScene(scene, visualStyle = "realistic") {
  const text = cleanText(scene?.text || "");
  const age = detectAge(text);
  const names = extractNames(text);

  return {
    sceneId: scene?.sceneId || null,
    text,
    characterName: names[0] || null,
    age,
    characterType: detectCharacterType(text, age),
    place: detectPlace(text),
    action: detectAction(text),
    mood: detectMood(text),
    visualStyle: visualStyle || "realistic"
  };
}

function analyzeScenes(scenes, visualStyle = "realistic") {
  const list = Array.isArray(scenes) ? scenes : [];
  return list.map((scene) => analyzeScene(scene, visualStyle));
}

module.exports = {
  cleanText,
  detectMood,
  detectPlace,
  detectAge,
  detectCharacterType,
  extractNames,
  detectAction,
  analyzeScene,
  analyzeScenes
};
