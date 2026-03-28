const fs = require("fs")
const axios = require("axios")

const COMFY_URL = "http://127.0.0.1:8188/prompt"

// load your saved workflow
const workflow = require("./API Comfy.json")

async function sendToComfy(promptText, index) {
  const newWorkflow = JSON.parse(JSON.stringify(workflow))

  // 🔥 Replace prompt
  newWorkflow["4"].inputs.text = promptText

  // 🔥 Set filename per scene
  newWorkflow["7"].inputs.filename_prefix = `scene_${index}`

  console.log(`Sending prompt to ComfyUI for scene ${index}...`)

  await axios.post(COMFY_URL, {
    prompt: newWorkflow
  })

  console.log(`Scene ${index} sent to ComfyUI`)
}
async function run() {
  const prompts = require("./prompts.json")

  for (let i = 0; i < prompts.length; i++) {
    await sendToComfy(prompts[i], i + 1)
  }

  console.log("✅ All prompts sent to ComfyUI")
}

run()
