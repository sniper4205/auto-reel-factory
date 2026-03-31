const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const axios = require('axios');

async function runPythonGenerator(args) {
  return new Promise((resolve, reject) => {
    const script = args[0];
    const pythonBin = process.env.PYTHON_BINARY || 'python3';
    const proc = spawn(pythonBin, args, {
      cwd: path.dirname(script),
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let out = '';
    let err = '';
    proc.stdout.on('data', (data) => { out += data.toString(); });
    proc.stderr.on('data', (data) => { err += data.toString(); });
    proc.on('error', (e) => reject(e));
    proc.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Image generator exited with code ${code}: ${err.trim()}`));
      } else {
        const lines = out.trim().split(/\r?\n/).filter(Boolean);
        resolve(lines);
      }
    });
  });
}

async function generateImage({ prompt, negative = '', seed = 0, style, quality = 'preview', outputDir, reference = null, references = {}, width = null, height = null }) {
  const widthVal = width || (quality === 'final' ? 1024 : 640);
  const heightVal = height || (quality === 'final' ? 1820 : 1024);
  const steps = quality === 'final' ? 40 : 20;
  const guidance = quality === 'final' ? 7.5 : 5.0;
  const model = style && style.model ? style.model : 'sdxl';

  const outDir = outputDir || path.resolve(__dirname, '..', 'outputs');
  fs.mkdirSync(outDir, { recursive: true });
  const baseName = `img_${Date.now()}_${Math.floor(Math.random() * 1e6)}`;
  const outputPath = path.join(outDir, `${baseName}.png`);

  const serverUrl = process.env.IMAGE_SERVER_URL || null;
  if (serverUrl) {
    const payload = {
      prompt,
      negative_prompt: negative,
      seed,
      width: widthVal,
      height: heightVal,
      steps,
      guidance,
      model,
      output: outputPath,
      reference: reference,
    };
    try {
      const resp = await axios.post(`${serverUrl}/generate`, payload, { timeout: 3600_000 });
      return resp.data.paths || [outputPath];
    } catch (err) {
      throw new Error(`Image server error: ${err.message}`);
    }
  }

  const scriptPath = path.resolve(__dirname, '..', '..', 'ai', 'image', 'imageGenerator.py');
  const args = [
    scriptPath,
    '--prompt', prompt,
    '--negative', negative,
    '--seed', String(seed),
    '--width', String(widthVal),
    '--height', String(heightVal),
    '--steps', String(steps),
    '--guidance', String(guidance),
    '--model', model,
    '--output', outputPath,
  ];
  if (reference) {
    args.push('--reference', reference);
  }
  const result = await runPythonGenerator(args);
  return result;
}

async function generateImages({ scenes, style, quality = 'preview', outputDir, width = null, height = null }) {
  const results = [];
  await Promise.all(
    scenes.map(async (scene, idx) => {
      const res = await generateImage({
        prompt: scene.prompt,
        negative: scene.negative,
        seed: scene.seed,
        style,
        quality,
        outputDir,
        reference: scene.reference || null,
        references: scene.references || {},
        width,
        height,
      });
      results[idx] = res[0];
    })
  );
  return results;
}

module.exports = {
  generateImage,
  generateImages,
};
