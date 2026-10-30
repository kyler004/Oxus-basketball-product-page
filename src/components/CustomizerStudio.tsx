import React from 'react';
import { BallConfig, BallEdition, ThemeMode } from '../types';
import { palette } from '../utils/theme';
import { sound } from '../utils/audio';
import { SectionShell } from './SectionShell';

interface CustomizerStudioProps {
  config: BallConfig;
  onUpdateConfig: (updated: Partial<BallConfig>) => void;
  onReserve?: () => void;
  themeMode?: ThemeMode;
}

const EDITIONS: {
  id: BallEdition;
  name: string;
  leatherColor: string;
  secondaryColor: string;
  seamColor: string;
  seamMetalness: number;
}[] = [
  {
    id: 'heritage',
    name: 'Heritage Amber Clay',
    leatherColor: '#D45B10',
    secondaryColor: '#94380E',
    seamColor: '#121316',
    seamMetalness: 0.1,
  },
  {
    id: 'stealth',
    name: 'Night Stealth Obsidian',
    leatherColor: '#1E1F24',
    secondaryColor: '#121316',
    seamColor: '#0A0A0C',
    seamMetalness: 0.1,
  },
  {
    id: 'eclipse',
    name: 'Coyote Gold Horizon',
    leatherColor: '#968770',
    secondaryColor: '#6B5E4B',
    seamColor: '#C4A478',
    seamMetalness: 0.9,
  },
  {
    id: 'monolith',
    name: 'Camo Sage Drab',
    leatherColor: '#4E5B4E',
    secondaryColor: '#364036',
    seamColor: '#121316',
    seamMetalness: 0.1,
  },
  {
    id: 'olympus',
    name: 'Olympus Concrete Ivory',
    leatherColor: '#E2E4E8',
    secondaryColor: '#C0C4CC',
    seamColor: '#121316',
    seamMetalness: 0.4,
  },
];

export const CustomizerStudio: React.FC<CustomizerStudioProps> = ({
  config,
  onUpdateConfig,
  onReserve,
  themeMode = 'day',
}) => {
  const p = palette(themeMode === 'night');

  const handleSelectEdition = (edition: (typeof EDITIONS)[number]) => {
    sound.playMetallicClick();
    onUpdateConfig({
      edition: edition.id,
      leatherName: edition.name,
      leatherColor: edition.leatherColor,
      leatherSecondaryColor: edition.secondaryColor,
      seamColor: edition.seamColor,
      seamMetalness: edition.seamMetalness,
    });
  };

  return (
    <SectionShell
      id="bespoke"
      eyebrow="Bespoke"
      themeMode={themeMode}
      title={
        <>
          Choose
          <br />
          your finish
        </>
      }
      description="Five hand-cured leather finishes with matching seams. Pick one and watch the ball update."
      actions={
        onReserve && (
          <button
            onClick={() => {
              sound.playMetallicClick();
              onReserve();
            }}
            className={`px-6 py-2.5 rounded-full text-[11px] font-bold tracking-wider uppercase transition-colors cursor-pointer ${p.accentBg}`}
          >
            Reserve this edition
          </button>
        )
      }
    >
      <div role="radiogroup" aria-label="Finish" className="flex flex-col gap-2">
        {EDITIONS.map((ed) => {
          const isSelected = config.edition === ed.id;
          return (
            <button
              key={ed.id}
              id={`edition-row-${ed.id}`}
              role="radio"
              aria-checked={isSelected}
              onClick={() => handleSelectEdition(ed)}
              className={`flex items-center gap-4 py-3 text-left cursor-pointer transition-colors border-b-2 ${
                isSelected ? `${p.rowActive} px-3` : p.rowIdle
              }`}
            >
              <span
                className="w-6 h-6 rounded-full border border-black/20 shrink-0"
                style={{ background: `linear-gradient(135deg, ${ed.leatherColor}, ${ed.secondaryColor})` }}
              />
              <span className="text-sm font-semibold">{ed.name}</span>
            </button>
          );
        })}
      </div>
    </SectionShell>
  );
};
