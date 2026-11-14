/**
 * LUNA: Mission Survival - Friendly Colony Structures & Perfect Camera Angles
 */
export const BUILDINGS_DATA = {
  habitat: {
    id: "habitat",
    name: "Main Space House (HAB-01)",
    tagline: "Where the astronauts sleep, eat, and stay safe",
    icon: "🏠",
    color: "#E6EAF0",
    status: "Safe & Cozy",
    statusColor: "#06D6A0",
    description: "This is the cozy home where our 4 astronauts live! It has comfy sleeping bunks, warm air to breathe, a kitchen, and super-strong walls that protect everyone from cold space weather.",
    purpose: "Keeps all astronauts warm, safe, and rested with plenty of fresh air.",
    specs: [
      { label: "Air Inside", value: "100% Fresh & Breathable" },
      { label: "Temperature", value: "Nice & Warm (21°C / 70°F)" },
      { label: "Sleeping Bunks", value: "4 Comfy Space Beds" },
      { label: "Walls", value: "Super-Strong Space Armor" },
      { label: "Condition", value: "100% Perfect Shape" }
    ],
    // Perfectly centered on the white cylinder, cupola window, and entrance stairs
    cameraView: {
      position: { x: 2.2, y: 7.0, z: 6.8 },
      target: { x: 0, y: 4.2, z: -2.5 }
    },
    orbitTarget: { x: 3.5, y: 5.5, z: 0.5 }
  },
  greenhouse: {
    id: "greenhouse",
    name: "Plant Greenhouse Bio-Domes",
    tagline: "Growing yummy green food and clean air",
    icon: "🌱",
    color: "#A7C98D",
    status: "Blooming",
    statusColor: "#06D6A0",
    description: "Look through the clear curved glass! Inside are rows of green trees and fresh crunchy vegetables. The plants turn carbon dioxide into fresh clean oxygen so everyone can breathe.",
    purpose: "Grows tasty vegetables for the crew and cleans the air naturally.",
    specs: [
      { label: "Growing Today", value: "Fresh Greens, Berries, Wheat" },
      { label: "Clean Air Made", value: "Lots of fresh oxygen every day!" },
      { label: "Watering System", value: "Gentle recycled water mist" },
      { label: "Grow Lights", value: "Warm rainbow sunshine lamps" },
      { label: "Plant Health", value: "Super Healthy & Green" }
    ],
    // Framed right on the front greenhouse with visible trees and front stairs
    cameraView: {
      position: { x: 9.8, y: 4.2, z: 5.5 },
      target: { x: 6.8, y: 1.8, z: -0.6 }
    },
    orbitTarget: { x: 4.2, y: 3.8, z: 1.5 }
  },
  solar_array: {
    id: "solar_array",
    name: "Sun Power Panels",
    tagline: "Catching bright sunshine to make electricity",
    icon: "⚡",
    color: "#3A86FF",
    status: "Making Power",
    statusColor: "#06D6A0",
    description: "These shiny blue panels point straight at the sun like big sunflowers! They turn sunlight into clean electric power to light up our rooms and run our computers.",
    purpose: "Makes free, clean electricity from sunlight to power the entire Moon base.",
    specs: [
      { label: "Power Output", value: "48.5 Kilowatts (Full Power!)" },
      { label: "Sun Tracker", value: "Turns smoothly toward the Sun" },
      { label: "Battery Reserve", value: "Stores extra power for dark nights" },
      { label: "Panel Count", value: "11 Big Blue Solar Panels" },
      { label: "Status", value: "All Panels Working Great" }
    ],
    // Framed right in front of the solar panel grid
    cameraView: {
      position: { x: -0.5, y: 3.8, z: 8.5 },
      target: { x: -2.4, y: 1.2, z: 3.8 }
    },
    orbitTarget: { x: -4.5, y: 2.8, z: 5.5 }
  },
  research_lab: {
    id: "research_lab",
    name: "Moon Science Lab",
    tagline: "Exploring sparkling Moon rocks and hidden ice",
    icon: "🔬",
    color: "#697DAF",
    status: "Analyzing Rocks",
    statusColor: "#06D6A0",
    description: "Our smart scientists work here! They look through the big blue window, use cool lasers to test Moon rocks, and look for frozen ice water hidden under the Moon's surface.",
    purpose: "Tests Moon dirt, finds frozen water, and invents new tools for space exploration.",
    specs: [
      { label: "Laser Scanner", value: "Beaming & Calibrated" },
      { label: "Moon Ice Found", value: "Yes! Hidden ice detected!" },
      { label: "Rock Samples", value: "28 Shiny Moon Crystals" },
      { label: "Cleanroom Level", value: "Super Clean (No Earth Dust)" },
      { label: "Status", value: "Experiments Running Smoothly" }
    ],
    // Framed straight at the science lab window and laser
    cameraView: {
      position: { x: 7.2, y: 4.2, z: 7.2 },
      target: { x: 5.5, y: 1.8, z: 2.2 }
    },
    orbitTarget: { x: 3.2, y: 3.6, z: 3.8 }
  },
  antenna: {
    id: "antenna",
    name: "Space Radio Dish",
    tagline: "Calling friends and family back on planet Earth",
    icon: "📡",
    color: "#E8B76B",
    status: "Talking to Earth",
    statusColor: "#06D6A0",
    description: "This big silver dish beams messages across 384,000 kilometers of deep space straight to Earth! It sends video calls, funny photos, and mission reports in just over one second.",
    purpose: "Connects our Moon base to Earth Mission Control so we can talk anytime.",
    specs: [
      { label: "Call Distance", value: "All the way to Earth (384,000 km)" },
      { label: "Call Delay", value: "Just 1.3 seconds (Speed of light!)" },
      { label: "Blinking Light", value: "Red light flashes when sending data" },
      { label: "Signal Strength", value: "5 out of 5 Bars (Crystal Clear)" },
      { label: "Status", value: "Connected to Earth Right Now" }
    ],
    // Framed right at the elevated dish and blinking beacon
    cameraView: {
      position: { x: 8.5, y: 5.2, z: -1.2 },
      target: { x: 5.2, y: 3.2, z: -5.5 }
    },
    orbitTarget: { x: 3.2, y: 4.8, z: -3.5 }
  },
  rover: {
    id: "rover",
    name: "Moon Rover Buggy (Pathfinder)",
    tagline: "The 6-wheel space truck for driving across Moon hills",
    icon: "🚜",
    color: "#F47752",
    status: "Ready to Drive",
    statusColor: "#06D6A0",
    description: "Hop in! Pathfinder is our rugged 6-wheel electric Moon buggy. It has blue solar wings, bright headlights to see in the dark, and big squishy tires that never get stuck in Moon dirt.",
    purpose: "Drives astronauts across deep craters and carries heavy rocks back to base.",
    specs: [
      { label: "Wheels", value: "6 Super-Grip Space Tires" },
      { label: "Battery Charge", value: "100% Full Battery" },
      { label: "Headlights", value: "Bright White LED High Beams" },
      { label: "Top Speed", value: "15 km/h (Smooth & Bouncy!)" },
      { label: "Status", value: "Parked & Ready for Adventure" }
    ],
    // Framed right in front of the rover showing wheels, cabin, wings, and lights
    cameraView: {
      position: { x: 2.8, y: 2.8, z: 10.2 },
      target: { x: 0.2, y: 1.0, z: 6.2 }
    },
    orbitTarget: { x: -1.8, y: 2.4, z: 7.2 }
  }
};
