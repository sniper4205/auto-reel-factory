const path = require("path");
const { spawn } = require("child_process");

function runPython(prompt, outputPath) {
  return new Promise((resolve, reject) => {
    const pythonPath =
      process.env.PYTHON_PATH ||
      path.join(process.cwd(), "ai-env", "bin", "python");

    const py = spawn(
      pythonPath,
      ["ai/generate_image.py", prompt, outputPath, "999"],
      { cwd: process.cwd() }
    );

    py.stdout.on("data", (data) => process.stdout.write(data.toString()));
    py.stderr.on("data", (data) => process.stderr.write(data.toString()));

    py.on("close", (code) => {
      if (code === 0) resolve(outputPath);
      else reject(new Error("Character generation failed"));
    });
  });
}

async function generateCharacter(styleProfile) {
  console.log("🧬 Generating master character...");

  const outputPath = path.join(process.cwd(), "outputs", "character_manifest.png");

  const prompt = [
    "ultra realistic passport photo",
    "middle eastern man",
    "mid 30s",
    "short black hair",
    "trimmed beard",
    "front facing",
    "looking directly at camera",
    "neutral expression",
    "plain background",
    "even lighting",
    "sharp focus",
    "high detail face"
  ].join(", ");

  await runPython(prompt, outputPath);

  console.log("✅ Character generated:", outputPath);

  return outputPath;
}

module.exports = { generateCharacter };
