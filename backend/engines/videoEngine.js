const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

function getAudioDuration(audioPath) {
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

async function composeVideo({ images, audioPath, subtitlesPath = null, outputDir, width = 1080, height = 1920 }) {
  if (!Array.isArray(images) || images.length === 0) {
    throw new Error('No images provided for video composition');
  }
  if (!audioPath) {
    throw new Error('Audio path must be provided for video composition');
  }
  const duration = await getAudioDuration(audioPath);
  const count = images.length;
  const perImageDuration = duration / count;
  const fps = 30;
  const framesPerImage = Math.max(Math.floor(perImageDuration * fps), 1);
  const outDir = outputDir || path.resolve(__dirname, '..', 'outputs');
  fs.mkdirSync(outDir, { recursive: true });
  const baseName = `video_${Date.now()}_${Math.floor(Math.random() * 1e6)}`;
  const outputPath = path.join(outDir, `${baseName}.mp4`);

  const ffArgs = [];
  images.forEach((img) => {
    ffArgs.push('-loop', '1', '-t', perImageDuration.toString(), '-i', img);
  });
  ffArgs.push('-i', audioPath);
  let filter = '';
  images.forEach((img, idx) => {
    const zoomInc = (Math.random() * 0.002 + 0.001).toFixed(4);
    const panX = (Math.random() * 0.1).toFixed(4);
    const panY = (Math.random() * 0.1).toFixed(4);
    const rotationDeg = (Math.random() * 2 - 1).toFixed(4);
    const rotationRad = `${rotationDeg}*PI/180`;
    const fadeDur = Math.min(0.5, perImageDuration / 4);
    filter += `[${idx}:v]setpts=PTS-STARTPTS,` +
      `scale=${width}:-1:force_original_aspect_ratio=decrease,pad=${width}:${height}:(${width}-iw)/2:(${height}-ih)/2,` +
      `rotate=${rotationRad}:bilinear=1,` +
      `zoompan=z='zoom+${zoomInc}':x='iw*${panX}':y='ih*${panY}':d=${framesPerImage}:s=${width}x${height},` +
      `fade=t=in:st=0:d=${fadeDur},fade=t=out:st=${perImageDuration - fadeDur}:d=${fadeDur}[v${idx}];`;
  });
  const concatInputs = images.map((_, idx) => `[v${idx}]`).join('');
  filter += `${concatInputs}concat=n=${count}:v=1:a=0[vv];`;
  if (subtitlesPath) {
    const escaped = subtitlesPath.replace(/\\/g, '/').replace(/:/g, '\\:');
    filter += `[vv]subtitles=${escaped}[vout]`;
  } else {
    filter += `[vv][vout]`;
  }
  ffArgs.push('-filter_complex', filter);
  const audioIndex = images.length;
  ffArgs.push('-map', subtitlesPath ? '[vout]' : '[vv]');
  ffArgs.push('-map', `${audioIndex}:a`);
  ffArgs.push('-r', fps.toString());
  ffArgs.push('-c:v', 'libx264');
  ffArgs.push('-preset', 'veryfast');
  ffArgs.push('-crf', '18');
  ffArgs.push('-c:a', 'aac');
  ffArgs.push('-b:a', '192k');
  ffArgs.push('-movflags', '+faststart');
  ffArgs.push('-pix_fmt', 'yuv420p');
  ffArgs.push('-shortest');
  ffArgs.push('-y');
  ffArgs.push(outputPath);

  return new Promise((resolve, reject) => {
    const proc = spawn('ffmpeg', ffArgs, { stdio: ['ignore', 'pipe', 'pipe'] });
    let stderr = '';
    proc.stderr.on('data', (data) => { stderr += data.toString(); });
    proc.on('error', (err) => reject(err));
    proc.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`ffmpeg exited with code ${code}: ${stderr.trim()}`));
      } else {
        resolve(outputPath);
      }
    });
  });
}

module.exports = {
  composeVideo,
};
