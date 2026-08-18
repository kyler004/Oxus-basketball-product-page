import React, { useState, useCallback, useEffect, useRef } from 'react';
import { BallConfig, ViewSection, LightingPreset, ThemeMode } from './types';
import { BasketballCanvas } from './components/BasketballCanvas';
import { Navigation } from './components/Navigation';
import { TopographicBackground } from './components/TopographicBackground';
import { HeroSection } from './components/HeroSection';
import { DeconstructionSection } from './components/DeconstructionSection';
import { MacroGrainSection } from './components/MacroGrainSection';
import { AerodynamicsSection } from './components/AerodynamicsSection';
import { CustomizerStudio } from './components/CustomizerStudio';
import { CourtSandboxModal } from './components/CourtSandboxModal';
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
  const [isCourtSandboxOpen, setIsCourtSandboxOpen] = useState(false);
  const [isReserveModalOpen, setIsReserveModalOpen] = useState(false);
  const [snapshotTrigger, setSnapshotTrigger] = useState(0);
  const [snapshotDataUrl, setSnapshotDataUrl] = useState<string | null>(null);
  const [bounceTrigger, setBounceTrigger] = useState(0);
  const [spinTrigger, setSpinTrigger] = useState(0);

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

  // Interactive ball bounce & spin
  const handleBounceBall = useCallback(() => {
    setBounceTrigger(Date.now());
    sound.playBounce(0.95);
  }, []);

  const handleSpinBall = useCallback(() => {
    setSpinTrigger(Date.now());
    setBallRpm(300);
    sound.playWhoosh();
  }, []);

  // 4K Snapshot Exporter Trigger
  const handleCaptureSnapshot = useCallback(() => {
    setSnapshotTrigger(Date.now());
  }, []);

  const handleSnapshotReady = useCallback((dataUrl: string) => {
    setSnapshotDataUrl(dataUrl);
  }, []);

  const isNight = themeMode === 'night';

  return (
    <div
      className={`relative w-screen h-screen overflow-hidden transition-colors duration-500 select-none ${
        isNight
          ? 'bg-[#121316] text-[#EDEDF2] selection:bg-white selection:text-[#121316]'
          : 'bg-[#BEBEC6] text-[#121316] selection:bg-[#121316] selection:text-[#BEBEC6]'
      }`}
    >
      {/* Topographic Elevation Map Background Curves */}
      <TopographicBackground themeMode={themeMode} />

      {/* Seamless Navigation Header with Centered Delta Emblem & Day/Night Toggle */}
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

      {/* Fixed Center 3D WebGL Canvas Layer (Always perfectly centered) */}
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
          bounceTrigger={bounceTrigger}
          spinTrigger={spinTrigger}
          snapshotTrigger={snapshotTrigger}
          onSnapshotReady={handleSnapshotReady}
        />
      </div>

      {/* Atmospheric Subtle Vignette */}
      <div
        className={`fixed inset-0 pointer-events-none z-10 transition-opacity duration-500 ${
          isNight
            ? 'bg-[radial-gradient(ellipse_at_center,transparent_35%,rgba(8,9,12,0.75)_100%)]'
            : 'bg-[radial-gradient(ellipse_at_center,transparent_45%,rgba(165,165,172,0.45)_100%)]'
        }`}
      />

      {/* Presentation Stage: Fullscreen cross-fading content overlays */}
      <main className="relative z-20 w-full h-full pointer-events-none">
        {/* Section 01: Hero / Overview */}
        <div
          className={`absolute inset-0 w-full h-full flex flex-col justify-center transition-all duration-700 ease-out ${
            activeSectionIndex === 0
              ? 'opacity-100 scale-100 pointer-events-auto z-20 translate-y-0'
              : 'opacity-0 scale-[0.98] pointer-events-none z-10 translate-y-4'
          }`}
        >
          <HeroSection
            onExploreAnatomy={() => goToSectionIndex(1)}
            onOpenCustomizer={() => goToSectionIndex(4)}
            onNavigateToSection={handleScrollToSection}
            onBounceBall={handleBounceBall}
            onSpinBall={handleSpinBall}
            explosionProgress={explosionProgress}
            onToggleConstruct={handleToggleConstruct}
            themeMode={themeMode}
          />
        </div>

        {/* Section 02: Anatomical Deconstruction (Whole ball by default, deconstructed on click) */}
        <div
          className={`absolute inset-0 w-full h-full flex flex-col justify-center transition-all duration-700 ease-out ${
            activeSectionIndex === 1
              ? 'opacity-100 scale-100 pointer-events-auto z-20 translate-y-0'
              : 'opacity-0 scale-[0.98] pointer-events-none z-10 translate-y-4'
          }`}
        >
          <DeconstructionSection
            explosionProgress={explosionProgress}
            onExplosionChange={setExplosionProgress}
            selectedLayerId={selectedLayerId}
            onSelectLayer={setSelectedLayerId}
            themeMode={themeMode}
          />
        </div>

        {/* Section 03: Macro Grip & Micro-Grain */}
        <div
          className={`absolute inset-0 w-full h-full flex flex-col justify-center transition-all duration-700 ease-out ${
            activeSectionIndex === 2
              ? 'opacity-100 scale-100 pointer-events-auto z-20 translate-y-0'
              : 'opacity-0 scale-[0.98] pointer-events-none z-10 translate-y-4'
          }`}
        >
          <MacroGrainSection
            config={config}
            onUpdateConfig={handleUpdateConfig}
            themeMode={themeMode}
          />
        </div>

        {/* Section 04: Aerodynamics & Wind Tunnel */}
        <div
          className={`absolute inset-0 w-full h-full flex flex-col justify-center transition-all duration-700 ease-out ${
            activeSectionIndex === 3
              ? 'opacity-100 scale-100 pointer-events-auto z-20 translate-y-0'
              : 'opacity-0 scale-[0.98] pointer-events-none z-10 translate-y-4'
          }`}
        >
          <AerodynamicsSection
            windSpeed={windSpeed}
            onWindSpeedChange={setWindSpeed}
            ballRpm={ballRpm}
            onBallRpmChange={setBallRpm}
            themeMode={themeMode}
          />
        </div>

        {/* Section 05: Bespoke 3D Customizer Studio */}
        <div
          className={`absolute inset-0 w-full h-full flex flex-col justify-center transition-all duration-700 ease-out ${
            activeSectionIndex === 4
              ? 'opacity-100 scale-100 pointer-events-auto z-20 translate-y-0'
              : 'opacity-0 scale-[0.98] pointer-events-none z-10 translate-y-4'
          }`}
        >
          <CustomizerStudio
            config={config}
            onUpdateConfig={handleUpdateConfig}
            onCaptureSnapshot={handleCaptureSnapshot}
            snapshotDataUrl={snapshotDataUrl}
            onCloseSnapshotModal={() => setSnapshotDataUrl(null)}
            themeMode={themeMode}
          />
        </div>

        {/* Section 06: Stylized Atelier Specifications & Engineering Footer */}
        <div
          className={`absolute inset-0 w-full h-full flex flex-col justify-end transition-all duration-700 ease-out ${
            activeSectionIndex === 5
              ? 'opacity-100 scale-100 pointer-events-auto z-20 translate-y-0'
              : 'opacity-0 scale-[0.98] pointer-events-none z-10 translate-y-4'
          }`}
        >
          <div className="w-full max-h-full overflow-y-auto pointer-events-auto pt-20">
            <Footer
              onScrollToSection={handleScrollToSection}
              themeMode={themeMode}
              config={config}
              onOpenCourtSandbox={() => setIsCourtSandboxOpen(true)}
              onOpenReserveModal={() => setIsReserveModalOpen(true)}
            />
          </div>
        </div>
      </main>

      {/* Sleek Presentation Step Pagination Indicator on the Left */}
      <nav
        aria-label="Section Index"
        className="fixed left-6 sm:left-12 bottom-6 z-40 flex items-center gap-3 pointer-events-auto font-mono-tech select-none"
      >
        <span className={`text-xs font-bold tracking-widest ${
          isNight ? 'text-white' : 'text-[#121316]'
        }`}>
          {SECTIONS[activeSectionIndex].num}
        </span>
        <div className="flex items-center gap-1.5">
          {SECTIONS.map((sec, idx) => (
            <button
              key={sec.id}
              onClick={() => goToSectionIndex(idx)}
              title={sec.label}
              className={`h-1.5 transition-all duration-300 rounded-full cursor-pointer ${
                idx === activeSectionIndex
                  ? isNight
                    ? 'w-6 bg-white'
                    : 'w-6 bg-[#121316]'
                  : isNight
                  ? 'w-1.5 bg-white/25 hover:bg-white/50'
                  : 'w-1.5 bg-black/20 hover:bg-black/40'
              }`}
            />
          ))}
        </div>
        <span className={`text-[10px] tracking-wider uppercase font-semibold hidden sm:inline ${
          isNight ? 'text-[#C4C6D2]' : 'text-[#555760]'
        }`}>
          / {String(SECTIONS.length).padStart(2, '0')} // {SECTIONS[activeSectionIndex].label}
        </span>
      </nav>

      {/* Interactive Court Physics Sandbox Modal */}
      <CourtSandboxModal
        isOpen={isCourtSandboxOpen}
        onClose={() => setIsCourtSandboxOpen(false)}
        config={config}
      />

      {/* Premium Bespoke Reserve Allocation Modal */}
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
