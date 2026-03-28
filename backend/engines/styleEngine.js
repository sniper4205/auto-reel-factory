function getStyleConfig(style = "anime") {

  const styles = {

    anime: {
      positive:
        "clean anime inspired illustration, soft indoor lighting, detailed scene, vertical composition",
      negative:
        "blurry, distorted face, bad anatomy, extra fingers, watermark, logo"
    },

    realism: {
      positive:
        "cinematic photography, realistic lighting, high detail, vertical frame",
      negative:
        "cartoon, illustration, anime, blurry, distorted face, watermark, logo"
    },

    comic: {
      positive:
        "modern editorial illustration style, bold outlines, flat colors, clean character illustration, storybook illustration, single scene illustration, vertical composition",
      negative:
        "comic strip, comic page, comic panels, grid layout, speech bubbles, captions, text"
    }

  };

  if (!styles[style]) {
    return styles["anime"];
  }

  return styles[style];
}

module.exports = {
  getStyleConfig
};
