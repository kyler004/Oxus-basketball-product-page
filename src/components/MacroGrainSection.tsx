import React, { useEffect, useRef } from 'react';
import { BallConfig, ThemeMode } from '../types';
import { Eye } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { sound } from '../utils/audio';

gsap.registerPlugin(ScrollTrigger);

interface MacroGrainSectionProps {
  config: BallConfig;
  onUpdateConfig: (updated: Partial<BallConfig>) => void;
  macroLightAngle?: number;
  onMacroLightAngleChange?: (angle: number) => void;
  themeMode?: ThemeMode;
}

export const MacroGrainSection: React.FC<MacroGrainSectionProps> = ({
  config,
  onUpdateConfig,
  themeMode = 'day',
}) => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const isNight = themeMode === 'night';

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 75%',
          toggleActions: 'play none none none',
        },
      });

      tl.fromTo(
        '.macro-header > *',
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, stagger: 0.12, ease: 'power3.out' }
      ).fromTo(
        '.macro-data-item',
        { y: 25, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, stagger: 0.08, ease: 'power2.out' },
        '-=0.4'
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const presets = [
    { id: 'fiba', label: 'FIBA TOUR SPEC', pebbles: '18,400 PEBBLES', depth: 0.85 },
    { id: 'nba', label: 'NBA MATCH SPEC', pebbles: '19,200 PEBBLES', depth: 0.95 },
    { id: 'custom', label: 'ULTRA TACTILE', pebbles: '21,000 PEBBLES', depth: 1.1 },
  ];

  return (
    <section
      ref={sectionRef}
      id="macro"
      className="relative w-full max-w-[1440px] mx-auto flex flex-col lg:flex-row lg:items-center justify-between gap-16 lg:gap-28 xl:gap-36 px-8 sm:px-14 lg:px-20 pointer-events-none"
    >
      {/* 1. Header & Technical Concept (Directly on site) */}
      <div className="macro-header max-w-lg pointer-events-auto">
        <div className="inline-flex items-center gap-2 mb-3">
          <Eye className="w-4 h-4 text-sky-400" />
          <span className={`font-mono-tech text-[10px] tracking-[0.25em] font-bold uppercase ${
            isNight ? 'text-sky-400' : 'text-sky-700'
          }`}>
            03 // 10X TOPOGRAPHIC GRAIN
          </span>
        </div>

        <h2 className={`text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-none mb-4 font-display ${
          isNight ? 'text-white' : 'text-[#121316]'
        }`}>
          GRIP & <br />
          MICRO-GRAIN
        </h2>

        <p className={`text-xs sm:text-sm leading-relaxed max-w-md font-mono-tech mb-6 ${
          isNight ? 'text-[#D0D2DE]' : 'text-[#444650]'
        }`}>
          Laser-sculpted pebble geometry engineered for optimal kinetic friction. Thousands of micro-domes and recessed capillary channels immediately wick perspiration to prevent ball slippage under high-torque releases.
        </p>

        {/* Live Surface Spec Breakdown directly on site (No card) */}
        <div className="flex items-center gap-6 pt-2 border-t border-black/10 dark:border-white/10 font-mono-tech text-xs">
          <div className="flex flex-col">
            <span className={`text-[9px] uppercase tracking-wider ${
              isNight ? 'text-[#8E90A0]' : 'text-[#656770]'
            }`}>
              FRICTION COEFF
            </span>
            <span className={`text-base font-bold text-sky-400`}>
              0.88 μ TACTILE
            </span>
          </div>

          <div className="w-[1px] h-8 bg-black/10 dark:bg-white/10" />

          <div className="flex flex-col">
            <span className={`text-[9px] uppercase tracking-wider ${
              isNight ? 'text-[#8E90A0]' : 'text-[#656770]'
            }`}>
              CHANNEL DEPTH
            </span>
            <span className={`text-base font-bold ${isNight ? 'text-white' : 'text-[#121316]'}`}>
              1.20 MM RECESSED
            </span>
          </div>

          <div className="w-[1px] h-8 bg-black/10 dark:bg-white/10" />

          <div className="flex flex-col">
            <span className={`text-[9px] uppercase tracking-wider ${
              isNight ? 'text-[#8E90A0]' : 'text-[#656770]'
            }`}>
              EVAP SPEED
            </span>
            <span className={`text-base font-bold text-emerald-400`}>
              0.08 S / CM²
            </span>
          </div>
        </div>
      </div>

      {/* 2. Micro-Grain Density Presets & Metrics Presented Directly on Site with Enlarged Spacing */}
      <div className="w-full lg:max-w-lg lg:ml-auto pointer-events-auto font-mono-tech select-none space-y-6">
        <div className="flex items-center justify-between pb-2 border-b border-black/10 dark:border-white/10">
          <span className={`text-[11px] font-bold uppercase tracking-[0.25em] ${
            isNight ? 'text-[#C4C6D4]' : 'text-[#444650]'
          }`}>
            PEBBLE DENSITY CONFIGURATION
          </span>
          <span className={`text-[10px] font-bold uppercase ${
            isNight ? 'text-white' : 'text-[#121316]'
          }`}>
            CURRENT // {config.gripDensity.toUpperCase()}
          </span>
        </div>

        {/* Presets List directly on site without card borders */}
        <div className="flex flex-col gap-2.5">
          {presets.map((preset) => {
            const isSelected = config.gripDensity === preset.id;
            return (
              <button
                key={preset.id}
                id={`grip-preset-${preset.id}`}
                onClick={() => {
                  sound.playMetallicClick();
                  onUpdateConfig({
                    gripDensity: preset.id as any,
                    pebbleDepth: preset.depth,
                  });
                }}
                className={`macro-data-item group flex items-center justify-between p-3 transition-all cursor-pointer text-left border-b ${
                  isSelected
                    ? isNight
                      ? 'border-white text-white font-bold pl-4 bg-white/5'
                      : 'border-[#121316] text-[#121316] font-bold pl-4 bg-black/5'
                    : isNight
                    ? 'border-white/10 text-white/70 hover:text-white hover:border-white/30'
                    : 'border-black/10 text-[#121316]/70 hover:text-[#121316] hover:border-black/30'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    isSelected ? 'bg-sky-400' : 'bg-transparent border border-current'
                  }`} />
                  <span className="text-xs uppercase tracking-wider">
                    {preset.label}
                  </span>
                </div>

                <span className={`text-xs font-bold ${
                  isSelected ? (isNight ? 'text-sky-300' : 'text-sky-700') : 'opacity-60'
                }`}>
                  {preset.pebbles}
                </span>
              </button>
            );
          })}
        </div>

        {/* Micro-Grain Geometric Readout Footnote directly on site */}
        <div className="macro-data-item grid grid-cols-2 gap-8 pt-2">
          <div className="flex flex-col">
            <span className={`text-[9px] uppercase tracking-widest ${
              isNight ? 'text-[#8E90A0]' : 'text-[#656770]'
            }`}>
              PEBBLE DIAMETER
            </span>
            <span className={`text-xl font-bold font-display ${isNight ? 'text-white' : 'text-[#121316]'}`}>
              0.75 MM CONVEX
            </span>
          </div>

          <div className="flex flex-col">
            <span className={`text-[9px] uppercase tracking-widest ${
              isNight ? 'text-[#8E90A0]' : 'text-[#656770]'
            }`}>
              SURFACE HYDROPHOBIA
            </span>
            <span className="text-xl font-bold font-display text-emerald-400">
              CLASS 1 REPELLENT
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
