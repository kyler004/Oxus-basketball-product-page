import React from 'react';
import { ArrowUp } from 'lucide-react';
import { BallConfig, ThemeMode } from '../types';
import { palette } from '../utils/theme';
import { sound } from '../utils/audio';
import { SectionShell } from './SectionShell';

interface FooterProps {
  onScrollToSection: (sectionId: string) => void;
  themeMode: ThemeMode;
  config: BallConfig;
  onOpenReserveModal?: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  onScrollToSection,
  themeMode,
  config,
  onOpenReserveModal,
}) => {
  const p = palette(themeMode === 'night');

  const rows = [
    { label: 'Finish', value: config.leatherName },
    { label: 'Foil', value: config.monogramFoil.replace('-', ' ') },
    { label: 'Grip', value: config.gripDensity.replace('-', ' ') },
    { label: 'Monogram', value: config.monogramText || 'KS-ELITE' },
  ];

  return (
    <div className="relative w-full h-full">
      <SectionShell
        id="atelier"
        eyebrow="Atelier"
        themeMode={themeMode}
        title={
          <>
            Reserve your
            <br />
            sphere
          </>
        }
        description="Each ball is numbered, hand-finished, and limited to 500 pieces. Your configuration is saved with your reservation."
        actions={
          onOpenReserveModal && (
            <button
              onClick={() => {
                sound.playMetallicClick();
                onOpenReserveModal();
              }}
              className={`px-6 py-2.5 rounded-full text-[11px] font-bold tracking-wider uppercase transition-colors cursor-pointer ${p.accentBg}`}
            >
              Reserve now
            </button>
          )
        }
      >
        <p className={`text-[11px] font-bold uppercase tracking-[0.25em] pb-3 ${p.muted}`}>
          Your configuration
        </p>
        <dl className="flex flex-col">
          {rows.map((row) => (
            <div
              key={row.label}
              className={`flex items-baseline justify-between gap-4 py-3 border-b ${p.line}`}
            >
              <dt className={`text-[11px] uppercase tracking-[0.2em] ${p.muted}`}>{row.label}</dt>
              <dd className={`text-sm font-semibold capitalize text-right ${p.heading}`}>
                {row.value}
              </dd>
            </div>
          ))}
        </dl>
      </SectionShell>

      <div
        className={`absolute bottom-6 left-0 right-0 max-w-[1440px] mx-auto px-8 sm:px-14 flex items-center justify-between text-[11px] font-mono-tech pointer-events-none ${p.muted}`}
      >
        <span>© 2026 Kinetic Sphere</span>
        <button
          onClick={() => {
            sound.playMetallicClick();
            onScrollToSection('overview');
          }}
          className={`pointer-events-auto flex items-center gap-1.5 cursor-pointer transition-colors hover:underline ${p.body}`}
        >
          Back to top
          <ArrowUp className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
