const { execSync } = require("child_process");
const path = require("path");
const fs = require("fs");

const OUTPUT_DIR = path.resolve(__dirname, "../../assets/generated/final");
const TEMP_DIR = path.resolve(__dirname, "../../assets/generated/temp");

function ensureDirs() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR, { recursive: true });
  }
}

function mergeSceneClips(sceneResults, projectId = "project") {
  ensureDirs();

  const validScenes = (sceneResults || []).filter(
    (scene) => scene && scene.rendered === true && scene.path
  );

  if (!validScenes.length) {
    return {
      merged: false,
      reason: "no_rendered_scenes"
    };
  }

  if (validScenes.length === 1) {
    const singleOutput = path.join(OUTPUT_DIR, `${projectId}_merged.mp4`);
    fs.copyFileSync(validScenes[0].path, singleOutput);

    return {
      merged: true,
      path: singleOutput
    };
  }

  let currentPath = validScenes[0].path;
  let currentDuration = validScenes[0].duration || 2;

  for (let i = 1; i < validScenes.length; i++) {
    const nextPath = validScenes[i].path;
    const nextDuration = validScenes[i].duration || 2;
    const outputFile = path.join(TEMP_DIR, `${projectId}_transition_${i}.mp4`);

    const fadeDuration = 0.4;
    const offset = Math.max(0, currentDuration - fadeDuration);

    execSync(
      `ffmpeg -y -i "${currentPath}" -i "${nextPath}" -filter_complex "[0:v][1:v]xfade=transition=fade:duration=${fadeDuration}:offset=${offset},format=yuv420p[v]" -map "[v]" -r 25 "${outputFile}"`,
      { stdio: "ignore" }
    );

    currentPath = outputFile;
    currentDuration = currentDuration + nextDuration - fadeDuration;
  }

  const finalOutput = path.join(OUTPUT_DIR, `${projectId}_merged.mp4`);
  fs.copyFileSync(currentPath, finalOutput);

  if (!fs.existsSync(finalOutput)) {
    return {
      merged: false,
      reason: "merged_file_missing"
    };
  }

  return {
    merged: true,
    path: finalOutput
  };
}

module.exports = {
  mergeSceneClips
};
