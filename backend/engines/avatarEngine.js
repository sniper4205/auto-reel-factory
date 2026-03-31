/*
 * Avatar engine
 *
 * Creates a talking avatar video by generating a portrait of the selected
 * character, synthesising speech from the provided script, and then
 * animating lip movements using an offline lip sync engine (Wav2Lip).
 * This engine orchestrates the necessary steps and returns the path
 * to the generated MP4 file.
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const audioEngine = require('./audioEngine');
const visualEngine = require('./visualEngine');
const { buildPrompt } = require('./promptEngine');

/**
 * Generate a talking avatar video for a given script.
 *
 * @param {Object} options
 * @param {string} options.story Narration text used to synthesise voice
 * @param {Object} options.style Style definition (used for portrait generation)
 * @param {Object[]} options.characters Array of character definitions
 * @param {string} [options.outputDir] Directory where outputs should be saved
 * @returns {Promise<string>} Resolves to the absolute path of the generated video
 */
async function generateAvatar({ story, style, characters, outputDir, quality = 'final', voice = 'en' }) {
  if (!story || typeof story !== 'string') {
    throw new Error('Story text must be provided for avatar generation');
  }
  const outDir = outputDir || path.resolve(__dirname, '..', 'outputs');
  fs.mkdirSync(outDir, { recursive: true });
  const character = (characters && characters.length > 0)
    ? characters[0]
    : { name: 'Narrator', look: 'neutral', seed: Math.floor(Math.random() * 1e9) };
  const scene = {
    subject: character.name,
    action: '',
    environment: '',
    camera: 'close‑up portrait, head and shoulders',
    lighting: '',
    mood: '',
  };
  const { prompt, negative } = buildPrompt(scene, style, [character]);
  const seed = typeof character.seed === 'number' ? character.seed : Math.floor(Math.random() * 1e9);
  const { getReferenceImage } = require('./characterEngine');
  const refPath = getReferenceImage(character.name);
  const [imagePath] = await visualEngine.generateImage({
    prompt,
    negative,
    seed,
    style,
    quality,
    outputDir: outDir,
    reference: refPath,
    width: null,
    height: null,
    references: {},
  });
  const audioPath = await audioEngine.generateAudio({ text: story, voice, outputDir: outDir });
  const scriptPath = path.resolve(__dirname, '..', '..', 'ai', 'avatar', 'avatarGenerator.py');
  const outputFileName = `avatar_${Date.now()}_${Math.floor(Math.random() * 1e6)}.mp4`;
  const videoPath = path.join(outDir, outputFileName);
  const args = [
    scriptPath,
    '--image',
    imagePath,
    '--audio',
    audioPath,
    '--output',
    videoPath,
  ];
  const pythonBin = process.env.PYTHON_BINARY || 'python3';
  await new Promise((resolve, reject) => {
    const proc = spawn(pythonBin, args, {
      cwd: path.dirname(scriptPath),
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let stderr = '';
    proc.stdout.on('data', () => {});
    proc.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    proc.on('error', (err) => reject(err));
    proc.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Avatar generator exited with code ${code}: ${stderr.trim()}`));
      } else {
        resolve();
      }
    });
  });
  return videoPath;
}

module.exports = {
  generateAvatar,
};
