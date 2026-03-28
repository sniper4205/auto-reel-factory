function createProjectConfig(options) {
  const config = {
    projectId: options.projectId || `project_${Date.now()}`,
    niche: options.niche || "general",
    language: options.language || "english",
    voice: options.voice || "female",
    music: options.music || "auto",
    visualStyle: options.visualStyle || "cinematic",
    captionStyle: options.captionStyle || "bold",
    effects: options.effects || "pan_zoom",
    renderMode: options.renderMode || "fast"
  };

  return config;
}

module.exports = {
  createProjectConfig
};
