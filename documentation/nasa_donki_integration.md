# 🛰️ LUNA: NASA DONKI Dataset Integration & Space Weather Documentation

## 1. Overview
Outpost LUNA-01 integrates an authentic astronomical space weather dataset from the **NASA Space Weather Database Of Notifications, Knowledge, Information (DONKI)** into **Day 3 (Sol 3: Solar Radiation Storm)**.

This integration provides young players with genuine NASA space-weather records, introducing real astronomical phenomena while keeping the experience child-friendly and gameplay consequences clearly identified as simulated.

---

## 2. NASA Dataset Details
* **Dataset Used:** NASA DONKI Solar Energetic Particle (SEP) Records.
* **Official API Endpoint:** `https://api.nasa.gov/DONKI/SEP`
* **Official Web Portal:** [NASA CCMC DONKI](https://ccmc.gsfc.nasa.gov/DONKI/)
* **Date Range Requested:** May 1, 2024 to May 31, 2024 (Solar Superstorm of May 2024 during Solar Cycle 25 maximum).
* **Records Retrieved:** 14 genuine NASA DONKI SEP event records.
* **Primary Event in Day 3:** `2024-05-10T13:35:00-SEP-001` (May 10, 2024, 13:35 UTC).
* **Detecting Spacecraft & Instrument:** `GOES-P: SEISS >10 MeV Proton Sensor`.
* **Linked Solar Activity:** Major X-class solar flare `2024-05-08T04:20:00-FLR-001` and fast Coronal Mass Ejection (CME) `2024-05-08T05:36:00-CME-001`.

---

## 3. Retrieval Process & Script
The dataset was retrieved using a dedicated Node.js automation script:
* **Script Location:** [scripts/fetch_nasa_sep.js](file:///c:/Users/KAVIYA%20SRI%20R/Desktop/Luna/scripts/fetch_nasa_sep.js)
* **Execution:**
  ```bash
  node scripts/fetch_nasa_sep.js
  ```
* **Process:**
  1. Reads `NASA_API_KEY` from the system environment or falls back to public rate-limited `DEMO_KEY`.
  2. Queries `https://api.nasa.gov/DONKI/SEP` with configured date bounds.
  3. Validates the JSON array structure and ensures required NASA fields (`sepID`, `eventTime`, `instruments`) are present.
  4. Formats dataset with official provenance metadata and saves to disk.

---

## 4. Local Storage Location & Offline Support
* **Dataset File:** [src/data/nasa_sep_events.json](file:///c:/Users/KAVIYA%20SRI%20R/Desktop/Luna/src/data/nasa_sep_events.json)
* **Offline Guarantee:** The application loads `src/data/nasa_sep_events.json` statically at build time / runtime. **No live internet access or NASA API requests are required during gameplay**, ensuring 100% offline reliability in classrooms, mobile devices, and sandbox environments.
* **Fallback Guarantee:** If the local dataset is ever removed or damaged, [src/nasa/DonkiService.js](file:///c:/Users/KAVIYA%20SRI%20R/Desktop/Luna/src/nasa/DonkiService.js) immediately falls back to a verified demonstration record clearly labelled `● DEMONSTRATION SCENARIO`, never fabricating data or breaking the rest of the game.

---

## 5. How Day 3 Uses the Data
When the player starts Day 3 (Sol 3):
1. [src/simulation/GameState.js](file:///c:/Users/KAVIYA%20SRI%20R/Desktop/Luna/src/simulation/GameState.js) calls `getNASASepAlert()`.
2. [src/nasa/DonkiService.js](file:///c:/Users/KAVIYA%20SRI%20R/Desktop/Luna/src/nasa/DonkiService.js) reads the May 10, 2024 record from `nasa_sep_events.json`.
3. [src/ui/NASAAlertPanel.js](file:///c:/Users/KAVIYA%20SRI%20R/Desktop/Luna/src/ui/NASAAlertPanel.js) renders a compact, attractive panel showing:
   * **Solar Event Date:** May 10, 2024 (13:35 UTC)
   * **Event Type:** Solar Energetic Particle (SEP)
   * **Source:** NASA DONKI (api.nasa.gov)
   * **Detecting Instrument:** GOES-P: SEISS Proton Detector
   * **Child-Friendly Explanation:** *"The Sun had a huge eruption, shooting high-speed proton particles toward the Moon! Because the Moon has no air or magnetic shield, we must shelter inside the base bunker!"*
   * **Scientific Accuracy Notice:** Clearly informs players that the solar event is real, but astronaut health effects are simulated.
4. In the 3D Moon colony ([src/gameplay/Adventure3DEngine.js](file:///c:/Users/KAVIYA%20SRI%20R/Desktop/Luna/src/gameplay/Adventure3DEngine.js)), ORBIT robot announces the incoming May 10, 2024 particle storm. Commander Vance physically rounds up the 3 astronauts on EVA into a single-file line and leads them into the Habitat storm shelter, lowering the titanium blast door and expanding the golden radiation shield dome.

---

## 6. Scientific Accuracy & Simulated Consequence Boundaries

| Concept | Authenticity | Description |
| :--- | :--- | :--- |
| **Solar Energetic Particle (SEP) Occurrence** | **Real NASA Data** | High-energy proton flux observed during Solar Cycle 25 maximum on May 10, 2024. |
| **Event Date & Time** | **Real NASA Data** | Timestamp `2024-05-10T13:35Z` logged by NASA DONKI. |
| **Observation Instruments** | **Real NASA Data** | Detected by GOES-P SEISS satellite proton channels. |
| **Lunar Magnetosphere / Atmosphere Absence** | **Real Planetary Science** | The Moon genuinely lacks a global magnetic field and atmosphere, leaving its surface exposed to space weather. |
| **Astronaut Dose & Health Damage** | **Simulated Gameplay** | NASA DONKI does not monitor fictional astronauts. Crew health drops (-20% or 0% when sheltered) are simulated game mechanics. |
| **Colony Shielding & Regolith Walls** | **Simulated Gameplay** | Outpost LUNA-01 bunker shielding calculations are educational game models, not official NASA mission specs. |
