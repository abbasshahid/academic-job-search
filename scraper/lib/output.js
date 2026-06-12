import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sourceCatalog from '../../shared/sourceCatalog.json' with { type: 'json' };

// Resolve the repository root from this module's location instead of
// process.cwd(). The scheduled workflow runs `node server.js` from inside the
// `scraper/` directory, so a cwd-relative path used to write to
// `scraper/public/prebuilt_jobs.json` — a folder the deploy step never commits.
// Anchoring to the module path makes the output land in the real `public/`
// folder whether the scraper is launched from the repo root or from `scraper/`.
const moduleDir = path.dirname(fileURLToPath(import.meta.url)); // scraper/lib
const repoRoot = path.resolve(moduleDir, '..', '..');

export function writeOutput(jobs, generatedAt) {
  const outputPath = path.resolve(repoRoot, 'public', 'prebuilt_jobs.json');
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
