const fs = require("fs");
const path = require("path");

const storyPath = path.join(__dirname, "story.txt");
const outputPath = path.join(__dirname, "subtitles.srt");

if (!fs.existsSync(storyPath)) {
  console.error("story.txt not found");
  process.exit(1);
}

const story = fs.readFileSync(storyPath, "utf-8").trim();

if (!story) {
  console.error("story.txt is empty");
  process.exit(1);
}

function splitIntoChunks(text) {
  return text
    .replace(/\r/g, "")
    .split(/\n+/)
    .map(line => line.trim())
    .filter(Boolean);
}

function toSrtTime(seconds) {
  const hrs = String(Math.floor(seconds / 3600)).padStart(2, "0");
  const mins = String(Math.floor((seconds % 3600) / 60)).padStart(2, "0");
  const secs = String(Math.floor(seconds % 60)).padStart(2, "0");
  const ms = String(Math.floor((seconds % 1) * 1000)).padStart(3, "0");
  return `${hrs}:${mins}:${secs},${ms}`;
}

const chunks = splitIntoChunks(story);

// Match your current voice/video timing roughly
const totalDuration = 8.4;
const chunkDuration = totalDuration / chunks.length;

let srt = "";

chunks.forEach((chunk, index) => {
  const start = index * chunkDuration;
  const end = (index + 1) * chunkDuration;

  srt += `${index + 1}\n`;
  srt += `${toSrtTime(start)} --> ${toSrtTime(end)}\n`;
  srt += `${chunk.toUpperCase()}\n\n`;
});

fs.writeFileSync(outputPath, srt);

console.log("✅ subtitles.srt created");
