const generateImage = require("./generateImages")

function splitIntoScenes(script) {
  return String(script)
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean)
}

function cleanSceneText(line) {
  return line.replace(/\s+/g, " ").trim().slice(0, 120)
}

function buildPromptFromLine(line) {
  return `${line}, cinematic realistic photo, dramatic lighting, vertical composition, highly detailed`
}

async function buildScenes(script) {
  const lines = splitIntoScenes(script)
  const scenes = []

  let index = 1

  for (const rawLine of lines) {
    const text = cleanSceneText(rawLine)
    const prompt = buildPromptFromLine(text)
    const image = await generateImage(prompt, index)

    scenes.push({
      text,
      prompt,
      image
    })

    index++
  }

  return scenes
}

module.exports = buildScenes
