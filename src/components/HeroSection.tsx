import React, { useEffect, useRef } from 'react';
import { Layers, Activity, Disc3 } from 'lucide-react';
import { ThemeMode } from '../types';
import gsap from 'gsap';
import { sound } from '../utils/audio';

interface HeroSectionProps {
  onExploreAnatomy: () => void;
  onOpenCustomizer: () => void;
  onNavigateToSection?: (sectionId: string) => void;
  onBounceBall: () => void;
  onSpinBall: () => void;
  explosionProgress?: number;
  onToggleConstruct?: () => void;
  themeMode?: ThemeMode;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onExploreAnatomy,
  onBounceBall,
  onSpinBall,
  explosionProgress = 0,
  onToggleConstruct,
  themeMode = 'day',
}) => {
  const heroRef = useRef<HTMLDivElement>(null);
  const isNight = themeMode === 'night';
  const isDeconstructed = explosionProgress > 0.1;

  useEffect(() => {
    const ctx = gsap.context(() => {
      // 1. Giant Kinetic Background Watermark (Scales smoothly and floats gently)
      gsap.fromTo(
        '.hero-watermark-kinetic',
        { scale: 0.94, opacity: 0 },
        { scale: 1, opacity: 1, duration: 1.6, ease: 'power3.out' }
      );
      gsap.to('.hero-watermark-kinetic', {
        y: -10,
        duration: 6,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
        delay: 1.6,
      });

      // 2. Headline & Foreground Elements Entrance
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      tl.fromTo(
        '.hero-badge',
        { y: -15, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, delay: 0.1 }
      )
        .fromTo(
          '.hero-foreground-pie',
          { scale: 0.85, opacity: 0, rotate: -20 },
          { scale: 1, opacity: 1, rotate: 0, duration: 1.2, ease: 'back.out(1.2)' },
          '-=0.4'
        )
        .fromTo(
          '.hero-action-btn',
          { y: 20, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.6, stagger: 0.1, ease: 'power2.out' },
          '-=0.4'
        );
    }, heroRef);

    return () => ctx.revert();
  }, []);

  const handleToggle = () => {
    sound.playMetallicClick();
    if (onToggleConstruct) {
      onToggleConstruct();
    } else {
      onExploreAnatomy();
    }
  };

  return (
    <section
      ref={heroRef}
      id="overview"
      className="relative w-full h-full max-w-[1440px] mx-auto flex flex-col justify-between pt-24 pb-12 px-8 sm:px-14 lg:px-20 pointer-events-none"
    >
      {/* 1. Monumental Background Text - Scaled with a calibrated SVG so the entire word KINETIC always appears 100% in full without clipping */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-0 select-none px-6 sm:px-12 overflow-hidden">
        <svg
          viewBox="0 0 1000 200"
          className={`hero-watermark-kinetic w-full max-w-4xl sm:max-w-5xl lg:max-w-6xl h-auto transition-colors duration-500 select-none ${
            isNight ? 'text-white/[0.08]' : 'text-[#121316]/[0.08]'
          }`}
          preserveAspectRatio="xMidYMid meet"
        >
          <text
            x="500"
            y="145"
            textAnchor="middle"
            fill="currentColor"
            className="font-display font-black uppercase tracking-wider"
            style={{
              fontSize: '150px',
              fontWeight: 900,
              letterSpacing: '0.06em',
            }}
          >
            KINETIC
          </text>
        </svg>
      </div>

      {/* 2. Precision Top Technical Badge */}
      <div className="relative z-10 text-center max-w-3xl mx-auto pt-2 pointer-events-auto">
        <p
          className={`hero-badge text-[11px] sm:text-xs font-mono-tech tracking-[0.3em] uppercase mb-2.5 ${
            isNight ? 'text-[#C4C6D4]' : 'text-[#555760]'
          }`}
        >
          \ FIBA REGULATION 29.5" \ NBA MATCH CALIBRATION \ 8.0 PSI NITROGEN \
        </p>
      </div>

      {/* 3. Foreground Kinetic Mass Distribution Pie Dial & Live Telemetry HUD Moved Down */}
      <div className="relative z-20 flex flex-col md:flex-row items-center justify-between gap-12 sm:gap-20 lg:gap-32 pointer-events-auto mt-auto mb-6 sm:mb-8 w-full px-2">
        {/* Left Side: Technical Core HUD Readout */}
        <div className="flex flex-col items-start gap-2.5 font-mono-tech text-xs select-none max-w-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span className={`text-[10px] tracking-[0.25em] uppercase font-bold ${
              isNight ? 'text-[#D0D2DE]' : 'text-[#3E4048]'
            }`}>
              DYNAMIC EQUILIBRIUM
            </span>
          </div>
          <span className={`text-3xl sm:text-4xl font-extrabold tracking-tight font-display ${
            isNight ? 'text-white' : 'text-[#121316]'
          }`}>
            624.5 G
          </span>
          <span className={`text-[10px] tracking-wider uppercase ${
            isNight ? 'text-[#8E90A0]' : 'text-[#656770]'
          }`}>
            ±0.5g Match Invariant Mass Calibration
          </span>
        </div>

        {/* Right Side: Foreground Layered Pie Chart Floating Crisply in the Foreground */}
        <div className="hero-foreground-pie flex items-center gap-8 select-none">
          {/* Circular SVG Pie / Donut Chart */}
          <div className="relative w-36 h-36 sm:w-40 sm:h-40 flex items-center justify-center shrink-0">
            <svg
              className="w-full h-full -rotate-90"
              viewBox="0 0 100 100"
            >
              {/* Outer track */}
              <circle
                cx="50"
                cy="50"
                r="38"
                fill="none"
                stroke={isNight ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}
                strokeWidth="8"
              />

              {/* Segment 1: Outer Composite Leather (42%) */}
              <circle
                cx="50"
                cy="50"
                r="38"
                fill="none"
                stroke="#F59E0B"
                strokeWidth="8"
                strokeDasharray="100.3 238.8"
                strokeDashoffset="0"
                strokeLinecap="round"
              />

              {/* Segment 2: Polyamide Nylon Windings (28%) */}
              <circle
                cx="50"
                cy="50"
                r="38"
                fill="none"
                stroke="#38BDF8"
                strokeWidth="8"
                strokeDasharray="66.8 238.8"
                strokeDashoffset="-105"
                strokeLinecap="round"
              />

              {/* Segment 3: Cushion Sponge Foam (18%) */}
              <circle
                cx="50"
                cy="50"
                r="38"
                fill="none"
                stroke="#34D399"
                strokeWidth="8"
                strokeDasharray="43.0 238.8"
                strokeDashoffset="-176"
                strokeLinecap="round"
              />

              {/* Segment 4: Airtight Butyl Bladder (12%) */}
              <circle
                cx="50"
                cy="50"
                r="38"
                fill="none"
                stroke="#A855F7"
                strokeWidth="8"
                strokeDasharray="28.6 238.8"
                strokeDashoffset="-223"
                strokeLinecap="round"
              />
            </svg>

            {/* Inner Center Metric */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className={`text-[10px] font-mono-tech uppercase tracking-widest ${
                isNight ? 'text-[#8E90A0]' : 'text-[#656770]'
              }`}>
                COMPOSITION
              </span>
              <span className={`text-base font-bold font-mono-tech ${
                isNight ? 'text-white' : 'text-[#121316]'
              }`}>
                100%
              </span>
            </div>
          </div>

          {/* Pie Chart Legend Breakdown (No card boxes, pure typography directly on site) */}
          <div className="flex flex-col gap-2 font-mono-tech text-[10px]">
            <div className="flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
              <span className={isNight ? 'text-white font-bold' : 'text-[#121316] font-bold'}>42%</span>
              <span className={isNight ? 'text-[#A0A2B0]' : 'text-[#555760]'}>Micro-Grain Composite</span>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full bg-sky-400 shrink-0" />
              <span className={isNight ? 'text-white font-bold' : 'text-[#121316] font-bold'}>28%</span>
              <span className={isNight ? 'text-[#A0A2B0]' : 'text-[#555760]'}>Polyamide Windings</span>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
              <span className={isNight ? 'text-white font-bold' : 'text-[#121316] font-bold'}>18%</span>
              <span className={isNight ? 'text-[#A0A2B0]' : 'text-[#555760]'}>Cushion Core Foam</span>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full bg-purple-400 shrink-0" />
              <span className={isNight ? 'text-white font-bold' : 'text-[#121316] font-bold'}>12%</span>
              <span className={isNight ? 'text-[#A0A2B0]' : 'text-[#555760]'}>Butyl Membrane</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Bottom Interactive Actions (Directly on site, solid steady state) */}
      <div className="relative z-20 flex flex-wrap items-center justify-center gap-4 pointer-events-auto">
        {/* Animated Construct / Deconstruct Action */}
        <button
          id="hero-construct-toggle-btn"
          onClick={handleToggle}
          className={`hero-action-btn flex items-center gap-2 px-6 py-2.5 rounded-full font-mono-tech text-[11px] font-bold tracking-wider uppercase transition-all cursor-pointer shadow-md active:scale-95 ${
            isDeconstructed
              ? isNight
                ? 'bg-white text-[#121316] hover:bg-neutral-200'
                : 'bg-[#121316] text-[#EDEDF2] hover:bg-[#25272E]'
              : isNight
              ? 'bg-white/15 text-white hover:bg-white/25 border border-white/25'
              : 'bg-white text-[#121316] hover:bg-neutral-100 border border-black/15'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>{isDeconstructed ? 'ASSEMBLE (WHOLE)' : 'DECONSTRUCT 3D'}</span>
        </button>

        {/* Hardwood Bounce Test */}
        <button
          id="hero-bounce-btn"
          onClick={onBounceBall}
          className={`hero-action-btn flex items-center gap-2 px-5 py-2.5 rounded-full border text-[11px] font-mono-tech font-bold tracking-wider uppercase transition-all cursor-pointer shadow-sm active:scale-95 ${
            isNight
              ? 'border-white/20 bg-white/10 hover:bg-white hover:text-[#121316] text-white'
              : 'border-black/15 bg-white/60 hover:bg-[#121316] hover:text-white text-[#121316]'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>BOUNCE TEST</span>
        </button>

        {/* 300 RPM Gyro Spin */}
        <button
          id="hero-spin-btn"
          onClick={onSpinBall}
          className={`hero-action-btn flex items-center gap-2 px-5 py-2.5 rounded-full border text-[11px] font-mono-tech font-bold tracking-wider uppercase transition-all cursor-pointer shadow-sm active:scale-95 ${
            isNight
              ? 'border-white/20 bg-white/10 hover:bg-white hover:text-[#121316] text-white'
              : 'border-black/15 bg-white/60 hover:bg-[#121316] hover:text-white text-[#121316]'
          }`}
        >
          <Disc3 className="w-3.5 h-3.5" />
          <span>300 RPM SPIN</span>
        </button>
      </div>
    </section>
  );
};
