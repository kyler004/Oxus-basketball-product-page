import React, { useEffect, useRef } from 'react';
import { DeconstructedLayer, ThemeMode } from '../types';
import { Layers, RotateCcw } from 'lucide-react';
import gsap from 'gsap';
import { sound } from '../utils/audio';

interface DeconstructionSectionProps {
  explosionProgress?: number;
  onExplosionChange?: (value: number) => void;
  selectedLayerId: string | null;
  onSelectLayer: (layerId: string | null) => void;
  themeMode?: ThemeMode;
}

export const DeconstructionSection: React.FC<DeconstructionSectionProps> = ({
  explosionProgress = 0,
  onExplosionChange,
  selectedLayerId,
  onSelectLayer,
  themeMode = 'day',
}) => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const isNight = themeMode === 'night';

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
      tl.fromTo(
        '.deconstruct-header > *',
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, stagger: 0.1 }
      ).fromTo(
        '.deconstruct-layer-row',
        { x: 30, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.6, stagger: 0.08 },
        '-=0.4'
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const layers: DeconstructedLayer[] = [
    {
      id: 'layer-outer',
      name: 'Micro-Pored Composite Leather',
      tagline: 'TACTILE MOISTURE-WICKING SURFACE',
      thickness: '1.4 mm',
      material: 'Cross-Linked Polyurethane & Microfiber',
      description: 'Thousands of laser-embossed micro-pebbles engineered to wick palm moisture instantly during high-intensity gameplay.',
      color: '#121316',
      offsetDistance: 2.8,
      specs: [
        { label: 'Surface Pebbles', value: '18,400 units' },
        { label: 'Friction Coeff', value: '0.88 μ' },
        { label: 'Channel Depth', value: '1.2 mm recessed' },
      ],
    },
    {
      id: 'layer-windings',
      name: '4-Ply Polyamide Nylon Windings',
      tagline: 'GEODESIC STRUCTURAL INTEGRITY',
      thickness: '0.8 mm',
      material: 'Concentric Braided Nylon Monofilament',
      description: 'Thousands of meters of unbroken polyamide thread wound across spherical geodesics to guarantee perfect radial bounce roundness.',
      color: '#4B5563',
      offsetDistance: 1.9,
      specs: [
        { label: 'Tensile Strength', value: '2,400 N' },
        { label: 'Winding Length', value: '1,840 m' },
        { label: 'Radial Invariant', value: '99.98%' },
      ],
    },
    {
      id: 'layer-cushion',
      name: 'Cushion Response Sponge Foam',
      tagline: 'ENERGY ABSORPTION & SOFT TOUCH',
      thickness: '2.1 mm',
      material: 'Low-Density Closed-Cell Elastomer',
      description: 'Micro-cellular dampening matrix delivering consistent tactile rebound elasticity and rim deceleration.',
      color: '#6B7280',
      offsetDistance: 1.1,
      specs: [
        { label: 'Rebound Rate', value: '82.4%' },
        { label: 'Cell Density', value: '45 kg/m³' },
        { label: 'Impact Decel', value: '14.2 G' },
      ],
    },
    {
      id: 'layer-core',
      name: 'Airtight Butyl Bladder Core',
      tagline: 'PRESSURE RETENTION MEMBRANE',
      thickness: '0.9 mm',
      material: 'Vulcanized Butyl Rubber & Halobutyl Liner',
      description: 'Zero-permeation air retention vessel calibrated for consistent 8.0 PSI pressure retention.',
      color: '#1F2937',
      offsetDistance: 0.4,
      specs: [
        { label: 'Inflation PSI', value: '8.0 PSI' },
        { label: 'Gas Loss Rate', value: '<0.01 %/mo' },
        { label: 'Equilibrium', value: 'Dual-Valve' },
      ],
    },
  ];

  const isDeconstructed = explosionProgress > 0.1;

  const handleToggleDeconstruct = () => {
    sound.playMetallicClick();
    if (onExplosionChange) {
      const next = isDeconstructed ? 0 : 0.75;
      onExplosionChange(next);
      sound.playDeconstructTone(next > 0);
      if (next === 0) onSelectLayer(null);
    }
  };

  const handleRowClick = (layerId: string) => {
    sound.playMetallicClick();
    if (!isDeconstructed && onExplosionChange) {
      onExplosionChange(0.75);
      sound.playDeconstructTone(true);
    }
    onSelectLayer(selectedLayerId === layerId ? null : layerId);
  };

  return (
    <section
      ref={sectionRef}
      id="anatomy"
      className="relative w-full max-w-[1440px] mx-auto flex flex-col lg:flex-row lg:items-center justify-between gap-16 lg:gap-28 xl:gap-36 px-8 sm:px-14 lg:px-20 pointer-events-none"
    >
      {/* 1. Header & Deconstruct Trigger (Directly on site) */}
      <div className="deconstruct-header max-w-lg pointer-events-auto">
        <div className="inline-flex items-center gap-2 mb-3">
          <Layers className="w-4 h-4 text-amber-500" />
          <span className={`font-mono-tech text-[10px] tracking-[0.25em] font-bold uppercase ${
            isNight ? 'text-amber-400' : 'text-amber-700'
          }`}>
            02 // ANATOMICAL DECONSTRUCTION
          </span>
        </div>

        <h2 className={`text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-none mb-4 font-display ${
          isNight ? 'text-white' : 'text-[#121316]'
        }`}>
          INTERNAL <br />
          MEMBRANES
        </h2>

        <p className={`text-xs sm:text-sm leading-relaxed max-w-md font-mono-tech mb-6 ${
          isNight ? 'text-[#D0D2DE]' : 'text-[#444650]'
        }`}>
          The sphere remains unified in its calibrated regulation form. Trigger deconstruction to inspect the four concentric internal performance membranes.
        </p>

        {/* User-Triggered Deconstruct Action Button on site */}
        <div className="flex items-center gap-3">
          <button
            id="deconstruct-interactive-toggle-btn"
            onClick={handleToggleDeconstruct}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-full font-mono-tech text-[11px] font-bold tracking-wider uppercase transition-all shadow-md active:scale-95 cursor-pointer ${
              isDeconstructed
                ? isNight
                  ? 'bg-white text-[#121316] hover:bg-neutral-200'
                  : 'bg-[#121316] text-[#EDEDF2] hover:bg-[#25272E]'
                : isNight
                ? 'bg-white/15 text-white hover:bg-white/25 border border-white/25'
                : 'bg-white text-[#121316] hover:bg-neutral-100 border border-black/15'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>{isDeconstructed ? 'ASSEMBLE (WHOLE)' : 'DECONSTRUCT IN 3D'}</span>
          </button>

          {isDeconstructed && (
            <button
              onClick={() => {
                sound.playMetallicClick();
                onExplosionChange?.(0);
                onSelectLayer(null);
              }}
              title="Reset to whole ball"
              className={`p-2.5 rounded-full border transition-all cursor-pointer ${
                isNight
                  ? 'bg-white/10 hover:bg-white/25 border-white/20 text-white'
                  : 'bg-white/50 hover:bg-white/80 border-black/10 text-[#121316]'
              }`}
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* 2. Layer Index Presented Directly on Site with Enlarged Spacing */}
      <div className="w-full lg:max-w-lg lg:ml-auto pointer-events-auto font-mono-tech select-none space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-black/10 dark:border-white/10">
          <span className={`text-[11px] font-bold uppercase tracking-[0.25em] ${
            isNight ? 'text-[#C4C6D4]' : 'text-[#444650]'
          }`}>
            4-LAYER ARCHITECTURE
          </span>
          {selectedLayerId && (
            <button
              onClick={() => {
                sound.playMetallicClick();
                onSelectLayer(null);
              }}
              className={`text-[10px] hover:underline cursor-pointer font-bold ${
                isNight ? 'text-amber-400' : 'text-amber-700'
              }`}
            >
              RESET ISOLATION
            </button>
          )}
        </div>

        {/* Layers list as raw, clean typographic rows */}
        <div className="flex flex-col gap-3">
          {layers.map((layer, idx) => {
            const isSelected = selectedLayerId === layer.id;
            return (
              <div
                key={layer.id}
                id={`layer-row-${layer.id}`}
                onClick={() => handleRowClick(layer.id)}
                className={`deconstruct-layer-row transition-all duration-200 cursor-pointer pb-3 border-b ${
                  isSelected
                    ? isNight
                      ? 'border-white text-white pl-3 bg-white/5'
                      : 'border-[#121316] text-[#121316] pl-3 bg-black/5'
                    : isNight
                    ? 'border-white/10 text-white/70 hover:text-white hover:border-white/30'
                    : 'border-black/10 text-[#121316]/70 hover:text-[#121316] hover:border-black/30'
                }`}
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-amber-500">
                      0{idx + 1}
                    </span>
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider">
                        {layer.name}
                      </h4>
                      <span className={`text-[9px] block ${
                        isNight ? 'text-[#8E90A0]' : 'text-[#656770]'
                      }`}>
                        {layer.tagline}
                      </span>
                    </div>
                  </div>

                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    isNight ? 'bg-white/10 text-white' : 'bg-black/5 text-[#121316]'
                  }`}>
                    {layer.thickness}
                  </span>
                </div>

                {isSelected && (
                  <div className="mt-2.5 pt-2 space-y-2 text-xs">
                    <p className={`leading-relaxed ${
                      isNight ? 'text-[#D0D2DE]' : 'text-[#444650]'
                    }`}>
                      {layer.description}
                    </p>
                    <div className="grid grid-cols-3 gap-4 pt-1 text-[10px]">
                      {layer.specs.map((spec) => (
                        <div key={spec.label} className="flex flex-col">
                          <span className={`uppercase text-[8px] ${
                            isNight ? 'text-[#8E90A0]' : 'text-[#656770]'
                          }`}>
                            {spec.label}
                          </span>
                          <span className={`font-bold ${
                            isNight ? 'text-white' : 'text-[#121316]'
                          }`}>
                            {spec.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
