import React from 'react';
import { ThemeMode } from '../types';
import { palette } from '../utils/theme';
import { sound } from '../utils/audio';
import { SectionShell } from './SectionShell';

interface HeroSectionProps {
  onExploreAnatomy: () => void;
  onOpenReserve: () => void;
  themeMode?: ThemeMode;
}

const SPECS = [
  { label: 'Size', value: '7 — 29.5"' },
  { label: 'Weight', value: '624 g' },
  { label: 'Pressure', value: '8.0 PSI' },
  { label: 'Edition', value: '01 / 500' },
];

export const HeroSection: React.FC<HeroSectionProps> = ({
  onExploreAnatomy,
  onOpenReserve,
  themeMode = 'day',
}) => {
  const p = palette(themeMode === 'night');

  return (
    <SectionShell
      id="overview"
      eyebrow="Pro Tour Edition"
      themeMode={themeMode}
      title={
        <>
          The Kinetic
          <br />
          Sphere
        </>
      }
      description="A regulation basketball engineered for true flight and a confident grip. Hand-finished, numbered, and limited to 500 pieces."
      actions={
        <>
          <button
            onClick={() => {
              sound.playMetallicClick();
              onOpenReserve();
            }}
            className={`px-6 py-2.5 rounded-full text-[11px] font-bold tracking-wider uppercase transition-colors cursor-pointer ${p.accentBg}`}
          >
            Reserve
          </button>
          <button
            onClick={onExploreAnatomy}
            className={`px-6 py-2.5 rounded-full text-[11px] font-bold tracking-wider uppercase transition-colors cursor-pointer ${p.ghostBtn}`}
          >
            Explore anatomy
          </button>
        </>
      }
    >
      <dl className="flex flex-col">
        {SPECS.map((spec) => (
          <div
            key={spec.label}
            className={`flex items-baseline justify-between py-3.5 border-b ${p.line}`}
          >
            <dt className={`text-[11px] uppercase tracking-[0.2em] ${p.muted}`}>{spec.label}</dt>
            <dd className={`font-display text-xl font-bold ${p.heading}`}>{spec.value}</dd>
          </div>
        ))}
      </dl>
    </SectionShell>
  );
};
