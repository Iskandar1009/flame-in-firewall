export type Pillar = "prevention" | "detection" | "suppression";

export interface Investigation {
  id: string;
  num: number;
  acronym: string;
  title: string;
  url: string;
  doi: string;
  subArea: string;
  projectType: string;
  platform: string;
  hardware: string;
  center: string;
  start: string;
  end: string;
  pis: string[];
  objective: string;
  hypothesis: string;
  approach: string;
  impacts: string;
  nPubs: number;
  pubs: { title: string; authors: string; doi: string }[];
  nFiles: number;
  bytes: number;
  fileCats: Record<string, number>;
  tables: string[];
  nTests: number;
  o2Range: [number, number] | null;
  pRange: [number, number] | null;
  license: string;
}

export interface Insight {
  oneLiner: string;
  summary: string;
  pillars: Record<Pillar, number>;
  fireSafetyRelevance: number;
  relevanceReason: string;
  fuelPhase: "solid" | "liquid" | "gas" | "aerosol" | "none";
  fuels: string[];
  materialRealism: number;
  geometry: string;
  conditions: { oxygen: string; pressure: string; flow: string; gravity: string };
  variables: string[];
  measurements: string[];
  keyFindings: string[];
  findingsAreResults: boolean;
  safetyInsight: string;
  informsEquipment: string;
  modelingValue: number;
  modelingNote: string;
  earthBenefit: string;
  limitations: string;
  model: string;
  generatedAt: string;
}

export interface TestPoint {
  inv: string;
  test: string;
  fuel: string;
  phase: string;
  o2: number;
  p: number | null;
  diluent?: string;
  outcome?: string;
  flame?: string;
  o2Kind?: string;
  pAssumed?: boolean;
  matrix?: boolean;
  flow?: number;
  cool?: string;
  ignited?: string;
  d0?: number;
}

export type Study = Investigation & { ai: Insight; name: string };

export interface Habitat {
  id: string;
  name: string;
  short: string;
  o2: [number, number];
  psi: [number, number];
  gravity: number;
  gravityLabel: string;
  crew: string;
  note: string;
  source: string;
  assumed?: boolean;
  surface?: boolean;
}
