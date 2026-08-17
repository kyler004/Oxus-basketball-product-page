import React, { useEffect, useRef } from 'react';
import { Bookmark, ShoppingBag, Activity, Disc3, ChevronDown } from 'lucide-react';
import { ThemeMode } from '../types';
import gsap from 'gsap';
import { sound } from '../utils/audio';

interface HeroSectionProps {
  onExploreAnatomy: () => void;
  onOpenCustomizer: () => void;
  onBounceBall: () => void;
  onSpinBall: () => void;
  themeMode?: ThemeMode;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onExploreAnatomy,
  onOpenCustomizer,
  onBounceBall,
  onSpinBall,
  themeMode = 'day',
}) => {
  const heroRef = useRef<HTMLDivElement>(null);
  const isNight = themeMode === 'night';

  useEffect(() => {
    const ctx = gsap.context(() => {
      // 1. Watermarks subtle float and entrance
      gsap.fromTo(
        '.hero-watermark-top',
        { y: 30, opacity: 0 },
        { y: 0, opacity: 0.4, duration: 1.6, ease: 'power3.out' }
      );
      gsap.to('.hero-watermark-top', {
        y: -10,
        duration: 5,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
        delay: 1.6,
      });

      gsap.fromTo(
        '.hero-watermark-bottom',
        { y: -30, opacity: 0 },
        { y: 0, opacity: 0.3, duration: 1.6, ease: 'power3.out', delay: 0.2 }
      );
      gsap.to('.hero-watermark-bottom', {
        y: 10,
        duration: 6,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
        delay: 1.8,
      });

      // 2. Headline and technical tagline staggered drop-in
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      tl.fromTo(
        '.hero-badge',
        { y: -15, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, delay: 0.1 }
      )
        .fromTo(
          '.hero-title',
          { y: 25, opacity: 0, scale: 0.96 },
          { y: 0, opacity: 1, scale: 1, duration: 1 },
          '-=0.5'
        )
        .fromTo(
          '.hero-tagline',
          { y: 15, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.8 },
          '-=0.6'
        );

      // 3. Left category menu staggered slide-in
      gsap.fromTo(
        '.hero-left-menu li',
        { x: -30, opacity: 0 },
        {
          x: 0,
          opacity: 1,
          duration: 0.7,
          stagger: 0.08,
          ease: 'power2.out',
          delay: 0.4,
        }
      );

      gsap.fromTo(
        '.hero-id-matrix',
        { opacity: 0 },
        { opacity: 1, duration: 0.9, delay: 1 }
      );

      // 4. Right customization HUD slide-in & swatches pop
      gsap.fromTo(
        '.hero-right-hud',
        { x: 30, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.9, ease: 'power2.out', delay: 0.5 }
      );

      gsap.fromTo(
        '.hero-swatch',
        { scale: 0, opacity: 0 },
        {
          scale: 1,
          opacity: 1,
          duration: 0.5,
          stagger: 0.08,
          ease: 'back.out(2)',
          delay: 0.8,
        }
      );

      // 5. Bottom action buttons bounce-in
      gsap.fromTo(
        '.hero-action-btn',
        { y: 25, opacity: 0, scale: 0.9 },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 0.7,
          stagger: 0.1,
          ease: 'back.out(1.5)',
          delay: 0.9,
        }
      );

      gsap.fromTo(
        '.hero-scroll-cue',
        { opacity: 0, y: -8 },
        { opacity: 1, y: 0, duration: 0.8, delay: 1.3 }
      );
    }, heroRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={heroRef}
      id="overview"
      className="relative w-full min-h-screen flex flex-col justify-between pt-24 pb-10 px-6 sm:px-12 pointer-events-none"
    >
      {/* Giant Faded Typographic Watermarks matching reference image */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden flex flex-col items-center justify-between py-16 z-0 select-none">
        {/* Top Watermark */}
        <span className="hero-watermark-top tactical-watermark text-5xl sm:text-7xl lg:text-9xl tracking-tight opacity-40 font-display">
          Regulation 29.5"
        </span>

        {/* Bottom Watermark */}
        <div className="hero-watermark-bottom flex flex-col items-center">
          <span className="tactical-watermark text-4xl sm:text-6xl lg:text-8xl tracking-tight opacity-30 font-display">
            Court Kinetic
          </span>
          <span className="tactical-watermark text-3xl sm:text-5xl lg:text-7xl tracking-tight opacity-25 font-display -mt-4">
            FIBA Level 1
          </span>
        </div>
      </div>

      {/* Main Centerpiece Headline */}
      <div className="relative z-10 text-center max-w-2xl mx-auto pt-6 pointer-events-auto">
        <p className={`hero-badge text-[11px] sm:text-xs font-mono-tech tracking-[0.25em] uppercase mb-2 ${
          isNight ? 'text-[#A0A2B0]' : 'text-[#6B6D76]'
        }`}>
          \ FIBA REGULATION 29.5" \ NBA MATCH CALIBRATION \ 8.0 PSI NITROGEN \
        </p>

        <h1 className={`hero-title text-5xl sm:text-7xl lg:text-8xl font-extrabold tracking-tight leading-none mb-3 font-display ${
          isNight ? 'text-white' : 'text-[#121316]'
        }`}>
          Kinetic Sphere
        </h1>

        <p className={`hero-tagline text-xs sm:text-sm font-mono-tech tracking-wider uppercase max-w-lg mx-auto ${
          isNight ? 'text-[#B0B2BE]' : 'text-[#555760]'
        }`}>
          Tactile micro-grain composite // Concentric Polyamide geodesic windings
        </p>
      </div>

      {/* Left Column Technical Menu & Right Column Customization Preview */}
      <div className="relative z-10 flex flex-col md:flex-row items-end md:items-center justify-between gap-8 w-full my-auto pointer-events-none">
        {/* Left Side: Technical Category Hierarchy */}
        <div className="pointer-events-auto space-y-4 max-w-xs">
          <span className={`block text-[10px] font-mono-tech uppercase tracking-[0.2em] font-semibold ${
            isNight ? 'text-[#9A9CA8]' : 'text-[#787A84]'
          }`}>
            BALLISTICS / SPEC
          </span>

          <ul className={`hero-left-menu space-y-2.5 text-xs font-mono-tech tracking-wider ${
            isNight ? 'text-[#9A9CA8]' : 'text-[#787A84]'
          }`}>
            <li className={`hover:${isNight ? 'text-white' : 'text-[#121316]'} transition-colors cursor-pointer`} onClick={onExploreAnatomy}>
              FULL-GRAIN LEATHER
            </li>
            <li className={`${isNight ? 'text-white' : 'text-[#121316]'} font-bold flex items-center gap-1.5 cursor-pointer`} onClick={onExploreAnatomy}>
              <span className="text-sm font-bold">|</span> PEBBLE MATRIX
            </li>
            <li className={`hover:${isNight ? 'text-white' : 'text-[#121316]'} transition-colors cursor-pointer`} onClick={onExploreAnatomy}>
              SEAM CHANNELS
            </li>
            <li className={`hover:${isNight ? 'text-white' : 'text-[#121316]'} transition-colors cursor-pointer`} onClick={onExploreAnatomy}>
              CUSHION CORE
            </li>
            <li className={`hover:${isNight ? 'text-white' : 'text-[#121316]'} transition-colors cursor-pointer`} onClick={onExploreAnatomy}>
              POLYAMIDE WINDINGS
            </li>
            <li className={`hover:${isNight ? 'text-white' : 'text-[#121316]'} transition-colors cursor-pointer`} onClick={onExploreAnatomy}>
              NITROGEN CHAMBER
            </li>
          </ul>

          {/* Dotted ID Matrix */}
          <div className={`hero-id-matrix pt-4 text-[10px] font-mono-tech flex items-center gap-2 ${
            isNight ? 'text-[#8E909B]' : 'text-[#8E909B]'
          }`}>
            <span className="tracking-widest">::: :::: ID</span>
            <span>NO. 001 // 500</span>
          </div>
        </div>

        {/* Right Side: Quick Customization HUD */}
        <div className="hero-right-hud pointer-events-auto space-y-4 text-right max-w-xs ml-auto">
          <span className={`block text-[10px] font-mono-tech uppercase tracking-[0.2em] font-semibold ${
            isNight ? 'text-[#9A9CA8]' : 'text-[#787A84]'
          }`}>
            LEATHER / GRAIN
          </span>

          <h3 className={`text-lg font-bold tracking-tight ${
            isNight ? 'text-white' : 'text-[#121316]'
          }`}>
            Customization
          </h3>

          {/* Color Swatch Circles */}
          <div>
            <span className={`block text-[9px] font-mono-tech uppercase tracking-widest mb-2 ${
              isNight ? 'text-[#9A9CA8]' : 'text-[#787A84]'
            }`}>
              SELECT COLOR
            </span>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => {
                  sound.playMetallicClick();
                  onOpenCustomizer();
                }}
                title="Heritage Amber Orange"
                className={`hero-swatch w-6 h-6 rounded-full bg-[#D45B10] border-2 shadow-sm transition-transform hover:scale-110 cursor-pointer ${
                  isNight ? 'border-white' : 'border-[#121316]'
                }`}
              />
              <button
                onClick={() => {
                  sound.playMetallicClick();
                  onOpenCustomizer();
                }}
                title="Tactical Desert Sand"
                className="hero-swatch w-6 h-6 rounded-full bg-[#C4A478] border border-white/20 transition-transform hover:scale-110 cursor-pointer"
              />
              <button
                onClick={() => {
                  sound.playMetallicClick();
                  onOpenCustomizer();
                }}
                title="Night Stealth Obsidian"
                className="hero-swatch w-6 h-6 rounded-full bg-[#1E1F24] border border-white/20 transition-transform hover:scale-110 cursor-pointer"
              />
              <button
                onClick={() => {
                  sound.playMetallicClick();
                  onOpenCustomizer();
                }}
                title="Coyote Amber Gold"
                className="hero-swatch w-6 h-6 rounded-full bg-[#968770] border border-white/20 transition-transform hover:scale-110 cursor-pointer"
              />
            </div>
          </div>

          {/* Pattern / Spec Circular Selection Badges */}
          <div>
            <span className={`block text-[9px] font-mono-tech uppercase tracking-widest mb-2 ${
              isNight ? 'text-[#9A9CA8]' : 'text-[#787A84]'
            }`}>
              SELECT SPEC MATRIX
            </span>
            <div className="flex flex-wrap justify-end gap-1.5 font-mono-tech text-[10px]">
              {['29.5', 'FIBA', 'NBA', '8.0', '18K', 'CNC'].map((code) => (
                <button
                  key={code}
                  onClick={() => {
                    sound.playMetallicClick();
                    onOpenCustomizer();
                  }}
                  className={`hero-swatch w-7 h-7 rounded-full flex items-center justify-center border transition-all cursor-pointer ${
                    code === '29.5'
                      ? isNight
                        ? 'bg-white text-[#121316] font-bold border-white'
                        : 'bg-[#121316] text-[#BEBEC6] font-bold border-[#121316]'
                      : isNight
                      ? 'bg-white/10 text-white/80 border-white/15 hover:border-white/40'
                      : 'bg-white/40 text-[#555760] border-black/10 hover:border-black/30'
                  }`}
                >
                  {code}
                </button>
              ))}
            </div>
          </div>

          {/* Open Guides & Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <span className={`text-[10px] font-mono-tech ${isNight ? 'text-[#9A9CA8]' : 'text-[#787A84]'}`}>
              Open Guides <span className={`${isNight ? 'text-white' : 'text-[#121316]'} font-semibold`}>Y / N</span>
            </span>

            <div className="flex items-center gap-2">
              <button
                id="hero-bookmark-btn"
                onClick={() => {
                  sound.playMetallicClick();
                }}
                title="Save Spec"
                className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all cursor-pointer ${
                  isNight
                    ? 'border-white/20 bg-white/10 text-white hover:bg-white hover:text-[#121316]'
                    : 'border-black/15 bg-white/40 text-[#121316] hover:bg-[#121316] hover:text-white'
                }`}
              >
                <Bookmark className="w-3.5 h-3.5" />
              </button>

              <button
                id="hero-cart-btn"
                onClick={() => {
                  sound.playMetallicClick();
                  onOpenCustomizer();
                }}
                title="Reserve Edition"
                className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all cursor-pointer ${
                  isNight
                    ? 'border-white/20 bg-white/10 text-white hover:bg-white hover:text-[#121316]'
                    : 'border-black/15 bg-white/40 text-[#121316] hover:bg-[#121316] hover:text-white'
                }`}
              >
                <ShoppingBag className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Floating Tactile Controls & Scroll Cue */}
      <div className="relative z-10 flex flex-col items-center gap-4 pointer-events-auto">
        {/* Interactive Triggers */}
        <div className="flex items-center gap-2.5">
          <button
            id="hero-bounce-btn"
            onClick={onBounceBall}
            className={`hero-action-btn flex items-center gap-1.5 px-4 py-2 rounded-full border text-[10px] font-mono-tech tracking-wider uppercase transition-all cursor-pointer shadow-sm ${
              isNight
                ? 'border-white/20 bg-white/10 hover:bg-white hover:text-[#121316] text-white'
                : 'border-black/15 bg-white/50 hover:bg-[#121316] hover:text-white text-[#121316]'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>BOUNCE TEST</span>
          </button>

          <button
            id="hero-spin-btn"
            onClick={onSpinBall}
            className={`hero-action-btn flex items-center gap-1.5 px-4 py-2 rounded-full border text-[10px] font-mono-tech tracking-wider uppercase transition-all cursor-pointer shadow-sm ${
              isNight
                ? 'border-white/20 bg-white/10 hover:bg-white hover:text-[#121316] text-white'
                : 'border-black/15 bg-white/50 hover:bg-[#121316] hover:text-white text-[#121316]'
            }`}
          >
            <Disc3 className="w-3.5 h-3.5" />
            <span>SPIN (300 RPM)</span>
          </button>

          <button
            id="hero-explore-anatomy-btn"
            onClick={onExploreAnatomy}
            className={`hero-action-btn flex items-center gap-1.5 px-5 py-2 rounded-full font-mono-tech text-[10px] font-bold tracking-wider uppercase transition-all cursor-pointer shadow-sm ${
              isNight
                ? 'bg-white text-[#121316] hover:bg-neutral-200'
                : 'bg-[#121316] text-[#BEBEC6] hover:bg-[#25272E]'
            }`}
          >
            <span>DECONSTRUCT 3D</span>
          </button>
        </div>

        {/* Scroll Cue */}
        <button
          onClick={onExploreAnatomy}
          className={`hero-scroll-cue flex items-center gap-1 text-[10px] font-mono-tech tracking-[0.2em] uppercase transition-colors cursor-pointer ${
            isNight ? 'text-white/70 hover:text-white' : 'text-[#787A84] hover:text-[#121316]'
          }`}
        >
          <span>EQUIPMENT SPECIFICATION</span>
          <ChevronDown className="w-3 h-3 animate-bounce" />
        </button>
      </div>
    </section>
  );
};
