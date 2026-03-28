const { execFileSync } = require("child_process");
const path = require("path");

function generateAIImage(
  prompt,
  outputPath,
  seed = 12345,
  negativePrompt = "",
  steps = 30,
  guidanceScale = 5
) {
  const pythonPath = path.join(
    process.env.HOME,
    "AutoReelFactory/ai-env/bin/python"
  );

  const scriptPath = path.join(
    process.env.HOME,
    "AutoReelFactory/ai/generate_image.py"
  );

  execFileSync(
    pythonPath,
    [
      scriptPath,
      prompt,
      outputPath,
      String(seed),
      negativePrompt,
      String(steps),
      String(guidanceScale)
    ],
    { stdio: "inherit" }
  );

  return outputPath;
}

module.exports = {
  generateAIImage
};
