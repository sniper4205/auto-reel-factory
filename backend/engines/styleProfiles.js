const STYLE_PROFILES = {
  realism: {
    id: "realism",
    label: "Realism",
    modelKey: "realvis-xl",
    visualProfile: "realistic",
    stylePrompt:
      "photorealistic, cinematic, realistic skin, natural lighting, film still, realistic textures, realistic depth",
    negativePrompt:
      "cartoon, anime, illustration, painting, lego, toy, low quality, blurry, deformed face, extra fingers, watermark, logo, text",
  },

  comic: {
    id: "comic",
    label: "Comic",
    modelKey: "dreamshaper-xl",
    visualProfile: "cartoon",
    stylePrompt:
      "comic book art, graphic novel style, bold outlines, dramatic shading, illustrated panel, stylized storytelling",
    negativePrompt:
      "photorealistic, real photo, low quality, blurry, deformed face, watermark, logo, text",
  },

  creepy_comic: {
    id: "creepy_comic",
    label: "Creepy Comic",
    modelKey: "dreamshaper-xl",
    visualProfile: "cartoon",
    stylePrompt:
      "creepy comic art, horror graphic novel, eerie shadows, unsettling mood, dark illustrated panel, spooky cinematic comic scene",
    negativePrompt:
      "cute, cheerful, photorealistic, real photo, low quality, blurry, watermark, logo, text",
  },

  modern_cartoon: {
    id: "modern_cartoon",
    label: "Modern Cartoon",
    modelKey: "dreamshaper-xl",
    visualProfile: "cartoon",
    stylePrompt:
      "modern cartoon style, clean stylized characters, expressive face, polished animated illustration, vibrant contemporary cartoon look",
    negativePrompt:
      "photorealistic, real photo, gritty realism, low quality, blurry, watermark, logo, text",
  },

  disney: {
    id: "disney",
    label: "Disney-like",
    modelKey: "pixart-sigma",
    visualProfile: "pixar",
    stylePrompt:
      "family animated film style, soft 3d animated character, expressive eyes, warm cinematic lighting, charming stylized world, premium animated movie look",
    negativePrompt:
      "photorealistic, horror, gritty realism, low quality, blurry, watermark, logo, text",
  },

  ghibli: {
    id: "ghibli",
    label: "Ghibli-like",
    modelKey: "dreamshaper-xl",
    visualProfile: "cartoon",
    stylePrompt:
      "hand-painted fantasy animation feel, gentle whimsical environment, soft natural colors, storybook atmosphere, dreamy cinematic illustration",
    negativePrompt:
      "photorealistic, hyperrealism, harsh modern lighting, low quality, blurry, watermark, logo, text",
  },

  anime: {
    id: "anime",
    label: "Anime",
    modelKey: "animagine-xl",
    visualProfile: "anime",
    stylePrompt:
      "anime key visual, detailed anime character, cinematic anime lighting, dramatic composition, polished anime artwork",
    negativePrompt:
      "photorealistic, real photo, western comic, low quality, blurry, watermark, logo, text",
  },

  painting: {
    id: "painting",
    label: "Painting",
    modelKey: "dreamshaper-xl",
    visualProfile: "cartoon",
    stylePrompt:
      "digital painting, painterly brush strokes, rich textures, artistic composition, dramatic painted scene, gallery-quality concept art",
    negativePrompt:
      "photorealistic, real photo, low quality, blurry, watermark, logo, text",
  },

  dark_fantasy: {
    id: "dark_fantasy",
    label: "Dark Fantasy",
    modelKey: "dreamshaper-xl",
    visualProfile: "cartoon",
    stylePrompt:
      "dark fantasy artwork, gothic atmosphere, moody dramatic lighting, epic mystical world, ominous cinematic fantasy scene",
    negativePrompt:
      "bright cheerful cartoon, photorealistic modern city, low quality, blurry, watermark, logo, text",
  },

  lego: {
    id: "lego",
    label: "Lego-like",
    modelKey: "dreamshaper-xl",
    visualProfile: "cartoon",
    stylePrompt:
      "toy brick world, blocky toy character, miniature plastic scene, playful cinematic toy style, detailed brick-built environment",
    negativePrompt:
      "photorealistic human skin, realistic face, low quality, blurry, watermark, logo, text",
  },

  fantastic: {
    id: "fantastic",
    label: "Fantastic",
    modelKey: "pixart-sigma",
    visualProfile: "pixar",
    stylePrompt:
      "fantastical cinematic world, magical atmosphere, epic light rays, imaginative environment, wonder-filled fantasy adventure frame",
    negativePrompt:
      "dull realism, low quality, blurry, watermark, logo, text",
  },
};

function getStyleProfile(styleId = "realism") {
  const key = String(styleId || "realism").trim().toLowerCase();
  return STYLE_PROFILES[key] || STYLE_PROFILES.realism;
}

module.exports = {
  STYLE_PROFILES,
  getStyleProfile,
};
