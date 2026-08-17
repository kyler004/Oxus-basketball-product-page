import React, { useState, useCallback, useEffect } from 'react';
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
import { Footer } from './components/Footer';
import { sound } from './utils/audio';

export default function App() {
  // Current active view section for 3D camera & lighting orchestration
  const [activeSection, setActiveSection] = useState<ViewSection>('hero');

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

  // 3D Canvas Controls
  const [explosionProgress, setExplosionProgress] = useState(0);
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
  const [lightingPreset] = useState<LightingPreset>('court-lights');
  const [macroLightAngle, setMacroLightAngle] = useState(135);
  const [windSpeed, setWindSpeed] = useState(65); // km/h
  const [ballRpm, setBallRpm] = useState(180); // rpm

  // Audio & Modals
  const [isMuted, setIsMuted] = useState(false);
  const [isCourtSandboxOpen, setIsCourtSandboxOpen] = useState(false);
  const [snapshotTrigger, setSnapshotTrigger] = useState(0);
  const [snapshotDataUrl, setSnapshotDataUrl] = useState<string | null>(null);

  // Toggle Day / Night Theme
  const handleToggleTheme = useCallback(() => {
    setThemeMode((prev) => (prev === 'day' ? 'night' : 'day'));
  }, []);

  // Partial update helper
  const handleUpdateConfig = useCallback((updated: Partial<BallConfig>) => {
    setConfig((prev) => ({ ...prev, ...updated }));
  }, []);

  // Smooth scroll to target section ID
  const handleScrollToSection = useCallback((sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  // Scroll spy: update activeSection based on what is in view
  useEffect(() => {
    const sectionMapping: { id: string; section: ViewSection }[] = [
      { id: 'overview', section: 'hero' },
      { id: 'anatomy', section: 'deconstruction' },
      { id: 'macro', section: 'macro' },
      { id: 'aerodynamics', section: 'aerodynamics' },
      { id: 'bespoke', section: 'customizer' },
    ];

    const observerCallback: IntersectionObserverCallback = (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const matched = sectionMapping.find((s) => s.id === entry.target.id);
          if (matched) {
            setActiveSection(matched.section);
            if (matched.section === 'deconstruction' && explosionProgress < 0.2) {
              setExplosionProgress(0.5);
            }
          }
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, {
      threshold: 0.35,
      rootMargin: '-10% 0px -20% 0px',
    });

    sectionMapping.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [explosionProgress]);

  // Audio Toggle
  const handleToggleMute = useCallback(() => {
    const muted = sound.toggleMute();
    setIsMuted(muted);
  }, []);

  // Interactive ball bounce & spin
  const handleBounceBall = useCallback(() => {
    sound.playBounce(0.9);
  }, []);

  const handleSpinBall = useCallback(() => {
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
      className={`relative min-h-screen transition-colors duration-500 overflow-x-hidden ${
        isNight
          ? 'bg-[#121316] text-[#EDEDF2] selection:bg-white selection:text-[#121316]'
          : 'bg-[#BEBEC6] text-[#121316] selection:bg-[#121316] selection:text-[#BEBEC6]'
      }`}
    >
      {/* Topographic Elevation Map Background Curves */}
      <TopographicBackground themeMode={themeMode} />

      {/* Fixed Fullscreen 3D WebGL Canvas Layer */}
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

      {/* Atmospheric Subtle Vignette */}
      <div
        className={`fixed inset-0 pointer-events-none z-10 transition-opacity duration-500 ${
          isNight
            ? 'bg-[radial-gradient(ellipse_at_center,transparent_35%,rgba(8,9,12,0.75)_100%)]'
            : 'bg-[radial-gradient(ellipse_at_center,transparent_45%,rgba(165,165,172,0.45)_100%)]'
        }`}
      />

      {/* Streamlined Navigation Header with centered delta glyph and Day/Night toggle */}
      <Navigation
        activeSection={activeSection}
        onScrollToSection={handleScrollToSection}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        themeMode={themeMode}
        onToggleTheme={handleToggleTheme}
      />

      {/* Landing Page Continuous Scroll Sections */}
      <main className="relative z-20 w-full">
        {/* Section 01: Hero / Overview */}
        <HeroSection
          onExploreAnatomy={() => handleScrollToSection('anatomy')}
          onOpenCustomizer={() => handleScrollToSection('bespoke')}
          onBounceBall={handleBounceBall}
          onSpinBall={handleSpinBall}
          themeMode={themeMode}
        />

        {/* Section 02: Anatomical Deconstruction */}
        <DeconstructionSection
          explosionProgress={explosionProgress}
          onExplosionChange={setExplosionProgress}
          selectedLayerId={selectedLayerId}
          onSelectLayer={setSelectedLayerId}
        />

        {/* Section 03: Macro Grip & Micro-Grain */}
        <MacroGrainSection
          config={config}
          onUpdateConfig={handleUpdateConfig}
          macroLightAngle={macroLightAngle}
          onMacroLightAngleChange={setMacroLightAngle}
        />

        {/* Section 04: Aerodynamics & Wind Tunnel */}
        <AerodynamicsSection
          windSpeed={windSpeed}
          onWindSpeedChange={setWindSpeed}
          ballRpm={ballRpm}
          onBallRpmChange={setBallRpm}
        />

        {/* Section 05: Bespoke 3D Customizer Studio */}
        <CustomizerStudio
          config={config}
          onUpdateConfig={handleUpdateConfig}
          onCaptureSnapshot={handleCaptureSnapshot}
          snapshotDataUrl={snapshotDataUrl}
          onCloseSnapshotModal={() => setSnapshotDataUrl(null)}
        />
      </main>

      {/* Interactive Court Physics Sandbox Modal */}
      <CourtSandboxModal
        isOpen={isCourtSandboxOpen}
        onClose={() => setIsCourtSandboxOpen(false)}
        config={config}
      />

      {/* Tactical Luxury Brand Footer */}
      <Footer onScrollToSection={handleScrollToSection} />
    </div>
  );
}
