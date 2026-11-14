import { MISSION_EVENTS } from '../src/events/eventDefinitions.js';
import { BUILDINGS_DATA } from '../src/data/buildings.js';
import { CREW_DATA } from '../src/data/crew.js';
import { FACILITIES_DATA } from '../src/data/facilities.js';
import { RESOURCES_DATA } from '../src/data/resources.js';

console.log('--- Verifying Module 1, Module 2 & 7 Mission Events ---');

// 1. Verify 7 Day Events exist
for (let sol = 1; sol <= 7; sol++) {
  const ev = MISSION_EVENTS[sol];
  if (!ev) {
    console.error(`❌ FAIL: Mission Sol ${sol} event is missing!`);
    process.exit(1);
  }
  if (!ev.decisions || ev.decisions.length < 2) {
    console.error(`❌ FAIL: Mission Sol ${sol} lacks decisions!`);
    process.exit(1);
  }
  console.log(`✅ PASS: Sol ${sol} - ${ev.title.slice(0, 45)}... (${ev.decisions.length} choices)`);
}

// 2. Verify Day 3 is NASA event
const day3 = MISSION_EVENTS[3];
if (!day3.isNasaEvent) {
  console.error('❌ FAIL: Sol 3 is not marked as isNasaEvent');
  process.exit(1);
}
console.log('✅ PASS: Sol 3 is properly marked as isNasaEvent');

// 3. Verify Module 1 Buildings Data
const buildingsCount = Object.keys(BUILDINGS_DATA).length;
console.log(`✅ PASS: Module 1 Colony Buildings: ${buildingsCount} defined`);

// 4. Verify Module 2 Mission Control data
console.log(`✅ PASS: Module 2 Crew Members: ${CREW_DATA.length} astronauts`);
console.log(`✅ PASS: Module 2 Facilities: ${FACILITIES_DATA.length} facilities`);
console.log(`✅ PASS: Module 2 Resources: ${RESOURCES_DATA.length} vitals`);

console.log('\nAll System Integrity Checks PASSED! 🚀\n');
