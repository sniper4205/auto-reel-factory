const { execSync } = require("child_process");

function generateImageWithRetry(prompt, output, seed, negative, steps, guidance) {

  const MAX_RETRY = 3;

  for (let i = 1; i <= MAX_RETRY; i++) {

    console.log(`Generating image attempt ${i}`);

    execSync(`
~/AutoReelFactory/ai-env/bin/python ~/AutoReelFactory/ai/generate_image.py \
"${prompt}" \
"${output}" \
${seed} \
"${negative}" \
${steps} \
${guidance}
`, { stdio: "inherit" });

    const result = execSync(`
~/AutoReelFactory/ai-env/bin/python ~/AutoReelFactory/ai/validate_image.py "${output}"
`).toString().trim();

    if (result === "OK") {
      console.log("Image accepted");
      return;
    }

    console.log("Image failed validation — retrying");
  }

  console.log("Max retries reached, using last image");
}

module.exports = { generateImageWithRetry };
