const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

function runPython(args) {
  return new Promise((resolve, reject) => {
    const [script, ...rest] = args;
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
        reject(new Error(`Python script exited with code ${code}: ${err.trim()}`));
      } else {
        const lines = out.trim().split(/\r?\n/).filter(Boolean);
        resolve(lines);
      }
    });
  });
}

async function generateAudio({ text, voice = 'en', outputDir, mixMusic = false }) {
  const outDir = outputDir || path.resolve(__dirname, '..', 'outputs');
  fs.mkdirSync(outDir, { recursive: true });
  const fileName = `voice_${Date.now()}_${Math.floor(Math.random() * 1e6)}.wav`;
  const filePath = path.join(outDir, fileName);

  const scriptPath = path.resolve(__dirname, '..', '..', 'ai', 'tts', 'generate.py');
  const args = [
    scriptPath,
    '--text',
    text,
    '--voice',
    voice,
    '--output',
    filePath,
  ];
  await runPython(args);

  if (mixMusic) {
    const musicPath = process.env.DEFAULT_MUSIC_PATH || path.resolve(__dirname, '..', '..', 'config', 'background_music.mp3');
    if (fs.existsSync(musicPath)) {
      const mixedFile = path.join(outDir, `voice_music_${Date.now()}_${Math.floor(Math.random() * 1e6)}.wav`);
      await new Promise((resolve, reject) => {
        const ffArgs = [
          '-i', filePath,
          '-i', musicPath,
          '-filter_complex', ' [0:a]volume=1.0[a0]; [1:a]volume=0.3[a1]; [a0][a1]amix=inputs=2:duration=first:dropout_transition=3 ',
          '-y',
          mixedFile,
        ];
        const proc = spawn('ffmpeg', ffArgs, {
          stdio: ['ignore', 'ignore', 'pipe'],
        });
        let err = '';
        proc.stderr.on('data', (data) => { err += data.toString(); });
        proc.on('error', (e) => reject(e));
        proc.on('close', (code) => {
          if (code !== 0) {
            reject(new Error(`ffmpeg exited with code ${code}: ${err.trim()}`));
          } else {
            fs.unlinkSync(filePath);
            fs.renameSync(mixedFile, filePath);
            resolve();
          }
        });
      });
    }
  }

  return filePath;
}

module.exports = {
  generateAudio,
};
