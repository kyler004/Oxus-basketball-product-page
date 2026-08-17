import React, { useEffect, useRef } from 'react';
import { BallConfig, BallEdition } from '../types';
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
}

export const CustomizerStudio: React.FC<CustomizerStudioProps> = ({
  config,
  onUpdateConfig,
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
        '.studio-header > *',
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, stagger: 0.12, ease: 'power3.out' }
      ).fromTo(
        '.studio-edition-card',
        { x: 30, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.6, stagger: 0.1, ease: 'power3.out' },
        '-=0.4'
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  // Editions list with authentic basketball leather finishes
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
      description: 'Original cured regulation composite with high-friction moisture-wicking micro-pores and signature hardwood amber clay tone.',
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
      className="relative w-full min-h-screen flex flex-col lg:flex-row lg:items-start justify-between gap-10 pt-28 pb-20 px-6 sm:px-12 pointer-events-none"
    >
      {/* Studio Presentation Header */}
      <div className="studio-header max-w-xl pointer-events-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/40 border border-black/10 backdrop-blur-md mb-5">
          <Sparkles className="w-3.5 h-3.5 text-[#121316]" />
          <span className="font-mono-tech text-[10px] text-[#121316] tracking-[0.25em] font-semibold uppercase">
            05 // BESPOKE LAB EDITIONS
          </span>
        </div>

        <h2 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-[#121316] leading-none mb-3 font-display">
          BESPOKE <br />
          LAB SPEC
        </h2>

        <p className="text-[#555760] text-xs sm:text-sm leading-relaxed max-w-md font-mono-tech mb-6">
          Curated regulation sphere series. Hand-cured leather finishes, precision metallic seam inlays, and hot-stamp laser serial monograms engineered for professional court kinematics.
        </p>

        <div className="p-4 rounded-xl bg-white/40 border border-black/10 max-w-md space-y-2 font-mono-tech text-xs">
          <div className="flex items-center gap-2 text-emerald-800 text-[11px] font-semibold">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>FIBA & NBA Official Calibration Certification</span>
          </div>
          <p className="text-[10px] text-[#555760] leading-relaxed">
            Each spherical unit is individually laser-scanned for dynamic mass symmetry and inflated with 8.0 PSI pure nitrogen.
          </p>
        </div>
      </div>

      {/* Bespoke Editions Showcase (Right side) */}
      <div className="w-full lg:max-w-lg lg:ml-auto space-y-2.5 pointer-events-auto">
        <div className="flex items-center justify-between px-1 mb-1">
          <span className="font-mono-tech text-[10px] uppercase text-[#787A84] tracking-[0.2em] font-semibold">
            SELECT PRESENTATION FINISH ({editions.length} EDITIONS)
          </span>
        </div>

        {editions.map((ed) => {
          const isSelected = config.edition === ed.id;
          return (
            <div
              key={ed.id}
              id={`edition-item-${ed.id}`}
              onClick={() => handleSelectEdition(ed)}
              className={`studio-edition-card p-4 rounded-xl border flex items-center justify-between gap-3 transition-all duration-200 cursor-pointer ${
                isSelected
                  ? 'bg-white/70 border-[#121316] shadow-md scale-[1.01]'
                  : 'bg-white/35 hover:bg-white/50 border-black/10'
              }`}
            >
              <div className="flex items-center gap-3.5">
                <div
                  className="w-9 h-9 rounded-full border border-black/15 shadow-sm shrink-0"
                  style={{
                    background: `linear-gradient(135deg, ${ed.leatherColor}, ${ed.secondaryColor})`,
                  }}
                />
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-[#121316]">
                    {ed.name}
                  </h4>
                  <p className="text-[11px] text-[#555760] font-mono-tech line-clamp-1 max-w-[240px]">
                    {ed.description}
                  </p>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="px-2 py-0.5 rounded bg-black/5 text-[9px] font-mono-tech text-[#121316] font-bold border border-black/5">
                  {ed.serial}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
