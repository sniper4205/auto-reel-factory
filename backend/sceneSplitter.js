async function splitScenes(story) {
  const prompt = `
You are a cinematic scene generator.

Convert the following story into EXACTLY 5 scenes.

Each scene must include:
- scene_number
- scene_description
- mood
- shot_type

Return ONLY valid JSON array like this:
[
  {
    "scene_number": 1,
    "scene_description": "...",
    "mood": "...",
    "shot_type": "..."
  }
]

STORY:
${story}
`;

  const response = await fetch("http://localhost:11434/api/generate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "mistral",
      prompt,
      stream: false
    })
  });

  const data = await response.json();

  try {
    return JSON.parse(data.response);
  } catch (err) {
    console.error("Failed to parse scenes:");
    console.log(data.response);
    return [];
  }
}

module.exports = { splitScenes };
