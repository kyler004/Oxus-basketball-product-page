import React, { useState, useCallback, useEffect, useRef } from 'react';
import { BallConfig, ViewSection, LightingPreset, ThemeMode } from './types';
import { BasketballCanvas } from './components/BasketballCanvas';
import { Navigation } from './components/Navigation';
import { HeroSection } from './components/HeroSection';
import { DeconstructionSection } from './components/DeconstructionSection';
import { MacroGrainSection } from './components/MacroGrainSection';
import { AerodynamicsSection } from './components/AerodynamicsSection';
import { CustomizerStudio } from './components/CustomizerStudio';
import { ReserveModal } from './components/ReserveModal';
import { Footer } from './components/Footer';
import { sound } from './utils/audio';

const SECTIONS: { id: string; section: ViewSection; label: string; shortLabel: string; num: string }[] = [
  { id: 'overview', section: 'hero', label: 'OVERVIEW', shortLabel: 'Overview', num: '01' },
  { id: 'anatomy', section: 'deconstruction', label: 'ANATOMY', shortLabel: 'Anatomy', num: '02' },
  { id: 'macro', section: 'macro', label: 'GRAIN & GRIP', shortLabel: 'Grain', num: '03' },
  { id: 'aerodynamics', section: 'aerodynamics', label: 'AERODYNAMICS', shortLabel: 'Aero', num: '04' },
  { id: 'bespoke', section: 'customizer', label: 'BESPOKE LAB', shortLabel: 'Bespoke', num: '05' },
  { id: 'atelier', section: 'footer', label: 'ATELIER & SPECS', shortLabel: 'Atelier', num: '06' },
];

