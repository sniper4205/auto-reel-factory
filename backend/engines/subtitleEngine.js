const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

function formatTimestamp(seconds) {
  const hrs = String(Math.floor(seconds / 3600)).padStart(2, '0');
  const mins = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0');
  const secs = String(Math.floor(seconds % 60)).padStart(2, '0');
  const ms = String(Math.floor((seconds - Math.floor(seconds)) * 1000)).padStart(3, '0');
  return `${hrs}:${mins}:${secs},${ms}`;
}

function splitScript(text) {
  return text.replace(/\r?\n/g, ' ').split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter(Boolean);
}

async function getAudioDuration(audioPath) {
  return new Promise((resolve, reject) => {
    const proc = spawn('ffprobe', [
      '-v',
      'error',
      '-show_entries',
      'format=duration',
      '-of',
      'default=noprint_wrappers=1:nokey=1',
      audioPath,
    ], { stdio: ['ignore', 'pipe', 'pipe'] });
    let out = '';
    let err = '';
    proc.stdout.on('data', (data) => { out += data.toString(); });
    proc.stderr.on('data', (data) => { err += data.toString(); });
    proc.on('error', (e) => reject(e));
    proc.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`ffprobe exited with code ${code}: ${err.trim()}`));
      } else {
        const dur = parseFloat(out);
        if (Number.isNaN(dur) || dur <= 0) {
          reject(new Error('Unable to determine audio duration'));
        } else {
          resolve(dur);
        }
      }
    });
  });
}

async function generateSubtitles({ text, audioPath, outputDir }) {
  const outDir = outputDir || path.resolve(__dirname, '..', 'outputs');
  fs.mkdirSync(outDir, { recursive: true });
  const segments = splitScript(text);
  const duration = await getAudioDuration(audioPath);
  const perSegment = duration / segments.length;
  const srtLines = [];
  let current = 0.0;
  let index = 1;
  for (const seg of segments) {
    const start = current;
    const end = current + perSegment;
    current = end;
    const words = seg.split(/\s+/);
    if (words.length > 0) {
      words[0] = `<b>${words[0]}</b>`;
    }
    const line = words.join(' ');
    srtLines.push(String(index));
    srtLines.push(`${formatTimestamp(start)} --> ${formatTimestamp(end)}`);
    srtLines.push(line);
    srtLines.push('');
    index++;
  }
  const fileName = `subtitles_${Date.now()}_${Math.floor(Math.random() * 1e6)}.srt`;
  const filePath = path.join(outDir, fileName);
  fs.writeFileSync(filePath, srtLines.join('\n'), 'utf8');
  return filePath;
}

module.exports = {
  generateSubtitles,
};
