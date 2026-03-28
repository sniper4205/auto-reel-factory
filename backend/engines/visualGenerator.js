const path = require("path");
const { spawn } = require("child_process");

function runPython(prompt, outputPath, seed = "123") {
  return new Promise((resolve, reject) => {
    const pythonPath =
      process.env.PYTHON_PATH ||
      path.join(process.cwd(), "ai-env", "bin", "python");

    const py = spawn(
      pythonPath,
      ["ai/generate_image.py", prompt, outputPath, seed],
      { cwd: process.cwd() }
    );

    py.stdout.on("data", (data) => process.stdout.write(data.toString()));
    py.stderr.on("data", (data) => process.stderr.write(data.toString()));

    py.on("close", (code) => {
      if (code === 0) resolve(outputPath);
      else reject(new Error("Image generation failed"));
    });
  });
}

// 🔥 SINGLE IMAGE GENERATOR
async function generateVisual(scene, index) {
  const outputPath = path.join(
    process.cwd(),
    "outputs",
    `scene_${index}.png`
  );

  const prompt = [
    "photorealistic",
    "portrait photo",
    "middle eastern man",
    "mid 30s",
    "short black hair",
    "trimmed beard",

    // 🚨 FACE SAFE RULES
    "close-up portrait",
    "face fills 70% of frame",
    "centered face",
    "looking directly at camera",
    "sharp focus on face",
    "clear facial features",
    "one person only",
    "no background characters",

    // 🎬 LIGHT STORY
    scene.action,
    scene.environment
  ].join(", ");

  console.log(`🎯 Scene ${index} Prompt:`, prompt);

  await runPython(prompt, outputPath, index);

  return outputPath;
}

// 🔥 THIS IS WHAT YOUR PIPELINE NEEDS
async function generateVisuals(scenes) {
  const results = [];

  for (let i = 0; i < scenes.length; i++) {
    const imagePath = await generateVisual(scenes[i], i + 1);
    results.push(imagePath);
  }

  return results;
}

module.exports = { generateVisuals };
