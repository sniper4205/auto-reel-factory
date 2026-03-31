/*
 * API server for the AI content studio
 *
 * Provides REST endpoints for creating generation jobs, querying their
 * status, and retrieving results. Serves the front-end application
 * from the `frontend` directory. The image server is expected to be
 * started manually and available at http://127.0.0.1:7861.
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const jobQueue = require('./queue/jobQueue');
const { setReferenceImage, loadCharacter } = require('./engines/characterEngine');

function createServer(port = 5050) {
  const app = express();

  // Use the manually started image server
  process.env.IMAGE_SERVER_URL = 'http://127.0.0.1:7861';

  app.use(cors());
  app.use(express.json({ limit: '10mb' }));

  const frontendPath = path.resolve(__dirname, '..', 'frontend');
  if (fs.existsSync(frontendPath)) {
    app.use(express.static(frontendPath));
  }

  // Job generate endpoint
  app.post('/generate', (req, res) => {
    try {
      const {
        mode,
        script,
        style,
        character,
        characters,
        quality,
        voice,
        resolution,
        mixMusic,
      } = req.body || {};

      if (!mode || !script) {
        return res.status(400).json({ error: 'mode and script are required' });
      }

      const jobOptions = {
        mode,
        story: script,
        style,
        characters: characters || (character ? [character] : []),
        quality,
        voice,
        resolution,
        mixMusic,
      };

      const jobId = jobQueue.addJob(jobOptions);
      return res.json({ jobId });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  });

  // Character upload
  app.post('/uploadCharacter', (req, res) => {
    try {
      const { name, image } = req.body || {};

      if (!name || !image) {
        return res.status(400).json({ error: 'name and image are required' });
      }

      let base64Data = image;
      const dataUrlMatch = /^data:image\/[^;]+;base64,(.*)$/i.exec(image);
      if (dataUrlMatch) {
        base64Data = dataUrlMatch[1];
      }

      const buffer = Buffer.from(base64Data, 'base64');
      const safeName = String(name).trim().toLowerCase().replace(/\s+/g, '_');
      const charDir = path.resolve(__dirname, 'characters');

      fs.mkdirSync(charDir, { recursive: true });

      const fileName = `${safeName}_ref.png`;
      const filePath = path.join(charDir, fileName);

      fs.writeFileSync(filePath, buffer);
      setReferenceImage(name, filePath);
      loadCharacter(name);

      return res.json({ status: 'ok', path: filePath });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  });

  // Status endpoint
  app.get('/status/:id', (req, res) => {
    const id = req.params.id;
    const job = jobQueue.getJob(id);

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    let previewPath = null;
    if (job.preview) {
      if (job.preview.image) previewPath = job.preview.image;
      else if (job.preview.video) previewPath = job.preview.video;
      else if (job.preview.avatar) previewPath = job.preview.avatar;
    }

    return res.json({
      status: job.status,
      preview: previewPath,
      error: job.error,
    });
  });

  // Result endpoint
  app.get('/result/:id', (req, res) => {
    const id = req.params.id;
    const job = jobQueue.getJob(id);

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    if (job.status !== 'done') {
      return res.status(202).json({
        status: job.status,
        error: job.error,
      });
    }

    let resultPath = null;
    if (job.final) {
      if (job.final.image) resultPath = job.final.image;
      else if (job.final.video) resultPath = job.final.video;
      else if (job.final.avatar) resultPath = job.final.avatar;
    }

    if (!resultPath) {
      return res.status(500).json({ error: 'Result path not available' });
    }

    const absolutePath = path.resolve(resultPath);
    if (!fs.existsSync(absolutePath)) {
      return res.status(404).json({ error: 'Result file not found' });
    }

    return res.sendFile(absolutePath);
  });

  // Serve index for SPA
  app.get('*', (req, res) => {
    const indexPath = path.join(frontendPath, 'index.html');
    if (fs.existsSync(indexPath)) {
      return res.sendFile(indexPath);
    }
    return res.status(404).send('Not found');
  });

  const server = app.listen(port, () => {
    console.log(`API server listening on http://localhost:${port}`);
    console.log(`Using image server at ${process.env.IMAGE_SERVER_URL}`);
  });

  return server;
}

module.exports = createServer;
