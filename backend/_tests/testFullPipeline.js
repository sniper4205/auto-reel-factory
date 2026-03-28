const { generateVoices } = require("./engines/voiceEngine");
const { generateSubtitles } = require("./engines/subtitleEngine");
const { composeReel } = require("./engines/reelComposer");

async function main() {

  const script = `
  Sara are you ready for the drive?
  Yes Zara I am ready.
  Let's go before the traffic starts.
  `;

  const projectId = "full_test_001";

  const voices = generateVoices(script, projectId);

  const voiceFile = voices[0].audio;

  const subtitleFile = await generateSubtitles(voices, projectId);

  const timeline = [

    {
      image: "/Users/muhammadfahad/AutoReelFactory/assets/generated/ai-visuals/final_reel_test_001_001_wide_two_shot.png",
      duration: 4
    },

    {
      image: "/Users/muhammadfahad/AutoReelFactory/assets/generated/ai-visuals/final_reel_test_001_002_speaker_closeup.png",
      duration: 3
    },

    {
      image: "/Users/muhammadfahad/AutoReelFactory/assets/generated/ai-visuals/final_reel_test_001_003_listener_closeup.png",
      duration: 3
    }

  ];

  const video = composeReel(
    timeline,
    projectId,
    voiceFile,
    subtitleFile
  );

  console.log("Final video:", video);

}

main();
