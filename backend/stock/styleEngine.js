function getStyleConfig(visualStyle = "anime") {
  const styles = {
    anime: {
      stylePrompt: "anime illustration, clean line art, soft cinematic lighting, polished character design",
      negativePrompt: "photorealistic, ugly anatomy, noisy realism, sketchy lines",
      steps: 18,
      guidanceScale: 7,
      modelProfile: "fast_sd15"
    },

    comic: {
      stylePrompt: "comic book illustration, bold ink lines, stylized shading, dramatic composition",
      negativePrompt: "photorealistic, blurry, messy sketch, noisy realism",
      steps: 18,
      guidanceScale: 7,
      modelProfile: "fast_sd15"
    },

    cartoon: {
      stylePrompt: "cartoon illustration, smooth clean shapes, vibrant simplified shading, appealing character design",
      negativePrompt: "photorealistic, ugly anatomy, messy sketch, dull colors",
      steps: 17,
      guidanceScale: 6.8,
      modelProfile: "fast_sd15"
    },

    cinematic: {
      stylePrompt: "cinematic illustration, realistic lighting, dramatic mood, polished digital art",
      negativePrompt: "low detail, messy sketch, flat lighting, ugly anatomy",
      steps: 20,
      guidanceScale: 7.2,
      modelProfile: "fast_sd15"
    },

    realistic: {
      stylePrompt: "semi realistic digital illustration, natural lighting, detailed environment, polished character rendering",
      negativePrompt: "cartoon, anime, sketchy lines, ugly anatomy, blurry",
      steps: 20,
      guidanceScale: 7.2,
      modelProfile: "fast_sd15"
    },

    creepy_comic: {
      stylePrompt: "dark creepy comic illustration, moody shadows, eerie atmosphere, dramatic inked style",
      negativePrompt: "bright cheerful cartoon, photorealistic, messy sketch, blurry",
      steps: 19,
      guidanceScale: 7.3,
      modelProfile: "fast_sd15"
    }
  };

  return styles[visualStyle] || styles.anime;
}

module.exports = {
  getStyleConfig
};
