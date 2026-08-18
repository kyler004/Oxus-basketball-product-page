import React, { useEffect, useRef } from 'react';
import { ViewSection, ThemeMode } from '../types';
import { Sun, Moon, VolumeX, ArrowUpRight } from 'lucide-react';
import gsap from 'gsap';
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
  const headerRef = useRef<HTMLElement>(null);
  const floatingActionsRef = useRef<HTMLDivElement>(null);
  const isNight = themeMode === 'night';

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        headerRef.current,
        { y: -30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out', delay: 0.1 }
      );
      if (floatingActionsRef.current) {
        gsap.fromTo(
          floatingActionsRef.current,
          { y: 30, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out', delay: 0.3 }
        );
      }
    }, [headerRef, floatingActionsRef]);

    return () => ctx.revert();
  }, []);

  return (
    <>
      {/* Primary Top Header Navigation (No cards, pure typography and minimalist icons) */}
      <header
        ref={headerRef}
        id="main-top-navigation"
        className={`fixed top-0 left-0 right-0 z-40 px-8 sm:px-14 lg:px-20 py-5 transition-colors duration-300 pointer-events-none select-none ${
          isNight ? 'text-white' : 'text-[#121316]'
        }`}
      >
        <div className="max-w-[1440px] mx-auto flex items-center justify-between pointer-events-auto">
          {/* Left: Brand Home Button */}
          <button
            id="brand-home-btn"
            onClick={() => {
              sound.playMetallicClick();
              onScrollToSection('overview');
            }}
            className="flex items-center gap-3 text-left cursor-pointer group"
          >
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-all ${
                isNight
                  ? 'bg-white/10 border-white/20 text-white group-hover:bg-white group-hover:text-[#121316]'
                  : 'bg-black/5 border-black/15 text-[#121316] group-hover:bg-[#121316] group-hover:text-white'
              }`}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polygon points="12 2 2 22 22 22" />
              </svg>
            </div>
            <span className="font-extrabold text-sm sm:text-base tracking-[0.18em] uppercase">
              KINETIC SPHERE ®
            </span>
          </button>

          {/* Center: Navigation Section Links (Directly on site) */}
          <nav aria-label="Sections" className="hidden md:flex items-center gap-8 font-mono-tech text-xs">
            {sections.map((item, idx) => {
              const isActive = activeSectionIndex === idx;
              return (
                <button
                  key={item.id}
                  id={`nav-link-${item.id}`}
                  onClick={() => onSelectSectionIndex(idx)}
                  className={`transition-all duration-200 cursor-pointer flex items-center gap-2 pb-1 border-b ${
                    isActive
                      ? isNight
                        ? 'border-white text-white font-bold'
                        : 'border-[#121316] text-[#121316] font-bold'
                      : isNight
                      ? 'border-transparent text-white/60 hover:text-white hover:border-white/40'
                      : 'border-transparent text-[#121316]/60 hover:text-[#121316] hover:border-black/40'
                  }`}
                >
                  <span className="text-[10px] opacity-50">{item.num}</span>
                  <span className="tracking-wider uppercase">{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right: Day / Night Switcher */}
          <div className="flex items-center gap-3">
            <button
              id="theme-toggle-nav-btn"
              onClick={() => {
                sound.playMetallicClick();
                onToggleTheme();
              }}
              title={isNight ? 'Switch to Day Light Studio' : 'Switch to Night Arena Mode'}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full border transition-all cursor-pointer text-[10px] font-mono-tech select-none backdrop-blur-md ${
                isNight
                  ? 'bg-[#1C1D24]/90 border-white/20 text-white hover:bg-[#282A34]'
                  : 'bg-[#C8C8D0]/90 border-black/15 text-[#121316] hover:bg-[#D4D4DC]'
              }`}
            >
              <span className={!isNight ? 'font-bold' : 'opacity-60'}>DAY</span>
              <div
                className={`w-6 h-3.5 rounded-full p-0.5 flex items-center transition-colors ${
                  isNight ? 'bg-[#2E303B]' : 'bg-[#A4A4AC]'
                }`}
              >
                <div
                  className={`w-2.5 h-2.5 rounded-full transition-transform duration-300 flex items-center justify-center ${
                    isNight ? 'translate-x-2.5 bg-indigo-300 text-[#121316]' : 'translate-x-0 bg-[#121316] text-white'
                  }`}
                >
                  {isNight ? <Moon className="w-1.5 h-1.5" /> : <Sun className="w-1.5 h-1.5" />}
                </div>
              </div>
              <span className={isNight ? 'font-bold text-indigo-300' : 'opacity-60'}>NIGHT</span>
            </button>
          </div>
        </div>
      </header>

      {/* Floating Action Controls on Bottom Right (Minimalist circular pills) */}
      <aside
        ref={floatingActionsRef}
        id="floating-body-actions"
        aria-label="Floating Controls"
        className="fixed bottom-6 right-6 md:right-8 z-40 flex flex-col items-end gap-3 pointer-events-auto select-none"
      >
        {/* 1. Mute / Unmute Audio */}
        <button
          id="body-sound-toggle-btn"
          onClick={onToggleMute}
          title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
          className={`group flex items-center justify-center h-10 px-3.5 rounded-full border backdrop-blur-md transition-all duration-300 cursor-pointer overflow-hidden ${
            isNight
              ? 'bg-[#1C1D24]/90 border-white/20 text-white hover:bg-[#282A34]'
              : 'bg-[#EDEDF2]/90 border-black/15 text-[#121316] hover:bg-white'
          }`}
        >
          <div className="flex items-center justify-center shrink-0 w-4 h-4">
            {isMuted ? (
              <VolumeX className="w-4 h-4 text-current" />
            ) : (
              <div className="flex items-end gap-[2px] h-3.5 w-3.5">
                <span className="w-[2px] bg-current rounded-xs eq-bar-1" />
                <span className="w-[2px] bg-current rounded-xs eq-bar-2" />
                <span className="w-[2px] bg-current rounded-xs eq-bar-3" />
                <span className="w-[2px] bg-current rounded-xs eq-bar-4" />
              </div>
            )}
          </div>
          <span className="max-w-0 opacity-0 group-hover:max-w-32 group-hover:opacity-100 group-hover:ml-2.5 transition-all duration-300 ease-out overflow-hidden whitespace-nowrap font-mono-tech text-[10px] font-bold tracking-widest uppercase">
            {isMuted ? 'UNMUTE' : 'MUTE'}
          </span>
        </button>

        {/* 2. Reserve Modal Trigger Button */}
        <button
          id="body-reserve-btn"
          onClick={() => {
            sound.playMetallicClick();
            onOpenReserveModal();
          }}
          title="Reserve Bespoke Edition"
          className={`group flex items-center justify-center h-10 px-3.5 rounded-full border backdrop-blur-md transition-all duration-300 cursor-pointer overflow-hidden ${
            isNight
              ? 'bg-white border-white text-[#121316] hover:bg-neutral-200'
              : 'bg-[#121316] border-[#121316] text-[#BEBEC6] hover:bg-[#25272E] hover:text-white'
          }`}
        >
          <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
          <span className="max-w-0 opacity-0 group-hover:max-w-32 group-hover:opacity-100 group-hover:ml-2.5 transition-all duration-300 ease-out overflow-hidden whitespace-nowrap font-mono-tech text-[10px] font-bold tracking-widest uppercase">
            RESERVE
          </span>
        </button>
      </aside>
    </>
  );
};
