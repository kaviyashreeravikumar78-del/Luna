/**
 * LUNA: Mission Survival - Module 2: Colony Facilities Monitoring Data
 */
export const FACILITIES_DATA = [
  {
    id: "habitat",
    name: "Main Habitat Hub (HAB-01)",
    icon: "🏠",
    status: "Operational",
    statusColor: "#06D6A0",
    condition: "100% Integrity",
    purpose: "Primary crew living quarters, atmospheric life-support, and command shelter.",
    relatedResource: "Oxygen & Shelter",
    description: "The main habitat provides a pressurized, warm home for the four astronauts. It features double-hull micrometeoroid shielding, emergency air scrubbers, sleeping quarters, and medical supplies.",
    specs: [
      { label: "Shielding Rating", value: "Reinforced Titanium / Regolith Composite" },
      { label: "Internal Atmosphere", value: "101.3 kPa (Nominal)" },
      { label: "Bunks Occupied", value: "4 / 4 Astronauts" },
      { label: "Emergency Oxygen", value: "72 Hours Reserve" }
    ]
  },
  {
    id: "solar_array",
    name: "Photovoltaic Solar Farm",
    icon: "⚡",
    status: "Operational",
    statusColor: "#06D6A0",
    condition: "100% Alignment",
    purpose: "Dual-axis solar tracking farm generating electricity for all base operations.",
    relatedResource: "Electrical Power",
    description: "Equipped with 11 high-efficiency monocrystalline solar panels mounted on motorized pivots. Tracks the low-angle sun along the lunar South Pole crater rim and feeds lithium-sulfur batteries.",
    specs: [
      { label: "Current Generation", value: "48.5 kW (Peak Daylight)" },
      { label: "Tracking Efficiency", value: "99.8% Sun Lock" },
      { label: "Panel Grid Condition", value: "11/11 Active & Clean" },
      { label: "Battery Buffer Bank", value: "240 kWh Full Reserve" }
    ]
  },
  {
    id: "greenhouse",
    name: "Hydroponic Bio-Domes",
    icon: "🌱",
    status: "Operational",
    statusColor: "#06D6A0",
    condition: "100% Healthy",
    purpose: "Cultivates dwarf crops, microgreens, and algae to produce food and oxygen.",
    relatedResource: "Food & Oxygen",
    description: "Dual curved transparent bio-domes cultivating fast-growing plants under warm rainbow grow lights. Plants absorb crew carbon dioxide, emit fresh oxygen, and produce nutritious greens.",
    specs: [
      { label: "Crops Cultivated", value: "Dwarf Wheat, Berries, Spirulina" },
      { label: "Oxygen Production", value: "+14.2 kg O2 / Earth Day" },
      { label: "Water Reservoir", value: "2,400 L Purified Nutrient Mist" },
      { label: "Growth Health Index", value: "98.5% Nominal" }
    ]
  },
  {
    id: "research_lab",
    name: "Lunar Geological Laboratory",
    icon: "🔬",
    status: "Operational",
    statusColor: "#06D6A0",
    condition: "100% Calibrated",
    purpose: "Analyzes lunar regolith core drills, frozen water ice, and volatile isotopes.",
    relatedResource: "Water & Science",
    description: "Cleanroom research laboratory equipped with Raman spectrometers and cryogenic freezers. Scientists analyze deep sub-surface ice cores mined from permanently shadowed craters.",
    specs: [
      { label: "Laser Spectrometer", value: "Online & Calibrated" },
      { label: "Ice Volatiles Detected", value: "5.8% Water Equivalent" },
      { label: "Core Drill Samples", value: "28 Archived Specimens" },
      { label: "Cleanroom Air Purity", value: "ISO Class 5 Pressurized" }
    ]
  },
  {
    id: "antenna",
    name: "Space Radio Dish (Deep Space Uplink)",
    icon: "📡",
    status: "Operational",
    statusColor: "#06D6A0",
    condition: "100% Signal Link",
    purpose: "Maintains high-bandwidth communication and live telemetry with Earth.",
    relatedResource: "Communications",
    description: "High-gain parabolic dish on an elevated rock foundation with a flashing red beacon light. Keeps Outpost LUNA-01 connected to Earth's Deep Space Network for video, voice, and data.",
    specs: [
      { label: "Earth Signal Latency", value: "1.28 Seconds (Speed of Light)" },
      { label: "Bandwidth Uplink", value: "1.2 Gbps Symmetrical" },
      { label: "Beacon Beacon Status", value: "Flashing Sync Active" },
      { label: "Signal Strength", value: "5 / 5 Bars (Crystal Clear)" }
    ]
  }
];
