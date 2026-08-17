import React, { useEffect, useRef } from 'react';
import { BallConfig } from '../types';
import { Eye, SunMedium, Target, Droplets } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { sound } from '../utils/audio';

gsap.registerPlugin(ScrollTrigger);

interface MacroGrainSectionProps {
  config: BallConfig;
  onUpdateConfig: (updated: Partial<BallConfig>) => void;
  macroLightAngle: number;
  onMacroLightAngleChange: (angle: number) => void;
}

export const MacroGrainSection: React.FC<MacroGrainSectionProps> = ({
  config,
  onUpdateConfig,
  macroLightAngle,
  onMacroLightAngleChange,
}) => {
  const sectionRef = useRef<HTMLDivElement>(null);

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
      )
        .fromTo(
          '.macro-slider-card',
          { scale: 0.95, opacity: 0, y: 20 },
          { scale: 1, opacity: 1, y: 0, duration: 0.7, ease: 'power2.out' },
          '-=0.4'
        )
        .fromTo(
          '.macro-metric-card',
          { y: 35, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.6, stagger: 0.1, ease: 'power3.out' },
          '-=0.5'
        );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="macro"
      className="relative w-full min-h-screen flex flex-col lg:flex-row lg:items-start justify-between gap-10 pt-28 pb-20 px-6 sm:px-12 pointer-events-none"
    >
      {/* Header & Concept */}
      <div className="macro-header max-w-xl pointer-events-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/40 border border-black/10 backdrop-blur-md mb-5">
          <Eye className="w-3.5 h-3.5 text-[#121316]" />
          <span className="font-mono-tech text-[10px] text-[#121316] tracking-[0.25em] font-semibold uppercase">
            03 // 10X MACRO INSPECTION
          </span>
        </div>

        <h2 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-[#121316] leading-none mb-3 font-display">
          GRIP & <br />
          MICRO-GRAIN
        </h2>

        <p className="text-[#555760] text-xs sm:text-sm leading-relaxed max-w-md font-mono-tech mb-6">
          High-magnification surface topography analysis. Shifting directional lighting reveals individual pebble domes, recessed composite seams, and moisture-dissipating micro-pores.
        </p>

        {/* Dynamic Light Sweep Orbital Controller */}
        <div className="macro-slider-card p-5 rounded-xl bg-white/45 backdrop-blur-md border border-black/10 max-w-md mb-6 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <SunMedium className="w-4 h-4 text-[#121316]" />
              <span className="font-mono-tech text-[11px] font-bold text-[#121316] uppercase tracking-[0.2em]">
                LIGHT ORBIT ANGLE
              </span>
            </div>
            <span className="font-mono-tech text-xs text-[#121316] font-bold">
              {macroLightAngle}°
            </span>
          </div>

          <input
            id="macro-light-slider"
            type="range"
            min="0"
            max="360"
            step="1"
            value={macroLightAngle}
            onChange={(e) => onMacroLightAngleChange(parseInt(e.target.value))}
            className="w-full h-1.5 bg-[#C2C2C8] rounded-lg appearance-none cursor-pointer accent-[#121316]"
          />

          <div className="flex items-center justify-between mt-3 pt-2 border-t border-black/10 text-[10px] font-mono-tech text-[#787A84] uppercase">
            <span>RAKING (0°)</span>
            <span>TOP (90°)</span>
            <span>OBLIQUE (180°)</span>
            <span>BACK (270°)</span>
          </div>
        </div>
      </div>

      {/* Surface Metric Cards */}
      <div className="w-full lg:max-w-md lg:ml-auto space-y-4 pointer-events-auto">
        <div className="macro-metric-card p-5 rounded-xl bg-white/45 backdrop-blur-md border border-black/10 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <span className="font-mono-tech text-[10px] uppercase text-[#787A84] tracking-[0.2em] font-semibold">
              TACTILE PEBBLE DENSITY
            </span>
            <span className="font-mono-tech text-[10px] text-[#121316] font-bold">
              {config.gripDensity.toUpperCase()} SPEC
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'fiba', label: 'FIBA TOUR', pebbles: '18.4K', depth: 0.85 },
              { id: 'nba', label: 'NBA SPEC', pebbles: '19.2K', depth: 0.95 },
              { id: 'custom', label: 'ULTRA GRIP', pebbles: '21.0K', depth: 1.1 },
            ].map((preset) => (
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
                className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                  config.gripDensity === preset.id
                    ? 'bg-[#121316] text-[#BEBEC6] border-[#121316] shadow-sm scale-[1.02]'
                    : 'bg-white/40 text-[#555760] border-black/10 hover:border-black/30'
                }`}
              >
                <span className="block font-mono-tech text-[9px] font-bold tracking-wider uppercase mb-1">
                  {preset.label}
                </span>
                <span className="block font-mono-tech text-xs font-extrabold">
                  {preset.pebbles}
                </span>
              </button>
            ))}
          </div>

          <div className="p-3.5 rounded-lg bg-black/5 border border-black/5 space-y-2 text-xs font-mono-tech">
            <div className="flex justify-between text-[#555760]">
              <span>MICRO-CHANNEL DEPTH</span>
              <span className="font-bold text-[#121316]">1.20 MM RECESSED</span>
            </div>
            <div className="flex justify-between text-[#555760]">
              <span>HYDROPHOBIC EVAP RATE</span>
              <span className="font-bold text-[#121316]">0.08 SEC / CM²</span>
            </div>
            <div className="flex justify-between text-[#555760]">
              <span>PEBBLE DIAMETER</span>
              <span className="font-bold text-[#121316]">0.75 MM CONVEX</span>
            </div>
          </div>
        </div>

        {/* Tactile Highlights Card */}
        <div className="macro-metric-card grid grid-cols-2 gap-3">
          <div className="p-4 rounded-xl bg-white/45 backdrop-blur-md border border-black/10 shadow-sm flex items-start gap-3">
            <Target className="w-4 h-4 text-[#121316] mt-0.5" />
            <div>
              <span className="block font-mono-tech text-[9px] uppercase text-[#787A84] font-semibold">
                SEAM ALIGNMENT
              </span>
              <span className="font-mono-tech text-xs font-bold text-[#121316]">
                ±0.05mm CNC
              </span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white/45 backdrop-blur-md border border-black/10 shadow-sm flex items-start gap-3">
            <Droplets className="w-4 h-4 text-[#121316] mt-0.5" />
            <div>
              <span className="block font-mono-tech text-[9px] uppercase text-[#787A84] font-semibold">
                SWEAT RESISTANCE
              </span>
              <span className="font-mono-tech text-xs font-bold text-[#121316]">
                ISO 4920: 100
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
