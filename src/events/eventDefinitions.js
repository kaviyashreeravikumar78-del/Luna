/**
 * LUNA: Mission Survival - Seven-Day Mission Event Definitions
 * 7 balanced, narrative-rich daily survival events with 3 choices and clear consequences.
 */
export const MISSION_EVENTS = {
  1: {
    sol: 1,
    id: "sol_1_solar_dust",
    title: "⚡ Solar Panel Regolith Dust Accumulation",
    facilityId: "solar_array",
    facilityName: "Photovoltaic Solar Farm",
    icon: "⚡",
    severity: "Medium",
    situation: "Fine lunar dust kicked up by a micrometeoroid impact along the crater rim has settled across the solar panel array, reducing photovoltaic electricity generation by 15%.",
    orbitDialogue: "Commander! Lunar dust is clinging electrostatically to our shiny blue solar panels! If we don't fix this, our batteries might run low when night falls. What should we do?",
    decisions: [
      {
        id: "choice_1_a",
        label: "A. Send Engineer Marcus Diaz on an EVA to brush and inspect panels",
        tag: "Active Maintenance (Crew Fatigue)",
        summary: "Marcus puts on his space suit and carefully cleans all 11 panels.",
        orbitAdvice: "Marcus is our best engineer! He will get the panels shining again, but doing space-walks takes a lot of hard work and oxygen.",
        consequences: {
          resources: { power: 10, oxygen: -2 },
          facilities: { solar_array: 15 },
          crew: [
            { id: "marcus", healthDelta: -4, reason: "EVA space-walk fatigue from manual solar panel brushing" }
          ],
          logText: "Marcus Diaz performed a 2-hour EVA and cleaned the solar panels. Power output restored by +10%, but Marcus experienced minor physical fatigue (-4% health)."
        }
      },
      {
        id: "choice_1_b",
        label: "B. Power down non-essential lab experiments and conserve batteries",
        tag: "Power Conservation (Science Delayed)",
        summary: "Keep the dust in place for now and shut down high-power laser spectrometers.",
        orbitAdvice: "Safe and cozy! We save our electricity, but our science experiments will have to wait for later.",
        consequences: {
          resources: { power: 0 },
          facilities: { research_lab: -15 },
          crew: [],
          logText: "Commander conserved power reserves. Non-essential research systems shut down; Geological Lab condition degraded by -15%."
        }
      },
      {
        id: "choice_1_c",
        label: "C. Delay action and wait for electrostatic dust dissipation",
        tag: "Do Nothing (Risk of Escalation)",
        summary: "Take no action and hope the solar wind clears the dust over time.",
        orbitAdvice: "Uh oh, Commander! Moon dust is super sticky. It might not blow away on its own!",
        consequences: {
          resources: { power: -12 },
          facilities: { solar_array: -20 },
          crew: [],
          logText: "No action taken. Dust remained baked onto panels under sunlight. Solar Array efficiency dropped by -20% and base lost -12% power."
        }
      }
    ]
  },

  2: {
    sol: 2,
    id: "sol_2_water_leak",
    title: "💧 Habitat Hydro-Loop Water Pipe Micro-Leak",
    facilityId: "habitat",
    facilityName: "Main Habitat Hub",
    icon: "💧",
    severity: "High",
    situation: "Telemetry sensors detect pressure drops in the water recycling manifold between the Habitat and Greenhouse. Moisture is leaking into sub-floor conduits.",
    orbitDialogue: "Beep! We have a leak in our water pipes under the floor! Water is super precious on the Moon—we can't let our drinking water vanish into space!",
    decisions: [
      {
        id: "choice_2_a",
        label: "A. Assign Marcus Diaz and Dr. Aris to weld and seal the pipe",
        tag: "Immediate Repair (Laser Welder Power)",
        summary: "Use the high-temp laser welding tool to seal the micro-fracture immediately.",
        orbitAdvice: "A laser weld will fix it permanently! It uses some electric battery power, but our water stays 100% safe!",
        consequences: {
          resources: { water: 5, power: -6 },
          facilities: { habitat: 10 },
          crew: [
            { id: "marcus", healthDelta: -2, reason: "Strenuous mechanical welding under habitat deck" }
          ],
          logText: "Marcus and Dr. Aris successfully laser-welded the leaking pipe. Water loss prevented (+5% saved), consuming 6% battery power."
        }
      },
      {
        id: "choice_2_b",
        label: "B. Reroute water flow through the emergency secondary bypass line",
        tag: "Reroute & Ration (Minor Water Loss)",
        summary: "Bypass the leaking section and enforce strict daily water rationing.",
        orbitAdvice: "The bypass stops the leak, but everyone will have to take shorter sips of water today.",
        consequences: {
          resources: { water: -6 },
          facilities: { habitat: 0 },
          crew: [
            { id: "evelyn", healthDelta: -2, reason: "Minor dehydration fatigue from strict rationing" },
            { id: "maya", healthDelta: -2, reason: "Minor dehydration fatigue from strict rationing" }
          ],
          logText: "Water rerouted through secondary bypass. Lost 6% water during valve transition; minor crew dehydration fatigue logged."
        }
      },
      {
        id: "choice_2_c",
        label: "C. Delay repair and wait until the scheduled Sol 5 inspection",
        tag: "Ignore Warning (Severe Leak)",
        summary: "Leave the drip alone and plan to address it later in the mission.",
        orbitAdvice: "Warning! The leak will keep dripping and dripping if we don't fix it right now!",
        consequences: {
          resources: { water: -16 },
          facilities: { habitat: -15 },
          crew: [
            { id: "aris", healthDelta: -5, reason: "Dehydration headache from water reservoir loss" }
          ],
          logText: "Delayed repair allowed 16% of base water reserves to evaporate into vacuum. Habitat interior sub-floor damaged (-15% integrity)."
        }
      }
    ]
  },

  3: {
    sol: 3,
    id: "sol_3_nasa_sep_alert",
    title: "🚨 NASA SPACE WEATHER ALERT: Solar Energetic Particle (SEP) Event",
    facilityId: "habitat",
    facilityName: "Main Habitat Hub (Storm Shelter)",
    icon: "☀️",
    severity: "Critical (Simulated Radiation Alert)",
    isNasaEvent: true, // Triggers NASA DONKI Deep Space Telemetry View!
    situation: "Real NASA DONKI space weather records from May 10, 2024 confirm a powerful Solar Energetic Particle (SEP) storm. The Sun released millions of high-speed protons. The Moon has no atmosphere or magnetic shield, so surface explorers must take shelter inside the bunker immediately.",
    orbitDialogue: "ATTENTION COMMANDER! NASA DONKI detected a real Solar Energetic Particle storm from May 10, 2024! High-energy particles are flying past the Moon! We need to gather the crew and take cover inside the storm shelter right now!",
    decisions: [
      {
        id: "choice_3_a",
        label: "A. Full Outpost Lockdown: Shelter all 4 astronauts inside HAB-01 core storm shelter",
        tag: "Recommended (100% Crew Shielding)",
        summary: "Suspend all EVAs, park the rover, and seal astronauts inside the titanium/regolith bunker.",
        orbitAdvice: "The safest choice! Inside the Habitat's thick regolith bunker, our space friends will be 100% shielded from solar particles!",
        consequences: {
          resources: { power: -8, oxygen: -3 },
          facilities: { habitat: 5 },
          crew: [],
          logText: "All 4 astronauts sheltered inside the thick HAB-01 bunker. 100% protected from simulated radiation (0 health loss). Life-support storm scrubbers consumed 8% power."
        }
      },
      {
        id: "choice_3_b",
        label: "B. Restricted Operations: Continue indoor lab/greenhouse work with protective aprons",
        tag: "Moderate Caution (Minor Fatigue)",
        summary: "Keep science and food production running, but wear heavy lead-polyethylene aprons.",
        orbitAdvice: "The plants and rocks get studied, but wearing super-heavy radiation aprons will tire out the crew.",
        consequences: {
          resources: { power: -3, food: 3 },
          facilities: { greenhouse: 5, research_lab: 5 },
          crew: [
            { id: "evelyn", healthDelta: -5, reason: "Elevated background cosmic radiation exposure & heavy apron fatigue" },
            { id: "marcus", healthDelta: -5, reason: "Elevated background cosmic radiation exposure & heavy apron fatigue" },
            { id: "aris", healthDelta: -5, reason: "Elevated background cosmic radiation exposure & heavy apron fatigue" },
            { id: "maya", healthDelta: -5, reason: "Elevated background cosmic radiation exposure & heavy apron fatigue" }
          ],
          logText: "Astronauts maintained indoor duties under lead aprons. Food harvest gained +3%, but all 4 astronauts logged -5% radiation exposure fatigue."
        }
      },
      {
        id: "choice_3_c",
        label: "C. Ignore NASA Alert: Maintain normal exterior EVAs and surface drilling",
        tag: "Dangerous Disregard (Acute Radiation Damage)",
        summary: "Ignore NASA's space-weather notification and proceed with scheduled rover activities.",
        orbitAdvice: "DANGER! Commander, ignoring a real NASA space-weather alert is extremely dangerous! The astronauts will get radiation sickness!",
        consequences: {
          resources: { power: 0 },
          facilities: { habitat: -10 },
          crew: [
            { id: "evelyn", healthDelta: -20, reason: "Direct unshielded solar proton radiation sickness" },
            { id: "marcus", healthDelta: -20, reason: "Direct unshielded solar proton radiation sickness" },
            { id: "aris", healthDelta: -20, reason: "Direct unshielded solar proton radiation sickness" },
            { id: "maya", healthDelta: -20, reason: "Direct unshielded solar proton radiation sickness" }
          ],
          logText: "CRITICAL FAILURE: Crew remained on exterior surface during peak solar particle flux. All 4 astronauts suffered acute radiation illness (-20% health)!"
        }
      }
    ]
  },

  4: {
    sol: 4,
    id: "sol_4_greenhouse_climate",
    title: "🌱 Greenhouse Hydroponic Climate Anomaly",
    facilityId: "greenhouse",
    facilityName: "Hydroponic Bio-Domes",
    icon: "🌱",
    severity: "Medium",
    situation: "Deep shadow from the crater wall has caused temperatures in Bio-Dome Alpha to drop to 11°C. Seedlings and dwarf wheat risk frost damage.",
    orbitDialogue: "Brrr! The shadow of the crater rim is making our plant greenhouse chilly! The little strawberries and greens might stop growing if they get too cold!",
    decisions: [
      {
        id: "choice_4_a",
        label: "A. Divert auxiliary thermal power to warm the Bio-Domes",
        tag: "Heater Activation (Power Consumption)",
        summary: "Turn on high-output infrared grow lamps to restore optimal 22°C temperature.",
        orbitAdvice: "The plants love the warm sunshine lamps! It takes extra power from our batteries, but the crops will grow big and tasty!",
        consequences: {
          resources: { power: -10, food: 8 },
          facilities: { greenhouse: 15 },
          crew: [],
          logText: "Infrared heaters warmed both Bio-Domes. Crops protected and harvest boosted by +8% Food. Consumed 10% battery power."
        }
      },
      {
        id: "choice_4_b",
        label: "B. Prune delicate crops and focus heat only on hardy wheat",
        tag: "Crop Triage (Minor Food Loss)",
        summary: "Sacrifice sensitive berry bushes and conserve power for staple grain crops.",
        orbitAdvice: "We save electricity, but we won't get any sweet berries for dessert this week.",
        consequences: {
          resources: { food: -8, power: -2 },
          facilities: { greenhouse: -5 },
          crew: [],
          logText: "Dr. Aris pruned sensitive plants. Conserved electrical power, but food reserve decreased by -8%."
        }
      },
      {
        id: "choice_4_c",
        label: "C. Do nothing and allow natural thermal equilibrium",
        tag: "Inaction (Severe Crop Wilt)",
        summary: "Leave heaters off and wait for sunrise to warm the glass domes.",
        orbitAdvice: "No, Commander! The plants will freeze in the cold Moon night!",
        consequences: {
          resources: { food: -18, oxygen: -6 },
          facilities: { greenhouse: -30 },
          crew: [],
          logText: "Freezing temperatures wilted 40% of hydroponic vegetation. Food dropped by -18%, natural oxygen generation dropped by -6%."
        }
      }
    ]
  },

  5: {
    sol: 5,
    id: "sol_5_antenna_glitch",
    title: "📡 Space Radio Dish Phase Alignment Glitch",
    facilityId: "antenna",
    facilityName: "Space Radio Dish (Deep Space Uplink)",
    icon: "📡",
    severity: "Medium",
    situation: "Lunar regolith dust has jammed the azimuth motor gears on the Space Radio Dish. Telemetry carrier wave to Earth Deep Space Network is flickering.",
    orbitDialogue: "Static on the line! Our big Space Radio Dish can't turn smoothly toward planet Earth! If the dish loses lock, we won't be able to talk to our families or Mission Control!",
    decisions: [
      {
        id: "choice_5_a",
        label: "A. Maya Lin conducts high-precision remote software realignment",
        tag: "Smart Calibration (Specialist Fatigue)",
        summary: "Maya works 4 hours recalibrating the dish stepper motors using pulsed signals.",
        orbitAdvice: "Maya is a communications genius! She can use computer tricks to guide the dish back onto Earth with zero resource loss!",
        consequences: {
          resources: { power: -2 },
          facilities: { antenna: 20 },
          crew: [
            { id: "maya", healthDelta: -4, reason: "Mental strain & screen fatigue during urgent antenna recalibration" }
          ],
          logText: "Maya Lin successfully restored 5-bar signal lock with Earth. Antenna condition boosted to 100%; Maya experienced mild eye strain (-4% health)."
        }
      },
      {
        id: "choice_5_b",
        label: "B. Switch to low-bandwidth omnidirectional backup antenna",
        tag: "Backup Mode (Reduced Bandwidth)",
        summary: "Transmit low-resolution sensor data and disable live Earth video calls.",
        orbitAdvice: "We can still send basic text messages, but no video calls or family photos for a while.",
        consequences: {
          resources: { power: 0 },
          facilities: { antenna: -15 },
          crew: [
            { id: "evelyn", healthDelta: -2, reason: "Crew morale dipped from loss of Earth voice contact" }
          ],
          logText: "Switched to low-gain backup antenna. Signal maintained at reduced 100 kbps; Dish condition remains degraded (-15%)."
        }
      },
      {
        id: "choice_5_c",
        label: "C. Defer repairs and continue transmitting with packet loss",
        tag: "Ignore Anomaly (Uplink Failure)",
        summary: "Do not intervene and leave the stuck dish straining its motor.",
        orbitAdvice: "The azimuth motor is overheating! If it burns out, Earth won't know if we are safe!",
        consequences: {
          resources: { power: -5 },
          facilities: { antenna: -35 },
          crew: [],
          logText: "Azimuth motor burned out from continuous strain. Space Radio Dish condition crashed to 25% Critical; Earth link intermittent."
        }
      }
    ]
  },

  6: {
    sol: 6,
    id: "sol_6_lab_spectrometer",
    title: "🔬 Geological Lab Spectrometer Power Surge",
    facilityId: "research_lab",
    facilityName: "Lunar Geological Laboratory",
    icon: "🔬",
    severity: "Medium",
    situation: "Analysis of a dense sub-surface ice rock sample triggered a voltage spike in the Raman spectrometer, threatening the laboratory cleanroom capacitor.",
    orbitDialogue: "Spark alert! The Moon rock our scientists were scanning with lasers had a secret burst of static electricity! The laboratory machine is sparking!",
    decisions: [
      {
        id: "choice_6_a",
        label: "A. Use spare capacitor from the Lunar Rover maintenance kit",
        tag: "Parts Replacement (Rover Battery Impact)",
        summary: "Replace the blown lab capacitor with a spare component from the rover buggy.",
        orbitAdvice: "Great idea! The buggy has spare electronic parts in its trunk. The lab will be completely fixed!",
        consequences: {
          resources: { power: -4 },
          facilities: { research_lab: 25 },
          crew: [],
          logText: "Technicians installed the rover spare capacitor into the lab spectrometer. Science Lab restored to 100% operation (4% power used)."
        }
      },
      {
        id: "choice_6_b",
        label: "B. Suspend mineral analysis and safely seal the sample chamber",
        tag: "Safe Shutdown (No Resource Loss)",
        summary: "Abort the laser scan, lock down the specimen, and protect remaining circuitry.",
        orbitAdvice: "Safe and sensible! We won't solve the rock mystery today, but none of our machines will break.",
        consequences: {
          resources: {},
          facilities: { research_lab: -10 },
          crew: [],
          logText: "Dr. Evelyn safely aborted the laser scan. No resources consumed; Lab remains at 60% operational capacity."
        }
      },
      {
        id: "choice_6_c",
        label: "C. Force-reboot the spectrometer at maximum voltage",
        tag: "Forced Override (Critical Blowout)",
        summary: "Attempt an emergency power surge override to clear the capacitor fault.",
        orbitAdvice: "Be careful, Commander! Forcing extra electricity through a smoking circuit could blow the whole machine up!",
        consequences: {
          resources: { power: -10 },
          facilities: { research_lab: -40 },
          crew: [
            { id: "aris", healthDelta: -4, reason: "Acrolein smoke inhalation from fried capacitor blowout" }
          ],
          logText: "SPECTROMETER BLOWOUT: High-voltage surge vaporized the sensor prism! Lab condition crashed to 20% Critical; Dr. Aris suffered mild smoke inhalation."
        }
      }
    ]
  },

  7: {
    sol: 7,
    id: "sol_7_final_preparation",
    title: "🏆 Final Sol Expedition Debrief & Earth Return Prep",
    facilityId: "habitat",
    facilityName: "All Colony Facilities",
    icon: "🏆",
    severity: "Low (Mission Finale)",
    situation: "Congratulations! You have guided Outpost LUNA-01 through seven simulated days of lunar survival. The Earth return capsule is docking in orbit. Prepare final inventory checks.",
    orbitDialogue: "HOORAY, COMMANDER! We made it to Sol 7! You took such good care of our astronauts, our plants, and our Moon machines! How should we finish our amazing adventure?",
    decisions: [
      {
        id: "choice_7_a",
        label: "A. Run comprehensive multi-system diagnostics across all facilities",
        tag: "Thorough Commander (Highest Safety Rating)",
        summary: "Audit life-support, seal sample lockers, and transmit full telemetry to Earth.",
        orbitAdvice: "A true space commander's finish! Every single checklist will be 100% verified before our journey home!",
        consequences: {
          resources: { power: -4, oxygen: -2 },
          facilities: { habitat: 10, solar_array: 10, greenhouse: 10, research_lab: 10, antenna: 10 },
          crew: [],
          logText: "Commander conducted full multi-system audit. All 5 facilities stabilized with perfect maintenance logs for incoming relief crew."
        }
      },
      {
        id: "choice_7_b",
        label: "B. Conduct final celebratory rover excursion to photograph the South Pole",
        tag: "Crew Celebration (Morale Boost)",
        summary: "Drive to the crater rim, plant a commemorative marker, and take crew photos.",
        orbitAdvice: "Cheese! Say Moon-cheese! That will be the most famous space photograph in human history!",
        consequences: {
          resources: { power: -6, oxygen: -3 },
          facilities: {},
          crew: [
            { id: "evelyn", healthDelta: 4, reason: "Triumphant commander morale boost at crater overlook" },
            { id: "marcus", healthDelta: 4, reason: "Triumphant crew morale boost at crater overlook" },
            { id: "aris", healthDelta: 4, reason: "Triumphant crew morale boost at crater overlook" },
            { id: "maya", healthDelta: 4, reason: "Triumphant crew morale boost at crater overlook" }
          ],
          logText: "Crew completed a scenic rover drive along Shackleton Crater rim. Boosted crew health and morale by +4% across all 4 astronauts."
        }
      },
      {
        id: "choice_7_c",
        label: "C. Initiate rapid lockdown and conserve all remaining supplies",
        tag: "Resource Saver (Maximum Conservation)",
        summary: "Power down all auxiliary systems early and preserve every drop of supplies.",
        orbitAdvice: "Super frugal! Every unit of water and oxygen left over can be saved for the next Moon mission!",
        consequences: {
          resources: { power: 0, oxygen: 0, water: 0, food: 0 },
          facilities: {},
          crew: [],
          logText: "Outpost placed into ultra-low-power hibernation. 100% of remaining resources preserved for expedition records."
        }
      }
    ]
  }
};
