const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const { injectCharactersIntoPrompt } = require("./engines/characterEngine");
const { buildCinematicPrompt } = require("./engines/cinematicPromptEngine");

function ensureDir(filePath) {
  const dir = path.dirname(filePath);
  fs.mkdirSync(dir, { recursive: true });
}

function generateImage(
  prompt,
  outputPath,
  seed = 12345,
  negativePrompt = "",
  steps = 20,
  guidanceScale = 7,
  characters = []
) {

  ensureDir(outputPath);

  const cinematicPrompt = buildCinematicPrompt(prompt, characters);

  const finalPrompt = injectCharactersIntoPrompt(
    cinematicPrompt,
    characters
  );

  const strongNegativePrompt = `
blurry,
low quality,
bad anatomy,
extra fingers,
extra arms,
extra legs,
duplicate people,
deformed face,
text,
logo,
watermark,
brand symbol,
ugly lighting,
bad composition
`;

  const pythonScript = path.join(
    process.env.HOME,
    "AutoReelFactory",
    "ai",
    "generate_image.py"
  );

  const pythonBin = path.join(
    process.env.HOME,
    "AutoReelFactory",
    "ai-env",
    "bin",
    "python"
  );

  let success = false;

  for (let attempt = 1; attempt <= 3; attempt++) {

    console.log(`🖼 Image attempt ${attempt}`);

    try {

      execFileSync(
        pythonBin,
        [
          pythonScript,
          finalPrompt,
          outputPath,
          String(seed),
          strongNegativePrompt,
          String(steps),
          String(guidanceScale)
        ],
        { stdio: "inherit" }
      );

      if (fs.existsSync(outputPath)) {
        console.log("✅ Image generated");
        success = true;
        break;
      }

    } catch (err) {
      console.log("⚠️ Image generation failed, retrying...");
    }
  }

  if (!success) {
    throw new Error(`Image generation failed after retries: ${outputPath}`);
  }

  return outputPath;
}

module.exports = {
  generateImage
};
