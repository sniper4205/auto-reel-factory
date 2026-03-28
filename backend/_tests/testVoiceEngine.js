const { generateVoices } = require("./engines/voiceEngine");

const script = `
Sara are you ready for the drive?
Yes Zara I am ready.
Let's go before the traffic starts.
`;

const voices = generateVoices(script, "voice_test_project");

console.log(voices);
