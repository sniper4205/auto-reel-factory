const fs = require('fs');
const path = require('path');

const { getStyle } = require('./engines/styleEngine');
const { buildPrompt } = require('./engines/promptEngine');
const { loadCharacter, getReferenceImage } = require('./engines/characterEngine');
const contentEngine = require('./services/contentEngine');

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

async function runAutoReelApp(options = {}) {
  const mode = options.mode || 'image';
  const story = String(options.story || '').trim();
  const styleKey = options.style || null;
  const outputDir = options.outputDir || path.resolve(__dirname, '..', 'outputs');
  const characterNames = Array.isArray(options.characters) ? options.characters : [];
  const quality = options.quality === 'final' ? 'final' : 'preview';
  const voice = options.voice || 'en';
  const resolution = options.resolution || null;
  const mixMusic = options.mixMusic || false;

  let resWidth = null;
  let resHeight = null;
  if (resolution && typeof resolution === 'string' && resolution.includes('x')) {
    const parts = resolution.split('x');
    const w = parseInt(parts[0], 10);
    const h = parseInt(parts[1], 10);
    if (!isNaN(w) && !isNaN(h)) {
      resWidth = w;
      resHeight = h;
    }
  }

  ensureDir(outputDir);

  const style = getStyle(styleKey);

  const characters = characterNames.map((name) => loadCharacter(name));

  // Gather references for each character
  const references = {};
  characters.forEach((char) => {
    const ref = getReferenceImage(char.name);
    if (ref) references[char.name] = ref;
  });
  const primaryReference = characters.length > 0 ? references[characters[0].name] || null : null;

  const result = {
    mode,
    style: style.key,
    characters,
    outputs: {}
  };

  switch (mode) {
    case 'image': {
      const scene = {
        subject: story,
        action: '',
        environment: '',
        camera: '',
        lighting: '',
        mood: '',
      };
      const { prompt, negative } = buildPrompt(scene, style, characters);
      let seed = 0;
      if (characters.length > 0 && typeof characters[0].seed === 'number') {
        seed = characters[0].seed;
      } else {
        seed = Math.floor(Math.random() * 1e9);
      }
      const visualEngine = require('./engines/visualEngine');
      const images = await visualEngine.generateImage({
        prompt,
        negative,
        seed,
        style,
        quality,
        outputDir,
        reference: primaryReference,
        width: resWidth,
        height: resHeight,
        references,
      });
      result.outputs.prompt = { prompt, negative };
      result.outputs.image = images[0];
      return result;
    }
    case 'avatar': {
      const avatarEngine = require('./engines/avatarEngine');
      result.outputs.avatar = await avatarEngine.generateAvatar({
        story,
        style,
        characters,
        outputDir,
        quality,
        voice,
      });
      return result;
    }
    case 'video': {
      const visualEngine = require('./engines/visualEngine');
      const audioEngine = require('./engines/audioEngine');
      const subtitleEngine = require('./engines/subtitleEngine');
      const videoEngine = require('./engines/videoEngine');

      let segments = contentEngine.splitStory(story);
      const hook = contentEngine.generateHook(story);
      if (hook) {
        segments = [hook, ...segments];
      }
      const rewritten = contentEngine.rewriteScenes(segments);

      const scenes = [];
      for (const seg of rewritten) {
        const scene = {
          subject: seg,
          action: '',
          environment: '',
          camera: '',
          lighting: '',
          mood: '',
        };
        const { prompt: p, negative: n } = buildPrompt(scene, style, characters);
        let s = 0;
        if (characters.length > 0 && typeof characters[0].seed === 'number') {
          s = characters[0].seed + scenes.length;
        } else {
          s = Math.floor(Math.random() * 1e9);
        }
        scenes.push({
          prompt: p,
          negative: n,
          seed: s,
          reference: primaryReference,
          references,
        });
      }
      const imagePaths = await visualEngine.generateImages({
        scenes,
        style,
        quality,
        outputDir,
        width: resWidth,
        height: resHeight,
      });
      const audioPath = await audioEngine.generateAudio({
        text: story,
        voice,
        outputDir,
        mixMusic,
      });
      const subtitlesPath = await subtitleEngine.generateSubtitles({
        text: story,
        audioPath,
        outputDir,
      });
      const videoPath = await videoEngine.composeVideo({
        images: imagePaths,
        audioPath,
        subtitlesPath,
        outputDir,
        width: resWidth || 1080,
        height: resHeight || 1920,
      });
      result.outputs.video = videoPath;
      result.outputs.images = imagePaths;
      result.outputs.audio = audioPath;
      result.outputs.subtitles = subtitlesPath;
      return result;
    }
    default:
      throw new Error(`Unsupported mode: ${mode}`);
  }
}

module.exports = runAutoReelApp;
