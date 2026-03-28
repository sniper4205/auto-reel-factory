/*
STYLE ROUTER ENGINE
Chooses video style AND AI model
*/

function detectStyle(script) {
  const text = (script.narration || "").toLowerCase()

  const animeWords = ["anime", "samurai", "manga"]
  const cartoonWords = ["cartoon", "kids", "funny"]
  const historyWords = ["history", "president", "war", "empire", "ancient"]
  const viralWords = ["you won't believe", "secret", "crazy", "top"]

  if (animeWords.some(w => text.includes(w))) return "anime"
  if (cartoonWords.some(w => text.includes(w))) return "cartoon"
  if (viralWords.some(w => text.includes(w))) return "viral"

  if (historyWords.some(w => text.includes(w))) return "story"

  return "story"
}

function buildStyleConfig(mode) {

  if (mode === "anime") {
    return {
      mode: "anime",
      modelKey: "animagine-xl",
      visualProfile: "anime",
      sceneDuration: 3,
      motion: { type: "punch", zoom: 1.2, pan: "fast" }
    }
  }

  if (mode === "cartoon") {
    return {
      mode: "cartoon",
      modelKey: "dreamshaper-xl",
      visualProfile: "cartoon",
      sceneDuration: 3,
      motion: { type: "punch", zoom: 1.2, pan: "fast" }
    }
  }

  if (mode === "viral") {
    return {
      mode: "viral",
      modelKey: "dreamshaper-xl",
      visualProfile: "cartoon",
      sceneDuration: 2.5,
      motion: { type: "punch", zoom: 1.25, pan: "fast" }
    }
  }

  return {
    mode: "story",
    modelKey: "juggernaut-xl",
    visualProfile: "cinematic",
    sceneDuration: 4.5,
    motion: { type: "cinematic", zoom: 1.1, pan: "slow" }
  }
}

function styleRouter(config, script) {

  const detectedMode = detectStyle(script)

  const style = buildStyleConfig(detectedMode)

  return {
    ...config,
    style,
    modelKey: style.modelKey,
    visualProfile: style.visualProfile
  }
}

module.exports = styleRouter
