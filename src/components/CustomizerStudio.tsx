import React, { useEffect, useRef } from 'react';
import { BallConfig, BallEdition, ThemeMode } from '../types';
import { Sparkles, ShieldCheck } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { sound } from '../utils/audio';

gsap.registerPlugin(ScrollTrigger);

interface CustomizerStudioProps {
  config: BallConfig;
  onUpdateConfig: (updated: Partial<BallConfig>) => void;
  onCaptureSnapshot?: () => void;
  snapshotDataUrl?: string | null;
  onCloseSnapshotModal?: () => void;
  themeMode?: ThemeMode;
}

export const CustomizerStudio: React.FC<CustomizerStudioProps> = ({
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
        '.studio-header > *',
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, stagger: 0.12, ease: 'power3.out' }
      ).fromTo(
        '.studio-edition-row',
        { x: 30, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.6, stagger: 0.08, ease: 'power3.out' },
        '-=0.4'
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const editions: {
    id: BallEdition;
    name: string;
    leatherColor: string;
    secondaryColor: string;
    description: string;
    seamColor: string;
    seamMetalness: number;
    serial: string;
  }[] = [
    {
      id: 'heritage',
      name: 'Heritage Amber Clay',
      leatherColor: '#D45B10',
      secondaryColor: '#94380E',
      description: 'Original cured regulation composite with high-friction micro-pores and classic hardwood amber tone.',
      seamColor: '#121316',
      seamMetalness: 0.1,
      serial: 'ED-01 / 500',
    },
    {
      id: 'stealth',
      name: 'Night Stealth Obsidian',
      leatherColor: '#1E1F24',
      secondaryColor: '#121316',
      description: 'Triple-black tactical stealth finish with low-reflection matte pebble grain.',
      seamColor: '#0A0A0C',
      seamMetalness: 0.1,
      serial: 'ED-02 / 500',
    },
    {
      id: 'eclipse',
      name: 'Coyote Gold Horizon',
      leatherColor: '#968770',
      secondaryColor: '#6B5E4B',
      description: 'Tactical coyote bronze composite with 24K mirror foil channels.',
      seamColor: '#C4A478',
      seamMetalness: 0.9,
      serial: 'ED-03 / 500',
    },
    {
      id: 'monolith',
      name: 'Camo Sage Drab',
      leatherColor: '#4E5B4E',
      secondaryColor: '#364036',
      description: 'Tactical olive-drab matte composite with non-slip low-reflection grip topography.',
      seamColor: '#121316',
      seamMetalness: 0.1,
      serial: 'ED-04 / 500',
    },
    {
      id: 'olympus',
      name: 'Olympus Concrete Ivory',
      leatherColor: '#E2E4E8',
      secondaryColor: '#C0C4CC',
      description: 'Pure exhibition ivory finish accented with titanium monogramming.',
      seamColor: '#121316',
      seamMetalness: 0.4,
      serial: 'ED-05 / 500',
    },
  ];

  const handleSelectEdition = (edition: typeof editions[0]) => {
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
    <section
      ref={sectionRef}
      id="bespoke"
      className="relative w-full max-w-[1440px] mx-auto flex flex-col lg:flex-row lg:items-center justify-between gap-16 lg:gap-28 xl:gap-36 px-8 sm:px-14 lg:px-20 pointer-events-none"
    >
      {/* 1. Studio Header (Directly on site) */}
      <div className="studio-header max-w-lg pointer-events-auto">
        <div className="inline-flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-purple-400" />
          <span className={`font-mono-tech text-[10px] tracking-[0.25em] font-bold uppercase ${
            isNight ? 'text-purple-300' : 'text-purple-700'
          }`}>
            05 // BESPOKE LAB CALIBRATION
          </span>
        </div>

        <h2 className={`text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-none mb-4 font-display ${
          isNight ? 'text-white' : 'text-[#121316]'
        }`}>
          BESPOKE <br />
          LAB SPEC
        </h2>

        <p className={`text-xs sm:text-sm leading-relaxed max-w-md font-mono-tech mb-6 ${
          isNight ? 'text-[#D0D2DE]' : 'text-[#444650]'
        }`}>
          Curated regulation sphere series. Hand-cured leather finishes, precision metallic seam inlays, and hot-stamp laser serial monograms engineered for professional court kinematics.
        </p>

        {/* Certification Note directly on site (No card) */}
        <div className="flex items-center gap-2 pt-2 border-t border-black/10 dark:border-white/10 text-emerald-400 font-mono-tech text-xs">
          <ShieldCheck className="w-4 h-4 shrink-0" />
          <span>FIBA & NBA Official Calibration Certification // 8.0 PSI Pure Nitrogen</span>
        </div>
      </div>

      {/* 2. Editions List Presented Directly on Site with Enlarged Spacing */}
      <div className="w-full lg:max-w-lg lg:ml-auto pointer-events-auto font-mono-tech select-none space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-black/10 dark:border-white/10">
          <span className={`text-[11px] font-bold uppercase tracking-[0.25em] ${
            isNight ? 'text-[#C4C6D4]' : 'text-[#444650]'
          }`}>
            FINISH EDITIONS ({editions.length})
          </span>
          <span className={`text-[10px] font-bold uppercase ${
            isNight ? 'text-white' : 'text-[#121316]'
          }`}>
            ACTIVE // {config.leatherName}
          </span>
        </div>

        {/* Edition Rows */}
        <div className="flex flex-col gap-2">
          {editions.map((ed) => {
            const isSelected = config.edition === ed.id;
            return (
              <div
                key={ed.id}
                id={`edition-row-${ed.id}`}
                onClick={() => handleSelectEdition(ed)}
                className={`studio-edition-row group flex items-center justify-between gap-4 p-3 transition-all duration-200 cursor-pointer border-b ${
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
                  <div
                    className="w-6 h-6 rounded-full border border-black/20 shrink-0 shadow-sm"
                    style={{
                      background: `linear-gradient(135deg, ${ed.leatherColor}, ${ed.secondaryColor})`,
                    }}
                  />
                  <div>
                    <h4 className="text-xs uppercase tracking-wider">
                      {ed.name}
                    </h4>
                    <p className={`text-[9px] line-clamp-1 max-w-[280px] ${
                      isNight ? 'text-[#8E90A0]' : 'text-[#656770]'
                    }`}>
                      {ed.description}
                    </p>
                  </div>
                </div>

                <span className={`text-[10px] font-bold px-2 py-0.5 rounded shrink-0 ${
                  isSelected
                    ? isNight ? 'bg-white text-[#121316]' : 'bg-[#121316] text-white'
                    : isNight ? 'bg-white/10 text-white' : 'bg-black/5 text-[#121316]'
                }`}>
                  {ed.serial}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
