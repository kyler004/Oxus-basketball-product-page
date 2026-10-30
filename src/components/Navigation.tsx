import React from 'react';
import { ViewSection, ThemeMode } from '../types';
import { Sun, Moon, Volume2, VolumeX } from 'lucide-react';
import { palette } from '../utils/theme';
import { sound } from '../utils/audio';

export interface NavSectionItem {
  id: string;
  section: ViewSection;
  label: string;
  shortLabel: string;
  num: string;
}

interface NavigationProps {
  sections: NavSectionItem[];
  activeSectionIndex: number;
  onSelectSectionIndex: (index: number) => void;
  onScrollToSection: (sectionId: string) => void;
  isMuted: boolean;
  onToggleMute: () => void;
  themeMode: ThemeMode;
  onToggleTheme: () => void;
  onOpenReserveModal: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  sections,
  activeSectionIndex,
  onSelectSectionIndex,
  onScrollToSection,
  isMuted,
  onToggleMute,
  themeMode,
  onToggleTheme,
  onOpenReserveModal,
}) => {
  const isNight = themeMode === 'night';
  const p = palette(isNight);

  const iconBtn = `w-9 h-9 flex items-center justify-center rounded-full cursor-pointer transition-colors ${
    isNight ? 'hover:bg-white/10' : 'hover:bg-black/[0.06]'
  }`;

  return (
    <header
      id="main-top-navigation"
      className={`fixed top-0 left-0 right-0 z-40 px-8 sm:px-14 py-5 pointer-events-none select-none ${p.heading}`}
    >
      <div className="max-w-[1440px] mx-auto flex items-center justify-between gap-6 pointer-events-auto">
        <button
          id="brand-home-btn"
          onClick={() => {
            sound.playMetallicClick();
            onScrollToSection('overview');
          }}
          className="font-extrabold text-sm tracking-[0.2em] uppercase cursor-pointer"
        >
          Kinetic Sphere
        </button>

        <nav
          aria-label="Sections"
          className="hidden md:flex items-center gap-7 font-mono-tech text-xs"
        >
          {sections.map((item, idx) => {
            const isActive = activeSectionIndex === idx;
            const activeStyle = `${p.heading} font-bold ${
              isNight ? 'border-[#F28C3E]' : 'border-[#B8480A]'
            }`;
            const idleStyle = `${p.muted} border-transparent ${
              isNight ? 'hover:text-white' : 'hover:text-[#1A1714]'
            }`;
            return (
              <button
                key={item.id}
                id={`nav-link-${item.id}`}
                onClick={() => onSelectSectionIndex(idx)}
                aria-current={isActive ? 'true' : undefined}
                className={`cursor-pointer pb-1 border-b-2 uppercase tracking-wider transition-colors ${
                  isActive ? activeStyle : idleStyle
                }`}
              >
                {item.shortLabel}
              </button>
            );
          })}
        </nav>

        <div className="flex items-center gap-1">
          <button
            id="body-sound-toggle-btn"
            onClick={onToggleMute}
            aria-label={isMuted ? 'Unmute sound' : 'Mute sound'}
            className={iconBtn}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
          <button
            id="theme-toggle-nav-btn"
            onClick={() => {
              sound.playMetallicClick();
              onToggleTheme();
            }}
            aria-label={isNight ? 'Switch to light theme' : 'Switch to dark theme'}
            className={iconBtn}
          >
            {isNight ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <button
            id="body-reserve-btn"
            onClick={() => {
              sound.playMetallicClick();
              onOpenReserveModal();
            }}
            className={`ml-3 px-5 py-2 rounded-full text-[11px] font-bold tracking-wider uppercase cursor-pointer transition-colors ${p.accentBg}`}
          >
            Reserve
          </button>
        </div>
      </div>
    </header>
  );
};
