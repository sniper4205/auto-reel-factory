const OLLAMA_URL = "http://127.0.0.1:11434/api/generate";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "mistral";

function normalizeText(value = "") {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function stripCodeFences(text = "") {
  return String(text || "")
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();
}

function tryParseJSONArray(text = "") {
  const cleaned = stripCodeFences(text);

  try {
    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed)) return parsed;
  } catch (_) {}

  const start = cleaned.indexOf("[");
  const end = cleaned.lastIndexOf("]");

  if (start !== -1 && end !== -1 && end > start) {
    const maybeJson = cleaned.slice(start, end + 1);
    try {
      const parsed = JSON.parse(maybeJson);
      if (Array.isArray(parsed)) return parsed;
    } catch (_) {}
  }

  return null;
}

function fallbackScenesFromStory(story = "", leadName = "Main Hero", maxScenes = 3) {
  const parts = String(story)
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, maxScenes);

  while (parts.length < maxScenes) {
    parts.push("cinematic story moment");
  }

  return parts.map((text, index) => {
    let environment = "cinematic setting";

    if (/desert|sand|door/i.test(text)) {
      environment = "desert ruins with mysterious ancient door";
    } else if (/city|glowing/i.test(text)) {
      environment = "glowing futuristic city";
    } else if (/walk|forward|shock/i.test(text)) {
      environment = "mysterious path leading forward";
    }

    return {
      subject: leadName,
      age: "mid 30s",
      action: normalizeText(text),
      environment,
    };
  });
}

async function callOllama(prompt) {
  const response = await fetch(OLLAMA_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      prompt,
      stream: false,
      options: {
        temperature: 0.1,
        top_p: 0.9,
        num_predict: 300,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Ollama HTTP ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  return String(data?.response || "").trim();
}

function buildPrompt({ story = "", leadName = "Main Hero", maxScenes = 3 }) {
  return `
Return ONLY valid JSON.
Do not write title.
Do not write explanation.
Do not write markdown.
Do not write code fences.

Task:
Convert this story into exactly ${maxScenes} cinematic scene objects.

Rules:
- Keep the same lead character in every scene
- Do not invent extra characters
- Do not invent extra events
- Keep each action short
- Keep each environment short

Lead character:
${leadName}

Story:
${story}

Output format exactly:
[
  {
    "subject": "${leadName}",
    "age": "mid 30s",
    "action": "standing near a mysterious door",
    "environment": "desert ruins at golden hour"
  },
  {
    "subject": "${leadName}",
    "age": "mid 30s",
    "action": "reacting to a glowing city",
    "environment": "futuristic glowing skyline"
  },
  {
    "subject": "${leadName}",
    "age": "mid 30s",
    "action": "walking forward in shock",
    "environment": "mysterious glowing passage"
  }
]
`.trim();
}

function sanitizeScene(scene = {}, fallbackSubject = "Main Hero") {
  return {
    subject: normalizeText(scene.subject || fallbackSubject),
    age: normalizeText(scene.age || "mid 30s"),
    action: normalizeText(scene.action || "standing"),
    environment: normalizeText(scene.environment || "cinematic setting"),
  };
}

async function generateAISceneData({ story = "", characters = [], maxScenes = 3 }) {
  const leadName = normalizeText(characters?.[0]?.name || "Main Hero");

  const prompt = buildPrompt({
    story,
    leadName,
    maxScenes,
  });

  const raw = await callOllama(prompt);
  console.log("Raw Ollama response:", raw);

  const parsed = tryParseJSONArray(raw);

  if (!parsed) {
    console.warn("⚠️ Ollama did not return valid JSON, using local fallback scene understanding.");
    return fallbackScenesFromStory(story, leadName, maxScenes);
  }

  const normalized = parsed.slice(0, maxScenes).map((scene) => sanitizeScene(scene, leadName));

  while (normalized.length < maxScenes) {
    normalized.push({
      subject: leadName,
      age: "mid 30s",
      action: "standing",
      environment: "cinematic setting",
    });
  }

  console.log("Ollama parsed scenes:", normalized);
  return normalized;
}

async function generateScenePrompts(args) {
  return generateAISceneData(args);
}

module.exports = {
  generateAISceneData,
  generateScenePrompts,
};
