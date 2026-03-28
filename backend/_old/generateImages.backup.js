const axios = require("axios")
const path = require("path")
const fs = require("fs")
const { execFileSync } = require("child_process")

function makeFallbackImage(filePath, text, index) {
  const fontPath = "/System/Library/Fonts/Supplemental/Verdana Bold.ttf"
  const backgrounds = [
    "#0f172a",
    "#1e293b",
    "#172554",
    "#0f766e",
    "#3f3f46",
    "#3b0764"
  ]
  const bg = backgrounds[(index - 1) % backgrounds.length]

  execFileSync("magick", [
    "-size", "1080x1920",
    `xc:${bg}`,
    "-fill", "white",
    "-font", fontPath,
    "-gravity", "center",
    "-pointsize", "56",
    "-annotate", "+0-80", text.substring(0, 90),
    "-fill", "#cbd5e1",
    "-pointsize", "28",
    "-annotate", "+0+760", "Auto Reel Factory Scene",
    filePath
  ])
}

async function tryPollinations(prompt, filePath) {
  const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}`
  const response = await axios({
    url,
    method: "GET",
    responseType: "arraybuffer",
    timeout: 8000,
    validateStatus: (status) => status >= 200 && status < 300
  })

  fs.writeFileSync(filePath, response.data)
  return filePath
}

async function generateImage(prompt, index) {
  const filePath = path.join(__dirname, "images", `scene_${index}.jpg`)
  const shortPrompt = String(prompt).replace(/\s+/g, " ").trim().slice(0, 120)

  try {
    console.log(`Generating real image for scene ${index}`)
    await tryPollinations(shortPrompt, filePath)
    console.log(`Real image created for scene ${index}`)
    return filePath
  } catch (error) {
    console.log(`Real image failed for scene ${index}, using fallback`)
    makeFallbackImage(filePath, shortPrompt, index)
    return filePath
  }
}

module.exports = generateImage
