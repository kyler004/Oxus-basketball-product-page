import React from 'react';
import { DeconstructedLayer, ThemeMode } from '../types';
import { palette } from '../utils/theme';
import { sound } from '../utils/audio';
import { SectionShell } from './SectionShell';

interface DeconstructionSectionProps {
  explosionProgress?: number;
  onExplosionChange?: (value: number) => void;
  selectedLayerId: string | null;
  onSelectLayer: (layerId: string | null) => void;
  themeMode?: ThemeMode;
}

const LAYERS: DeconstructedLayer[] = [
  {
    id: 'layer-outer',
    name: 'Composite leather',
    tagline: '',
    thickness: '1.4 mm',
    material: 'Cross-linked polyurethane & microfiber',
    description:
      'Laser-embossed micro-pebbles wick moisture from the palm during intense play.',
    color: '',
    offsetDistance: 2.8,
    specs: [
      { label: 'Pebbles', value: '18,400' },
      { label: 'Friction', value: '0.88 μ' },
      { label: 'Channel', value: '1.2 mm' },
    ],
  },
  {
    id: 'layer-windings',
    name: 'Nylon windings',
    tagline: '',
    thickness: '0.8 mm',
    material: 'Braided nylon monofilament',
    description:
      'Continuous polyamide thread wound across the sphere keeps the bounce perfectly round.',
    color: '',
    offsetDistance: 1.9,
    specs: [
      { label: 'Tensile', value: '2,400 N' },
      { label: 'Length', value: '1,840 m' },
      { label: 'Roundness', value: '99.98%' },
    ],
  },
  {
    id: 'layer-cushion',
    name: 'Cushion foam',
    tagline: '',
    thickness: '2.1 mm',
    material: 'Closed-cell elastomer',
    description: 'A micro-cellular matrix that absorbs impact and delivers a consistent rebound.',
    color: '',
    offsetDistance: 1.1,
    specs: [
      { label: 'Rebound', value: '82.4%' },
      { label: 'Density', value: '45 kg/m³' },
      { label: 'Impact', value: '14.2 G' },
    ],
  },
  {
    id: 'layer-core',
    name: 'Butyl bladder',
    tagline: '',
    thickness: '0.9 mm',
    material: 'Vulcanized butyl rubber',
    description: 'An airtight membrane calibrated to hold 8.0 PSI for months.',
    color: '',
    offsetDistance: 0.4,
    specs: [
      { label: 'Pressure', value: '8.0 PSI' },
      { label: 'Loss', value: '<0.01 %/mo' },
      { label: 'Valve', value: 'Dual' },
    ],
  },
];

export const DeconstructionSection: React.FC<DeconstructionSectionProps> = ({
  explosionProgress = 0,
  onExplosionChange,
  selectedLayerId,
  onSelectLayer,
  themeMode = 'day',
}) => {
  const p = palette(themeMode === 'night');
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
    <SectionShell
      id="anatomy"
      eyebrow="Anatomy"
      themeMode={themeMode}
      title={
        <>
          Four layers,
          <br />
          one sphere
        </>
      }
      description="Take the ball apart to see what sits beneath the leather. Select a layer to isolate it."
      actions={
        <button
          id="deconstruct-interactive-toggle-btn"
          onClick={handleToggleDeconstruct}
          className={`px-6 py-2.5 rounded-full text-[11px] font-bold tracking-wider uppercase transition-colors cursor-pointer ${p.primaryBtn}`}
        >
          {isDeconstructed ? 'Assemble' : 'Deconstruct'}
        </button>
      }
    >
      <ul className="flex flex-col gap-2">
        {LAYERS.map((layer, idx) => {
          const isSelected = selectedLayerId === layer.id;
          return (
            <li key={layer.id}>
              <button
                id={`layer-row-${layer.id}`}
                onClick={() => handleRowClick(layer.id)}
                aria-expanded={isSelected}
                className={`w-full text-left cursor-pointer transition-colors py-3 border-b-2 ${
                  isSelected ? `${p.rowActive} px-3` : p.rowIdle
                }`}
              >
                <span className="flex items-center justify-between gap-4">
                  <span className="flex items-center gap-3">
                    <span className={`text-xs font-bold ${p.accent}`}>0{idx + 1}</span>
                    <span className="text-sm font-semibold">{layer.name}</span>
                  </span>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${p.chip}`}>
                    {layer.thickness}
                  </span>
                </span>

                {isSelected && (
                  <span className="block mt-3 space-y-3">
                    <span className={`block text-xs leading-relaxed ${p.body}`}>
                      {layer.description}
                    </span>
                    <span className="grid grid-cols-3 gap-3">
                      {layer.specs.map((spec) => (
                        <span key={spec.label} className="flex flex-col">
                          <span className={`text-[10px] uppercase tracking-wider ${p.muted}`}>
                            {spec.label}
                          </span>
                          <span className={`text-xs font-bold ${p.heading}`}>{spec.value}</span>
                        </span>
                      ))}
                    </span>
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </SectionShell>
  );
};
