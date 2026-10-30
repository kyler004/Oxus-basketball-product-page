export type BallEdition = 'heritage' | 'stealth' | 'eclipse' | 'monolith' | 'olympus';

export interface BallConfig {
  edition: BallEdition;
  leatherName: string;
  leatherColor: string;
  leatherSecondaryColor: string;
  seamColor: string;
  seamRoughness: number;
  seamMetalness: number;
  monogramText: string;
  monogramFoil: 'gold' | 'silver' | 'rose-gold' | 'holographic';
  serialNumber: string;
  gripDensity: 'fiba' | 'nba' | 'custom' | 'deep-channel' | 'ultra-tack';
  roughness: number;
  metalness: number;
  pebbleDepth: number;
}

export type ViewSection = 
  | 'hero'
  | 'deconstruction'
  | 'macro'
  | 'aerodynamics'
  | 'customizer'
  | 'footer';

export type ThemeMode = 'day' | 'night';

export type LightingPreset = 'court-lights' | 'volumetric-gold' | 'cyber-noir' | 'stadium-flood';

export interface DeconstructedLayer {
  id: string;
  name: string;
  tagline: string;
  thickness: string;
  material: string;
  specs: { label: string; value: string }[];
  description: string;
  color: string;
  offsetDistance: number;
}

export interface FlightTelemetry {
  rpm: number;
  airSpeedKmh: number;
  dragCoefficient: number;
  magnusForceN: number;
  trajectoryAngle: number;
  reboundElasticity: number;
}

export interface SoundSettings {
  muted: boolean;
  volume: number;
}
