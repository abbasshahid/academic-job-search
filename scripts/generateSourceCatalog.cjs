const fs = require('fs');
const path = require('path');

const payloadPath = path.join(process.cwd(), 'scraper', 'payload.json');
const outputPath = path.join(process.cwd(), 'shared', 'sourceCatalog.json');
const payload = JSON.parse(fs.readFileSync(payloadPath, 'utf8'));

const multiPartTlds = new Set(['ac.uk', 'edu.au', 'edu.cn', 'ac.at']);
const countryNames = {
  at: 'Austria',
  au: 'Australia',
  ae: 'United Arab Emirates',
  be: 'Belgium',
  ca: 'Canada',
  ch: 'Switzerland',
  cn: 'China',
  cz: 'Czech Republic',
  de: 'Germany',
  dk: 'Denmark',
  es: 'Spain',
  fi: 'Finland',
  fr: 'France',
  ie: 'Ireland',
  it: 'Italy',
  lu: 'Luxembourg',
  nl: 'Netherlands',
  no: 'Norway',
  qa: 'Qatar',
  sa: 'Saudi Arabia',
  se: 'Sweden',
  uk: 'United Kingdom',
  gb: 'United Kingdom',
  us: 'United States',
  com: 'Global',
  org: 'Global',
};

const countryByHostFragment = [
  ['oraclecloud.com', 'Denmark', 'dk'],
  ['personio.com', 'Austria', 'at'],
  ['jobs.ac.uk', 'United Kingdom', 'uk'],
  ['academictransfer.com', 'Netherlands', 'nl'],
  ['varbi.com', 'Sweden', 'se'],
  ['stellenticket.de', 'Germany', 'de'],
  ['jobbnorge.no', 'Norway', 'no'],
  ['euraxess.ec.europa.eu', 'Europe', 'eu'],
  ['networks.imdea.org', 'Spain', 'es'],
  ['uni.lu', 'Luxembourg', 'lu'],
  ['hbku.edu.qa', 'Qatar', 'qa'],
  ['qu.edu.qa', 'Qatar', 'qa'],
  ['ku.ac.ae', 'United Arab Emirates', 'ae'],
  ['uaeu.ac.ae', 'United Arab Emirates', 'ae'],
  ['mbzuai.ac.ae', 'United Arab Emirates', 'ae'],
  ['nyuad.nyu.edu', 'United Arab Emirates', 'ae'],
  ['kaust.edu.sa', 'Saudi Arabia', 'sa'],
];

function detectCountry(url) {
  const host = new URL(url).hostname.toLowerCase();
  for (const [fragment, name, code] of countryByHostFragment) {
    if (host.includes(fragment)) {
      return { countryName: name, countryCode: code };
    }
  }

  const parts = host.split('.');
  const tail = parts.slice(-2).join('.');
  const code = multiPartTlds.has(tail) ? parts[parts.length - 1] : parts[parts.length - 1];
  return { countryName: countryNames[code] || code.toUpperCase(), countryCode: code };
}

function detectPlatform(url) {
  const host = new URL(url).hostname.toLowerCase();
  if (host.includes('oraclecloud.com')) return 'Oracle Cloud Recruiting';
  if (host.includes('personio.com')) return 'Personio';
  if (host.includes('successfactors')) return 'SAP SuccessFactors';
  if (host.includes('stellenticket.de')) return 'Stellenticket';
  if (host.includes('varbi.com')) return 'Varbi';
  if (host.includes('jobs.ac.uk')) return 'jobs.ac.uk';
  if (host.includes('academicjobsonline.org')) return 'Academic Jobs Online';
  if (host.includes('jobrxiv.org')) return 'JobRxiv';
  if (host.includes('greenhouse.io')) return 'Greenhouse';
  if (host.includes('workday')) return 'Workday';
  return 'Direct careers page';
}

function toTitleCase(value) {
  return value
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .map((part) => (part ? part[0].toUpperCase() + part.slice(1) : part))
    .join(' ');
}

function detectInstitution(url) {
  const host = new URL(url).hostname.toLowerCase().replace(/^www\./, '');
  const preferred = host
    .split('.')
    .find((part) => !['com', 'org', 'net', 'edu', 'ac', 'co', 'go', 'jobs', 'career', 'careers', 'en', 'de'].includes(part));
  return toTitleCase(preferred || host.split('.')[0]);
}

function detectTags(url) {
  const lower = url.toLowerCase();
  const tags = [];
  if (/phd|praedoc|doctoral|doctorate/.test(lower)) tags.push('phd');
  if (/postdoc/.test(lower)) tags.push('postdoc');
  if (/prof|lecturer/.test(lower)) tags.push('faculty');
  if (/research/.test(lower)) tags.push('research');
  return tags;
}

const catalog = payload.careerPages.map((url) => {
  const country = detectCountry(url);
  return {
    url,
    institution: detectInstitution(url),
    platform: detectPlatform(url),
    tags: detectTags(url),
    ...country,
  };
});

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, JSON.stringify(catalog, null, 2) + '\n', 'utf8');
console.log(`Wrote ${catalog.length} entries to ${outputPath}`);
