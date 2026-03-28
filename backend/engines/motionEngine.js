const fs = require("fs");
const path = require("path");
const { execFile } = require("child_process");

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function runCommand(command, args = []) {
  return new Promise((resolve, reject) => {
    execFile(command, args, { maxBuffer: 1024 * 1024 * 20 }, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(stderr || error.message));
        return;
      }
      resolve({ stdout, stderr });
    });
  });
}

async function createClipFromImage(imagePath, clipPath, options = {}) {
  const duration = Number(options.duration || 3);
  const fps = Number(options.fps || 30);

  ensureDir(path.dirname(clipPath));

  const totalFrames = duration * fps;

  const zoomExpr = `zoompan=z='min(zoom+0.0008,1.08)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${totalFrames}:s=576x1024:fps=${fps}`;

  const filter = [
    "scale=576:1024:force_original_aspect_ratio=increase",
    "crop=576:1024",
    zoomExpr,
    "format=yuv420p"
  ].join(",");

  await runCommand("ffmpeg", [
    "-y",
    "-loop", "1",
    "-i", imagePath,
    "-vf", filter,
    "-t", String(duration),
    "-r", String(fps),
    "-pix_fmt", "yuv420p",
    clipPath
  ]);

  return clipPath;
}

async function motionEngine(imageScenes) {
  console.log("🎞 Applying real motion with FFmpeg...");

  const clips = [];

  for (let i = 0; i < imageScenes.length; i += 1) {
    const scene = imageScenes[i];
    const clipPath = path.join(process.cwd(), "outputs", `clip_${i + 1}.mp4`);

    console.log(`🎬 Creating clip ${i + 1} from ${scene.imagePath}...`);

    await createClipFromImage(scene.imagePath, clipPath, {
      duration: 3,
      fps: 30,
    });

    clips.push({
      ...scene,
      clipPath,
    });
  }

  return clips;
}

module.exports = motionEngine;