export default function App() {
  // Current active slide index (0 to 4) for seamless fade scroll transitions
  const [activeSectionIndex, setActiveSectionIndex] = useState(0);
  const activeSection = SECTIONS[activeSectionIndex].section;

  // Day / Night Theme Mode State
  const [themeMode, setThemeMode] = useState<ThemeMode>('day');

  // Bespoke Ball Configuration with Heritage Basketball Orange Default
  const [config, setConfig] = useState<BallConfig>({
    edition: 'heritage',
    leatherName: 'Heritage Amber Clay',
    leatherColor: '#D45B10',
    leatherSecondaryColor: '#94380E',
    seamColor: '#121316',
    seamRoughness: 0.4,
    seamMetalness: 0.1,
    monogramText: 'KS-ELITE',
    monogramFoil: 'silver',
    serialNumber: 'NO. 001 / 500 — ULTRA COMPOSITE',
    gripDensity: 'fiba',
    roughness: 0.65,
    metalness: 0.15,
    pebbleDepth: 0.85,
  });

  // 3D Canvas Controls (Ball stays whole at center by default)
  const [explosionProgress, setExplosionProgress] = useState(0);
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
  const [lightingPreset] = useState<LightingPreset>('court-lights');
  const [macroLightAngle, setMacroLightAngle] = useState(135);
  const [windSpeed, setWindSpeed] = useState(65); // km/h
  const [ballRpm, setBallRpm] = useState(180); // rpm

  // Audio & Modals
  const [isMuted, setIsMuted] = useState(false);
  const [isReserveModalOpen, setIsReserveModalOpen] = useState(false);
  const snapshotTrigger = 0;
  const [, setSnapshotDataUrl] = useState<string | null>(null);

  // Scroll / Wheel transition throttling ref
  const isTransitioningRef = useRef(false);
  const touchStartYRef = useRef<number | null>(null);

  // Switch to section by index
  const goToSectionIndex = useCallback((newIndex: number) => {
    if (newIndex < 0 || newIndex >= SECTIONS.length) return;
    sound.playMetallicClick();
    setActiveSectionIndex(newIndex);
  }, []);

  // Jump to section by string ID (for navbar / reserve button / hero buttons)
  const handleScrollToSection = useCallback((sectionId: string) => {
    const idx = SECTIONS.findIndex((s) => s.id === sectionId);
    if (idx !== -1) {
      goToSectionIndex(idx);
    }
  }, [goToSectionIndex]);

  // Toggle Animated Construction / Deconstruction
  const handleToggleConstruct = useCallback(() => {
    setExplosionProgress((prev) => {
      const next = prev > 0.1 ? 0 : 0.75;
      sound.playDeconstructTone(next > 0);
      if (next === 0) {
        setSelectedLayerId(null);
      }
      return next;
    });
  }, []);

  // Wheel & Trackpad scroll listener: smoothly transitions slides with fade
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      // Ignore if user is interacting with form inputs / range sliders
      if ((e.target as HTMLElement)?.tagName === 'INPUT' || (e.target as HTMLElement)?.tagName === 'TEXTAREA') {
        return;
      }

      if (isTransitioningRef.current) return;

      const threshold = 30;
      if (Math.abs(e.deltaY) > threshold) {
        isTransitioningRef.current = true;

        if (e.deltaY > 0) {
          // Scroll Down -> Next Slide
          setActiveSectionIndex((prev) => {
            const next = Math.min(prev + 1, SECTIONS.length - 1);
            if (next !== prev) sound.playMetallicClick();
            return next;
          });
        } else {
          // Scroll Up -> Previous Slide
          setActiveSectionIndex((prev) => {
            const next = Math.max(prev - 1, 0);
            if (next !== prev) sound.playMetallicClick();
            return next;
          });
        }

        // Cool-down to prevent rapid multi-slide jumping from trackpad inertia
        setTimeout(() => {
          isTransitioningRef.current = false;
        }, 600);
      }
    };

    const handleTouchStart = (e: TouchEvent) => {
      touchStartYRef.current = e.touches[0].clientY;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (touchStartYRef.current === null || isTransitioningRef.current) return;
      const touchEndY = e.changedTouches[0].clientY;
      const diffY = touchStartYRef.current - touchEndY;
      touchStartYRef.current = null;

      const threshold = 40;
      if (Math.abs(diffY) > threshold) {
        isTransitioningRef.current = true;
        if (diffY > 0) {
          // Swiped Up -> Next Slide
          setActiveSectionIndex((prev) => {
            const next = Math.min(prev + 1, SECTIONS.length - 1);
            if (next !== prev) sound.playMetallicClick();
            return next;
          });
        } else {
          // Swiped Down -> Previous Slide
          setActiveSectionIndex((prev) => {
            const next = Math.max(prev - 1, 0);
            if (next !== prev) sound.playMetallicClick();
            return next;
          });
        }

        setTimeout(() => {
          isTransitioningRef.current = false;
        }, 600);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowDown', 'PageDown', ' '].includes(e.key)) {
        e.preventDefault();
        setActiveSectionIndex((prev) => {
          const next = Math.min(prev + 1, SECTIONS.length - 1);
          if (next !== prev) sound.playMetallicClick();
          return next;
        });
      } else if (['ArrowUp', 'PageUp'].includes(e.key)) {
        e.preventDefault();
        setActiveSectionIndex((prev) => {
          const next = Math.max(prev - 1, 0);
          if (next !== prev) sound.playMetallicClick();
          return next;
        });
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: true });
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Toggle Day / Night Theme
  const handleToggleTheme = useCallback(() => {
    setThemeMode((prev) => (prev === 'day' ? 'night' : 'day'));
  }, []);

  // Partial config update helper
  const handleUpdateConfig = useCallback((updated: Partial<BallConfig>) => {
    setConfig((prev) => ({ ...prev, ...updated }));
  }, []);

  // Audio Toggle
  const handleToggleMute = useCallback(() => {
    const muted = sound.toggleMute();
    setIsMuted(muted);
  }, []);

  const handleSnapshotReady = useCallback((dataUrl: string) => {
    setSnapshotDataUrl(dataUrl);
  }, []);

  const isNight = themeMode === 'night';

  return (
    <div
      className={`relative w-screen h-screen overflow-hidden transition-colors duration-500 select-none ${
        isNight
          ? 'bg-[#14110F] text-[#F4EFE8] selection:bg-[#F28C3E] selection:text-[#14110F]'
          : 'bg-[#E8E3DA] text-[#1A1714] selection:bg-[#B8480A] selection:text-white'
      }`}
    >
      <Navigation
        sections={SECTIONS}
        activeSectionIndex={activeSectionIndex}
        onSelectSectionIndex={goToSectionIndex}
        onScrollToSection={handleScrollToSection}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        themeMode={themeMode}
        onToggleTheme={handleToggleTheme}
        onOpenReserveModal={() => setIsReserveModalOpen(true)}
      />

      {/* Soft spotlight behind the ball */}
      <div
        className={`fixed inset-0 pointer-events-none z-0 ${
          isNight
            ? 'bg-[radial-gradient(ellipse_at_center,#2A211B_0%,transparent_60%)]'
            : 'bg-[radial-gradient(ellipse_at_center,#F5F1EA_0%,transparent_60%)]'
        }`}
      />

      {/* Fixed centre 3D canvas */}
      <div className="fixed inset-0 z-0 pointer-events-auto">
        <BasketballCanvas
          config={config}
          activeSection={activeSection}
          explosionProgress={explosionProgress}
          lightingPreset={lightingPreset}
          themeMode={themeMode}
          windSpeed={windSpeed}
          ballRpm={ballRpm}
          selectedLayerId={selectedLayerId}
          macroLightAngle={macroLightAngle}
          snapshotTrigger={snapshotTrigger}
          onSnapshotReady={handleSnapshotReady}
        />
      </div>

      {/* Cross-fading sections */}
      <main className="relative z-20 w-full h-full pointer-events-none">
        {[
          <HeroSection
            key="hero"
            onExploreAnatomy={() => goToSectionIndex(1)}
            onOpenReserve={() => setIsReserveModalOpen(true)}
            themeMode={themeMode}
          />,
          <DeconstructionSection
            key="anatomy"
            explosionProgress={explosionProgress}
            onExplosionChange={setExplosionProgress}
            selectedLayerId={selectedLayerId}
            onSelectLayer={setSelectedLayerId}
            themeMode={themeMode}
          />,
          <MacroGrainSection
            key="macro"
            config={config}
            onUpdateConfig={handleUpdateConfig}
            themeMode={themeMode}
          />,
          <AerodynamicsSection
            key="aero"
            windSpeed={windSpeed}
            onWindSpeedChange={setWindSpeed}
            ballRpm={ballRpm}
            onBallRpmChange={setBallRpm}
            themeMode={themeMode}
          />,
          <CustomizerStudio
            key="bespoke"
            config={config}
            onUpdateConfig={handleUpdateConfig}
            onReserve={() => setIsReserveModalOpen(true)}
            themeMode={themeMode}
          />,
          <Footer
            key="atelier"
            onScrollToSection={handleScrollToSection}
            themeMode={themeMode}
            config={config}
            onOpenReserveModal={() => setIsReserveModalOpen(true)}
          />,
        ].map((content, idx) => {
          const isActive = activeSectionIndex === idx;
          return (
            <div
              key={SECTIONS[idx].id}
              aria-hidden={!isActive}
              inert={!isActive}
              className={`absolute inset-0 w-full h-full transition-all duration-700 ease-out ${
                isActive
                  ? 'opacity-100 translate-y-0 z-20'
                  : 'opacity-0 translate-y-3 pointer-events-none z-10'
              }`}
            >
              {content}
            </div>
          );
        })}
      </main>

      {/* Section progress rail */}
      <nav
        aria-label="Section index"
        className="fixed right-5 sm:right-8 top-1/2 -translate-y-1/2 z-40 flex flex-col items-center gap-2.5"
      >
        {SECTIONS.map((sec, idx) => (
          <button
            key={sec.id}
            onClick={() => goToSectionIndex(idx)}
            title={sec.shortLabel}
            aria-label={sec.shortLabel}
            aria-current={idx === activeSectionIndex ? 'true' : undefined}
            className={`w-1.5 rounded-full cursor-pointer transition-all duration-300 ${
              idx === activeSectionIndex
                ? `h-6 ${isNight ? 'bg-[#F28C3E]' : 'bg-[#B8480A]'}`
                : `h-1.5 ${isNight ? 'bg-white/25 hover:bg-white/50' : 'bg-black/20 hover:bg-black/40'}`
            }`}
          />
        ))}
      </nav>

      <ReserveModal
        isOpen={isReserveModalOpen}
        onClose={() => setIsReserveModalOpen(false)}
        config={config}
        onUpdateConfig={handleUpdateConfig}
        themeMode={themeMode}
      />
    </div>
  );
}
