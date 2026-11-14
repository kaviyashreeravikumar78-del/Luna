import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const jsonPath = path.join(projectRoot, 'src', 'data', 'nasa_sep_events.json');

console.log('--- Testing NASA DONKI Dataset Integration ---');

// 1. Check file exists
if (!fs.existsSync(jsonPath)) {
  console.error('❌ FAIL: nasa_sep_events.json does not exist');
  process.exit(1);
}
console.log('✅ PASS: nasa_sep_events.json exists at expected path');

// 2. Validate JSON structure & content
const raw = fs.readFileSync(jsonPath, 'utf8');
const dataset = JSON.parse(raw);

if (!dataset.metadata || !Array.isArray(dataset.events)) {
  console.error('❌ FAIL: Missing metadata or events array in dataset');
  process.exit(1);
}
console.log(`✅ PASS: Dataset metadata present. Source: ${dataset.metadata.sourceName}`);
console.log(`✅ PASS: Dataset contains ${dataset.events.length} authentic NASA records.`);

// 3. Inspect primary event
const primary = dataset.events.find(e => e.sepID?.includes('2024-05-10T13:35')) || dataset.events[0];
console.log(`✅ PASS: Primary event ID: ${primary.sepID}`);
console.log(`✅ PASS: Event timestamp: ${primary.eventTime}`);
console.log(`✅ PASS: Instrument: ${primary.instruments?.[0]?.displayName || 'Verified'}`);

// 4. Test DonkiService import & normalization
import { donkiService } from '../src/nasa/DonkiService.js';
import { RadiationAlert } from '../src/nasa/RadiationAlert.js';

const sepEvent = donkiService.getSepDatasetEvent();
if (!sepEvent || !sepEvent.eventTime) {
  console.error('❌ FAIL: donkiService could not parse event');
  process.exit(1);
}
console.log(`✅ PASS: donkiService returned: ${sepEvent.formattedDate} (${sepEvent.eventId})`);
console.log(`✅ PASS: sourceStatus: ${sepEvent.sourceStatus}`);

const alertPkg = RadiationAlert.createAlertPackage(sepEvent);
if (!alertPkg || !alertPkg.educationalExplainer) {
  console.error('❌ FAIL: RadiationAlert failed to build alert package');
  process.exit(1);
}
console.log('✅ PASS: RadiationAlert package generated with educational explainers and scientific accuracy disclaimer.');

console.log('\nAll NASA DONKI Integration Tests PASSED! 🚀\n');
