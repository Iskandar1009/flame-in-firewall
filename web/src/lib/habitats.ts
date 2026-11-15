import type { Habitat } from "./types";

export const PSI_PER_ATM = 14.696;

// Atmospheres: the challenge statement gives the suit (100% O2, 4.3 psi) and the expected
// Moon base / rover range (>= 30% O2 at <= 10.2 psi). 34% O2 at 8.2 psi is NASA's
// published "exploration atmosphere" and sits inside that range.
export const HABITATS: Habitat[] = [
  {
    id: "station",
    name: "Space station",
    short: "Station",
    o2: [21, 21],
    psi: [14.7, 14.7],
    gravity: 0,
    gravityLabel: "microgravity",
    crew: "Long-duration orbital laboratory (ISS-class)",
    note: "Earth-like air. Almost all PSI combustion tests on solids were run in exactly this atmosphere.",
    source: "Earth sea-level air, as on the ISS",
  },
  {
    id: "transit",
    name: "Deep-space spacecraft",
    short: "Spacecraft",
    o2: [21, 26.5],
    psi: [10.2, 14.7],
    gravity: 0,
    gravityLabel: "microgravity",
    crew: "Crew capsule in transit to the Moon or Mars",
    note: "Small volume, days from help. Cabin pressure may be lowered and oxygen raised before spacewalks.",
    source: "Range between Earth air and the 10.2 psi pre-breathe protocol",
    assumed: true,
  },
  {
    id: "moonbase",
    name: "Moon base",
    short: "Moon base",
    o2: [30, 34],
    psi: [8.2, 10.2],
    gravity: 0.166,
    gravityLabel: "0.17 g",
    crew: "Surface habitat with frequent spacewalks",
    note: "Oxygen 30% or greater at 10.2 psi or less, to shorten pre-breathing before lunar excursions.",
    source: "NASA Space Apps 2026 challenge statement",
    surface: true,
  },
  {
    id: "rover",
    name: "Pressurized rover",
    short: "Rover",
    o2: [30, 34],
    psi: [8.2, 10.2],
    gravity: 0.166,
    gravityLabel: "0.17 g",
    crew: "Two crew, very small sealed cabin, far from base",
    note: "Same enriched atmosphere as the Moon base, in a far smaller volume with no place to retreat.",
    source: "NASA Space Apps 2026 challenge statement",
    surface: true,
  },
  {
    id: "mars",
    name: "Mars base",
    short: "Mars base",
    o2: [30, 34],
    psi: [8.2, 10.2],
    gravity: 0.38,
    gravityLabel: "0.38 g",
    crew: "Surface habitat, months from resupply",
    note: "Atmosphere not yet defined; assumed to match the lunar exploration atmosphere.",
    source: "Assumption: same exploration atmosphere as the Moon base",
    assumed: true,
    surface: true,
  },
];

// Reference points drawn on the flammability map (not selectable missions).
export const REFERENCES = [
  { id: "earth", label: "Earth / ISS air", o2: 21, atm: 1, note: "21% O2 at 14.7 psi" },
  { id: "suit", label: "Spacesuit", o2: 100, atm: 4.3 / PSI_PER_ATM, note: "100% O2 at 4.3 psi (challenge statement)" },
];

// Expected Moon base / rover atmosphere. Pressure bounds carry a 0.02 atm (0.3 psi) tolerance
// so tests run at a nominal 10.2 psi (logged as 0.70-0.71 atm) count as inside.
export const EXPLORATION_ZONE = {
  o2: [30, 34] as [number, number],
  atm: [8.2 / PSI_PER_ATM - 0.02, 10.2 / PSI_PER_ATM + 0.02] as [number, number],
};
