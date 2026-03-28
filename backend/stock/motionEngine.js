function pickMotionPreset(sceneId = 1) {
  const presets = ["zoom_in", "zoom_out", "zoom_in", "zoom_out"];
  return presets[(sceneId - 1) % presets.length];
}

function buildImageMotionFilter(duration, fps, preset) {
  const totalFrames = Math.max(1, Math.floor(duration * fps));

  if (preset === "zoom_out") {
    return [
      "scale=1080:1920:force_original_aspect_ratio=increase",
      "crop=1080:1920",
      `zoompan=z='if(eq(on,1),1.15,max(1.0,zoom-0.0015))':d=${totalFrames}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1080x1920:fps=${fps}`
    ].join(",");
  }

  return [
    "scale=1080:1920:force_original_aspect_ratio=increase",
    "crop=1080:1920",
    `zoompan=z='min(zoom+0.0015,1.15)':d=${totalFrames}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1080x1920:fps=${fps}`
  ].join(",");
}

module.exports = {
  pickMotionPreset,
  buildImageMotionFilter
};
