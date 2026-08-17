import React, { useEffect, useRef } from 'react';
import { ViewSection, ThemeMode } from '../types';
import { ArrowUpRight, Sun, Moon, VolumeX, Volume2 } from 'lucide-react';
import gsap from 'gsap';
import { sound } from '../utils/audio';

interface NavigationProps {
  activeSection?: ViewSection;
  onScrollToSection: (sectionId: string) => void;
  isMuted: boolean;
  onToggleMute: () => void;
  themeMode: ThemeMode;
  onToggleTheme: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  onScrollToSection,
  isMuted,
  onToggleMute,
  themeMode,
  onToggleTheme,
}) => {
  const headerRef = useRef<HTMLElement>(null);
  const floatingActionsRef = useRef<HTMLDivElement>(null);

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

  const isNight = themeMode === 'night';

  return (
    <>
      {/* 1. The Navbar */}
      <header
        ref={headerRef}
        className={`fixed top-0 left-0 right-0 z-40 px-6 sm:px-12 py-5 transition-colors duration-300 pointer-events-none ${
          isNight ? 'text-white' : 'text-[#121316]'
        }`}
      >
        <div className="max-w-7xl mx-auto grid grid-cols-3 items-center pointer-events-auto">
          {/* Left: Brand Name Only (Removed "Original. Not for retail") */}
          <div className="flex items-center justify-start">
            <button
              id="brand-home-btn"
              onClick={() => {
                sound.playMetallicClick();
                onScrollToSection('overview');
              }}
              className="flex items-center text-left cursor-pointer group"
            >
              <span
                className={`text-sm sm:text-base font-extrabold tracking-[0.18em] uppercase transition-colors ${
                  isNight ? 'text-white' : 'text-[#121316]'
                }`}
              >
                KINETIC SPHERE ®
              </span>
            </button>
          </div>

          {/* Center: Triangle Logo Emblem */}
          <div className="flex items-center justify-center">
            <button
              id="brand-center-delta-btn"
              onClick={() => {
                sound.playMetallicClick();
                onScrollToSection('overview');
              }}
              title="Kinetic Sphere Crest"
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                isNight
                  ? 'text-white hover:bg-white/15'
                  : 'text-[#121316] hover:bg-black/5'
              }`}
            >
              <svg
                id="navbar-center-delta-glyph"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polygon points="12 2 2 22 22 22" />
              </svg>
            </button>
          </div>

          {/* Right: Day / Night Interactive Toggle */}
          <div className="flex items-center justify-end">
            <button
              id="theme-toggle-nav-btn"
              onClick={() => {
                sound.playMetallicClick();
                onToggleTheme();
              }}
              title={isNight ? 'Switch to Day Light Studio' : 'Switch to Night Arena Mode'}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all cursor-pointer text-[10px] font-mono-tech select-none backdrop-blur-md ${
                isNight
                  ? 'bg-[#1C1D24]/90 border-white/20 text-white hover:bg-[#282A34] shadow-lg shadow-black/40'
                  : 'bg-[#C8C8D0]/90 border-black/15 text-[#121316] hover:bg-[#D4D4DC] shadow-sm'
              }`}
            >
              <span className={`transition-opacity ${!isNight ? 'font-bold opacity-100 text-[#121316]' : 'opacity-60 text-white'}`}>
                DAY
              </span>
              <div
                className={`w-7 h-4 rounded-full p-0.5 flex items-center transition-colors ${
                  isNight ? 'bg-[#2E303B] border border-white/25' : 'bg-[#A4A4AC] border border-black/15'
                }`}
              >
                <div
                  className={`w-3 h-3 rounded-full transition-transform duration-300 flex items-center justify-center shadow-sm ${
                    isNight
                      ? 'translate-x-3 bg-indigo-300 text-[#121316]'
                      : 'translate-x-0 bg-[#121316] text-[#BEBEC6]'
                  }`}
                >
                  {isNight ? <Moon className="w-2 h-2" /> : <Sun className="w-2 h-2" />}
                </div>
              </div>
              <span className={`transition-opacity ${isNight ? 'font-bold opacity-100 text-indigo-300' : 'opacity-60 text-[#121316]'}`}>
                NIGHT
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Floating Action Buttons on the Body of the Website (Round by default, expands to reveal text on hover) */}
      <aside
        ref={floatingActionsRef}
        id="floating-body-actions"
        aria-label="Floating Controls"
        className="fixed bottom-6 right-6 md:right-8 z-40 flex flex-col items-end gap-3 pointer-events-auto select-none"
      >
        {/* 1. Mute / Unmute Audio Button */}
        <button
          id="body-sound-toggle-btn"
          onClick={onToggleMute}
          title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
          className={`group flex items-center justify-center h-11 px-3.5 rounded-full border backdrop-blur-md shadow-lg transition-all duration-300 ease-out cursor-pointer overflow-hidden ${
            isNight
              ? 'bg-[#1C1D24]/90 border-white/20 text-white hover:bg-[#282A34] shadow-black/50 hover:border-white/40'
              : 'bg-[#EDEDF2]/90 border-black/15 text-[#121316] hover:bg-white shadow-black/10 hover:border-black/30'
          }`}
        >
          {/* Sound Icon / Audio Wave */}
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

          {/* Text revealed on hover */}
          <span className="max-w-0 opacity-0 group-hover:max-w-32 group-hover:opacity-100 group-hover:ml-2.5 transition-all duration-300 ease-out overflow-hidden whitespace-nowrap font-mono-tech text-[10px] font-bold tracking-widest uppercase">
            {isMuted ? 'UNMUTE' : 'MUTE'}
          </span>
        </button>

        {/* 2. Reserve Button */}
        <button
          id="body-reserve-btn"
          onClick={() => {
            sound.playMetallicClick();
            onScrollToSection('bespoke');
          }}
          title="Reserve Edition"
          className={`group flex items-center justify-center h-11 px-3.5 rounded-full border backdrop-blur-md shadow-lg transition-all duration-300 ease-out cursor-pointer overflow-hidden ${
            isNight
              ? 'bg-white border-white text-[#121316] hover:bg-neutral-200 shadow-white/10'
              : 'bg-[#121316] border-[#121316] text-[#BEBEC6] hover:bg-[#25272E] hover:text-white shadow-black/20'
          }`}
        >
          {/* Reserve Icon */}
          <div className="flex items-center justify-center shrink-0 w-4 h-4">
            <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
          </div>

          {/* Text revealed on hover */}
          <span className="max-w-0 opacity-0 group-hover:max-w-32 group-hover:opacity-100 group-hover:ml-2.5 transition-all duration-300 ease-out overflow-hidden whitespace-nowrap font-mono-tech text-[10px] font-bold tracking-widest uppercase">
            RESERVE
          </span>
        </button>
      </aside>
    </>
  );
};
