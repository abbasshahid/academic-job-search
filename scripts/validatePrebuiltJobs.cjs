const fs = require('fs');
const path = require('path');

const dataPath = path.join(process.cwd(), 'public', 'prebuilt_jobs.json');

function fail(message) {
  console.error(`Validation failed: ${message}`);
  process.exit(1);
}

if (!fs.existsSync(dataPath)) {
  fail(`Missing ${dataPath}`);
}

const raw = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
const jobs = Array.isArray(raw) ? raw : raw.jobs;

if (!Array.isArray(jobs)) {
  fail('Expected an array of jobs or an object with a jobs array.');
}

jobs.forEach((job, index) => {
  if (!job || typeof job !== 'object') {
    fail(`Job at index ${index} is not an object.`);
  }
  if (typeof job.title !== 'string' || !job.title.trim()) {
    fail(`Job at index ${index} is missing a title.`);
  }
  if (typeof job.url !== 'string' || !job.url.trim()) {
    fail(`Job at index ${index} is missing a url.`);
  }
  if (typeof job.source !== 'string' && typeof job.sourceUrl !== 'string') {
    fail(`Job at index ${index} is missing a source/sourceUrl.`);
  }
});

console.log(`Validated ${jobs.length} jobs in ${dataPath}`);
