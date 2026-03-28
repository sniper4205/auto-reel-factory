const { generateVoices } = require("./engines/voiceEngine");
const { generateSubtitles } = require("./engines/subtitleEngine");

async function main() {

  const script = `
  Sara are you ready for the drive?
  Yes Zara I am ready.
  Let's go before the traffic starts.
  `;

  const voices = generateVoices(script, "subtitle_test_project");

  const srt = await generateSubtitles(voices, "subtitle_test_project");

  console.log("Subtitles created:", srt);

}

main();
