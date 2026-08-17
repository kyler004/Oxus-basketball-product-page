import React, { useEffect, useRef } from 'react';
import { DeconstructedLayer } from '../types';
import { Layers } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { sound } from '../utils/audio';

gsap.registerPlugin(ScrollTrigger);

interface DeconstructionSectionProps {
  explosionProgress?: number;
  onExplosionChange?: (value: number) => void;
  selectedLayerId: string | null;
  onSelectLayer: (layerId: string | null) => void;
}

export const DeconstructionSection: React.FC<DeconstructionSectionProps> = ({
  selectedLayerId,
  onSelectLayer,
}) => {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Staggered reveal when section scrolls into viewport
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 75%',
          toggleActions: 'play none none none',
        },
      });

      tl.fromTo(
        '.deconstruct-header > *',
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, stagger: 0.12, ease: 'power3.out' }
      ).fromTo(
        '.deconstruct-layer-card',
        { x: 40, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.6, stagger: 0.1, ease: 'power3.out' },
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
        { label: 'Friction Coefficient', value: '0.88 μ' },
        { label: 'Channel Depth', value: '1.2 mm recessed' },
      ],
    },
    {
      id: 'layer-windings',
      name: '4-Ply Polyamide Nylon Windings',
      tagline: 'STRUCTURAL SPHERICAL INTEGRITY',
      thickness: '0.6 mm',
      material: 'High-Tensile Braided Filament Yarn',
      description: 'Over 2,800 meters of precision-tensioned nylon thread wound in a multi-axis geodesic pattern to prevent spherical deformation over 50,000 impacts.',
      color: '#BFA173',
      offsetDistance: 1.5,
      specs: [
        { label: 'Filament Length', value: '2,840 meters' },
        { label: 'Tensile Strength', value: '120 kgf/cm²' },
        { label: 'Shape Retention', value: '99.98% cyclic' },
      ],
    },
    {
      id: 'layer-carcass',
      name: 'Cushion Core Rubber Carcass',
      tagline: 'ENERGY RESTITUTION & SHOCK ABSORPTION',
      thickness: '2.1 mm',
      material: 'Vulcanized Sponge Rubber Compound',
      description: 'Specialized low-density elastomer carcass that delivers a soft feel on finger contact while maintaining crisp kinetic energy return on the hardwood.',
      color: '#555760',
      offsetDistance: 0.8,
      specs: [
        { label: 'Elastic Modulus', value: '1.45 MPa' },
        { label: 'Energy Return', value: '78.9% COR' },
        { label: 'Damping Factor', value: '0.04 ζ' },
      ],
    },
    {
      id: 'layer-bladder',
      name: 'Butyl Airtight Bladder & Brass Valve',
      tagline: 'CHAMBER PRESSURE SEAL',
      thickness: '1.2 mm',
      material: 'High-Purity Butyl Synthetic Polymer',
      description: 'Zero-permeation butyl chamber equipped with a precision brass core air valve, retaining FIBA regulation 8.0 PSI internal pressure for 365+ days.',
      color: '#2A2C34',
      offsetDistance: 0.0,
      specs: [
        { label: 'Rated Pressure', value: '7.5 – 8.5 PSI' },
        { label: 'Leakage Rate', value: '<0.05 PSI / month' },
        { label: 'Valve Core', value: 'Solid Machined Brass' },
      ],
    },
  ];

  return (
    <section
      ref={sectionRef}
      id="anatomy"
      className="relative w-full min-h-screen flex flex-col lg:flex-row lg:items-start justify-between gap-10 pt-28 pb-20 px-6 sm:px-12 pointer-events-none"
    >
      {/* Header & Overview */}
      <div className="deconstruct-header max-w-xl pointer-events-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/40 border border-black/10 backdrop-blur-md mb-5">
          <Layers className="w-3.5 h-3.5 text-[#121316]" />
          <span className="font-mono-tech text-[10px] text-[#121316] tracking-[0.25em] font-semibold uppercase">
            02 // ANATOMICAL 3D
          </span>
        </div>

        <h2 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-[#121316] leading-none mb-3 font-display">
          ANATOMICAL <br />
          DECONSTRUCTION
        </h2>

        <p className="text-[#555760] text-xs sm:text-sm leading-relaxed max-w-md font-mono-tech mb-6">
          Isolate and inspect the four concentric performance layers engineered to sustain regulation pressure, eliminate flight wobble, and optimize fingertip touch.
        </p>
      </div>

      {/* Layer Selector Cards List */}
      <div className="w-full lg:max-w-md lg:ml-auto space-y-2.5 pointer-events-auto">
        <div className="flex items-center justify-between px-1 mb-1">
          <span className="font-mono-tech text-[10px] uppercase text-[#787A84] tracking-[0.2em] font-semibold">
            ISOLATE LAYER IN 3D
          </span>
          {selectedLayerId && (
            <button
              onClick={() => {
                sound.playMetallicClick();
                onSelectLayer(null);
              }}
              className="text-[10px] font-mono-tech text-[#121316] hover:underline cursor-pointer font-bold"
            >
              RESET VIEW
            </button>
          )}
        </div>

        {layers.map((layer, idx) => {
          const isSelected = selectedLayerId === layer.id;
          return (
            <div
              key={layer.id}
              id={`layer-card-${layer.id}`}
              onClick={() => {
                sound.playMetallicClick();
                onSelectLayer(isSelected ? null : layer.id);
              }}
              className={`deconstruct-layer-card p-4 rounded-xl border transition-all duration-200 cursor-pointer ${
                isSelected
                  ? 'bg-white/70 border-[#121316] shadow-md scale-[1.01]'
                  : 'bg-white/35 hover:bg-white/50 border-black/10'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono-tech text-xs font-bold text-[#121316]">
                    0{idx + 1}
                  </span>
                  <div>
                    <h4 className="text-xs font-bold text-[#121316] uppercase tracking-wider font-mono-tech">
                      {layer.name}
                    </h4>
                    <span className="text-[9px] text-[#787A84] font-mono-tech block">
                      {layer.tagline}
                    </span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded bg-black/5 text-[9px] font-mono-tech text-[#121316] font-bold border border-black/5">
                  {layer.thickness}
                </span>
              </div>

              {isSelected && (
                <div className="mt-3 pt-3 border-t border-black/10 space-y-2">
                  <p className="text-xs text-[#555760] leading-relaxed font-mono-tech">
                    {layer.description}
                  </p>
                  <div className="grid grid-cols-3 gap-2 pt-1">
                    {layer.specs.map((spec) => (
                      <div key={spec.label} className="p-2 rounded bg-white/40 border border-black/5">
                        <span className="block text-[8px] text-[#787A84] font-mono-tech uppercase">
                          {spec.label}
                        </span>
                        <span className="font-mono-tech text-[10px] font-bold text-[#121316]">
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
    </section>
  );
};
