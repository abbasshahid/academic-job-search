import { careerPages, keywords } from './lib/config.js';
import { writeOutput } from './lib/output.js';
import { scrapeAll } from './lib/scrape.js';

const generatedAt = new Date().toISOString();

async function main() {
  console.log(`Starting scheduled scrape for ${careerPages.length} source pages`);
  const jobs = await scrapeAll(careerPages, keywords, generatedAt);
  const outputPath = writeOutput(jobs, generatedAt);
  console.log(`Wrote ${jobs.length} jobs to ${outputPath}`);
}

main().catch((error) => {
  console.error('Scrape failed:', error);
  process.exit(1);
});
