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

function assembleFinalVideo(mergedVideoPath, voiceoverPath, projectId = "project", endingPath = null) {
  ensureDirs();

  if (!mergedVideoPath || !fs.existsSync(mergedVideoPath)) {
    return {
      assembled: false,
      reason: "merged_video_missing"
    };
  }

  if (!voiceoverPath || !fs.existsSync(voiceoverPath)) {
    return {
      assembled: false,
      reason: "voiceover_missing"
    };
  }

  const voicedOutput = path.join(TEMP_DIR, `${projectId}_voiced.mp4`);

  execSync(
    `ffmpeg -y -i "${mergedVideoPath}" -i "${voiceoverPath}" -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -shortest "${voicedOutput}"`,
    { stdio: "ignore" }
  );

  if (!fs.existsSync(voicedOutput)) {
    return {
      assembled: false,
      reason: "voiced_file_missing"
    };
  }

  if (endingPath && fs.existsSync(endingPath)) {
    const listFile = path.join(TEMP_DIR, `${projectId}_ending_concat.txt`);
    const finalOutput = path.join(OUTPUT_DIR, `${projectId}_final.mp4`);

    const listContent = [
      `file '${voicedOutput.replace(/'/g, "'\\''")}'`,
      `file '${endingPath.replace(/'/g, "'\\''")}'`
    ].join("\n");

    fs.writeFileSync(listFile, listContent, "utf8");

    execSync(
      `ffmpeg -y -f concat -safe 0 -i "${listFile}" -c copy "${finalOutput}"`,
      { stdio: "ignore" }
    );

    if (!fs.existsSync(finalOutput)) {
      return {
        assembled: false,
        reason: "final_file_missing"
      };
    }

    return {
      assembled: true,
      path: finalOutput
    };
  }

  const outputFile = path.join(OUTPUT_DIR, `${projectId}_final.mp4`);
  fs.copyFileSync(voicedOutput, outputFile);

  if (!fs.existsSync(outputFile)) {
    return {
      assembled: false,
      reason: "final_file_missing"
    };
  }

  return {
    assembled: true,
    path: outputFile
  };
}

module.exports = {
  assembleFinalVideo
};
