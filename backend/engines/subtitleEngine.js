const fs = require("fs");
const path = require("path");
const mm = require("music-metadata");

function formatTime(seconds) {

  const ms = Math.floor((seconds % 1) * 1000);
  const s = Math.floor(seconds) % 60;
  const m = Math.floor(seconds / 60) % 60;
  const h = Math.floor(seconds / 3600);

  return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")},${String(ms).padStart(3,"0")}`;
}

async function generateSubtitles(voices, projectId) {

  const outDir = path.join(
    process.env.HOME,
    "AutoReelFactory/output",
    projectId
  );

  fs.mkdirSync(outDir, { recursive: true });

  const srtPath = path.join(outDir, "subtitles.srt");

  let currentTime = 0;
  let index = 1;
  let srt = "";

  for (const v of voices) {

    const meta = await mm.parseFile(v.audio);
    const duration = meta.format.duration || 2;

    const start = formatTime(currentTime);
    const end = formatTime(currentTime + duration);

    srt += `${index}\n`;
    srt += `${start} --> ${end}\n`;
    srt += `${v.text}\n\n`;

    currentTime += duration;
    index++;

  }

  fs.writeFileSync(srtPath, srt);

  return srtPath;
}

module.exports = {
  generateSubtitles
};
