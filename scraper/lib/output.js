import fs from 'fs';
import path from 'path';
import sourceCatalog from '../../shared/sourceCatalog.json' with { type: 'json' };

export function writeOutput(jobs, generatedAt) {
  const outputPath = path.resolve(process.cwd(), 'public', 'prebuilt_jobs.json');
  const payload = {
    generatedAt,
    jobs,
    sources: sourceCatalog,
    stats: {
      generatedAt,
      jobCount: jobs.length,
      sourceCount: sourceCatalog.length,
    },
  };

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(payload, null, 2), 'utf8');
  return outputPath;
}
