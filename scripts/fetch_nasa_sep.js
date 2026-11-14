/**
 * LUNA: Mission Survival - NASA DONKI SEP Dataset Retrieval Script
 *
 * Connects to the official NASA DONKI Solar Energetic Particle (SEP) API:
 * Endpoint: https://api.nasa.gov/DONKI/SEP
 *
 * Retrieves verified NASA SEP records, validates structure, and stores
 * the dataset locally at src/data/nasa_sep_events.json with full metadata.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const outputPath = path.join(projectRoot, 'src', 'data', 'nasa_sep_events.json');

// API Key configuration: use NASA_API_KEY environment variable if present, fallback to DEMO_KEY
const apiKey = process.env.NASA_API_KEY || 'DEMO_KEY';

// Candidate date ranges with known high Solar Cycle 25 activity
const candidateRanges = [
  { startDate: '2024-05-01', endDate: '2024-05-31', label: 'Historic Solar Superstorm of May 2024' },
  { startDate: '2024-01-01', endDate: '2024-12-31', label: 'Full Year 2024 Solar Cycle 25 Window' },
  { startDate: '2023-01-01', endDate: '2023-12-31', label: 'Year 2023 Active Window' },
  { startDate: '2022-01-01', endDate: '2022-12-31', label: 'Year 2022 Solar Activity Window' }
];

async function fetchFromNasa(startDate, endDate) {
  const url = `https://api.nasa.gov/DONKI/SEP?startDate=${startDate}&endDate=${endDate}&api_key=${encodeURIComponent(apiKey)}`;
  console.log(`\n🛰️ Querying NASA DONKI SEP API...`);
  console.log(`   URL: https://api.nasa.gov/DONKI/SEP?startDate=${startDate}&endDate=${endDate}&api_key=${apiKey === 'DEMO_KEY' ? 'DEMO_KEY' : '***'}`);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000); // 12-second timeout

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'LUNA-Mission-Survival-Educational/1.0'
      }
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      console.warn(`   ⚠️ NASA API HTTP Error: ${res.status} ${res.statusText}`);
      const text = await res.text().catch(() => '');
      if (text) console.warn(`   Server response: ${text.slice(0, 200)}`);
      return null;
    }

    const data = await res.json();
    return data;
  } catch (err) {
    clearTimeout(timeoutId);
    console.warn(`   ⚠️ Network error contacting NASA API: ${err.message}`);
    return null;
  }
}

function validateSepRecords(records) {
  if (!Array.isArray(records)) {
    console.warn('   ⚠️ Response is not a JSON Array.');
    return false;
  }

  if (records.length === 0) {
    console.log('   ℹ️ Returned 0 records for this date range.');
    return false;
  }

  // Verify at least one record has required NASA DONKI keys
  const valid = records.some(r => r && (r.sepID || r.activityID) && r.eventTime);
  if (!valid) {
    console.warn('   ⚠️ Records lack expected NASA DONKI SEP fields (sepID/eventTime).');
    return false;
  }

  return true;
}

async function run() {
  console.log('===========================================================');
  console.log('  LUNA: NASA DONKI Solar Energetic Particle (SEP) Fetcher  ');
  console.log('===========================================================');
  console.log(`API Key in use: ${apiKey === 'DEMO_KEY' ? 'DEMO_KEY (Public Rate-Limited)' : 'Custom NASA_API_KEY'}`);

  let retrievedRecords = null;
  let successfulRange = null;

  for (const range of candidateRanges) {
    console.log(`\nAttempting candidate range: ${range.startDate} to ${range.endDate} (${range.label})`);
    const data = await fetchFromNasa(range.startDate, range.endDate);

    if (data && validateSepRecords(data)) {
      console.log(`✅ Success! Received ${data.length} genuine NASA SEP records.`);
      retrievedRecords = data;
      successfulRange = range;
      break;
    } else {
      console.log('   Trying next candidate range...');
    }
  }

  if (!retrievedRecords || retrievedRecords.length === 0) {
    console.error('\n❌ Could not retrieve records from NASA DONKI. Check network connection or API key limits.');
    process.exit(1);
  }

  // Build the complete dataset payload with official metadata
  const dataset = {
    metadata: {
      sourceName: "NASA Space Weather Database Of Notifications, Knowledge, Information (DONKI)",
      officialPortal: "https://ccmc.gsfc.nasa.gov/DONKI/",
      apiEndpoint: "https://api.nasa.gov/DONKI/SEP",
      retrievalDate: new Date().toISOString(),
      requestedDateRange: {
        startDate: successfulRange.startDate,
        endDate: successfulRange.endDate,
        description: successfulRange.label
      },
      recordCount: retrievedRecords.length,
      scientificDisclaimer: "NASA DONKI SEP records describe real solar energetic particle events observed by scientific spacecraft (e.g. GOES, SOHO). They do not supply radiation dose values for fictional lunar astronauts; all game astronaut health impacts and shielding calculations in LUNA are simulated gameplay."
    },
    // Preserve authentic NASA records intact
    events: retrievedRecords
  };

  // Ensure target directory exists
  const targetDir = path.dirname(outputPath);
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  // Write formatted JSON file
  fs.writeFileSync(outputPath, JSON.stringify(dataset, null, 2), 'utf8');

  console.log(`\n📁 Dataset successfully saved to:`);
  console.log(`   ${outputPath}`);
  console.log(`   Records count: ${retrievedRecords.length}`);
  console.log(`   Primary event in dataset: ${retrievedRecords[0].sepID} (${retrievedRecords[0].eventTime})`);
  console.log('\nNASA dataset integration fetch completed successfully! 🚀\n');
}

run();
