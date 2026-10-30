import React from 'react';
import { BallConfig, ThemeMode } from '../types';
import { palette } from '../utils/theme';
import { sound } from '../utils/audio';
import { SectionShell } from './SectionShell';

interface MacroGrainSectionProps {
  config: BallConfig;
  onUpdateConfig: (updated: Partial<BallConfig>) => void;
  themeMode?: ThemeMode;
}

const PRESETS = [
  { id: 'fiba', label: 'FIBA Tour', pebbles: '18,400', depth: 0.85 },
  { id: 'nba', label: 'NBA Match', pebbles: '19,200', depth: 0.95 },
  { id: 'custom', label: 'Ultra Tactile', pebbles: '21,000', depth: 1.1 },
];

export const MacroGrainSection: React.FC<MacroGrainSectionProps> = ({
  config,
  onUpdateConfig,
  themeMode = 'day',
}) => {
  const p = palette(themeMode === 'night');

  return (
    <SectionShell
      id="macro"
      eyebrow="Grip"
      themeMode={themeMode}
      title={
        <>
          Grip &amp;
          <br />
          micro-grain
        </>
      }
      description="Thousands of laser-sculpted pebbles and fine channels wick away perspiration, so the ball stays put through every release."
    >
      <p className={`text-[11px] font-bold uppercase tracking-[0.25em] pb-3 ${p.muted}`}>
        Pebble density
      </p>
      <div role="radiogroup" aria-label="Pebble density" className="flex flex-col gap-2">
        {PRESETS.map((preset) => {
          const isSelected = config.gripDensity === preset.id;
          return (
            <button
              key={preset.id}
              id={`grip-preset-${preset.id}`}
              role="radio"
              aria-checked={isSelected}
              onClick={() => {
                sound.playMetallicClick();
                onUpdateConfig({
                  gripDensity: preset.id as BallConfig['gripDensity'],
                  pebbleDepth: preset.depth,
                });
              }}
              className={`flex items-center justify-between py-3 text-left cursor-pointer transition-colors border-b-2 ${
                isSelected ? `${p.rowActive} px-3` : p.rowIdle
              }`}
            >
              <span className="text-sm font-semibold">{preset.label}</span>
              <span className={`text-xs font-bold ${isSelected ? p.accent : p.muted}`}>
                {preset.pebbles} pebbles
              </span>
            </button>
          );
        })}
      </div>

      <dl className="grid grid-cols-2 gap-6 pt-7">
        <div>
          <dt className={`text-[10px] uppercase tracking-wider ${p.muted}`}>Friction</dt>
          <dd className={`font-display text-xl font-bold ${p.heading}`}>0.88 μ</dd>
        </div>
        <div>
          <dt className={`text-[10px] uppercase tracking-wider ${p.muted}`}>Channel depth</dt>
          <dd className={`font-display text-xl font-bold ${p.heading}`}>1.2 mm</dd>
        </div>
      </dl>
    </SectionShell>
  );
};
