const fs = require("fs");
const path = require("path");

function pickMusic() {

  const musicDir = path.join(
    process.env.HOME,
    "AutoReelFactory/assets/music"
  );

  const files = fs.readdirSync(musicDir);

  if (!files.length) {
    throw new Error("No music files found");
  }

  const random = files[Math.floor(Math.random() * files.length)];

  return path.join(musicDir, random);
}

module.exports = {
  pickMusic
};
