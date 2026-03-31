const crypto = require('crypto');
const runAutoReelApp = require('../runAutoReelApp');

class JobQueue {
  constructor() {
    this.jobs = new Map();
    this.queue = [];
    this.processing = 0;
    this.maxConcurrent = parseInt(process.env.JOB_MAX_CONCURRENT || '1', 10);
  }

  addJob(options) {
    const id = crypto.randomUUID();
    const job = {
      id,
      options,
      status: 'pending',
      preview: null,
      final: null,
      error: null,
    };
    this.jobs.set(id, job);
    this.queue.push(job);
    this.processNext();
    return id;
  }

  getJob(id) {
    return this.jobs.get(id) || null;
  }

  async processNext() {
    if (this.processing >= this.maxConcurrent || this.queue.length === 0) {
      return;
    }
    const job = this.queue.shift();
    if (!job) return;
    this.processing++;
    job.status = 'processing';
    try {
      const previewOpts = { ...job.options, quality: 'preview' };
      const previewRes = await runAutoReelApp(previewOpts);
      job.preview = previewRes.outputs;
      const finalOpts = { ...job.options, quality: 'final' };
      const finalRes = await runAutoReelApp(finalOpts);
      job.final = finalRes.outputs;
      job.status = 'done';
    } catch (err) {
      job.status = 'failed';
      job.error = err && err.message ? err.message : String(err);
    } finally {
      this.processing--;
      setImmediate(() => this.processNext());
    }
  }
}

module.exports = new JobQueue();
