import React from 'react';
import { ThemeMode } from '../types';
import { palette } from '../utils/theme';
import { SectionShell } from './SectionShell';

interface AerodynamicsSectionProps {
  windSpeed?: number;
  onWindSpeedChange?: (speed: number) => void;
  ballRpm?: number;
  onBallRpmChange?: (rpm: number) => void;
  themeMode?: ThemeMode;
}

export const AerodynamicsSection: React.FC<AerodynamicsSectionProps> = ({
  windSpeed = 65,
  ballRpm = 220,
  themeMode = 'day',
}) => {
  const p = palette(themeMode === 'night');

  const dragCoeff = 0.52 + (windSpeed / 120) * 0.04;
  const magnusLift = ((ballRpm / 300) * (windSpeed / 50) * 0.65).toFixed(2);

  const metrics = [
    { label: 'Wind velocity', value: `${windSpeed} km/h`, highlight: false },
    { label: 'Ball rotation', value: `${ballRpm} rpm`, highlight: false },
    { label: 'Magnus lift', value: `+${magnusLift} N`, highlight: true },
    { label: 'Drag coefficient', value: dragCoeff.toFixed(3), highlight: false },
  ];

  return (
    <SectionShell
      id="aerodynamics"
      eyebrow="Aerodynamics"
      themeMode={themeMode}
      title={
        <>
          Built for
          <br />
          true flight
        </>
      }
      description="Backspin creates a pressure difference across the ball, generating lift for a soft, controlled descent into the rim."
    >
      <dl className="grid grid-cols-2 gap-x-8 gap-y-8">
        {metrics.map((m) => (
          <div key={m.label} className={`pt-3 border-t ${p.line}`}>
            <dt className={`text-[10px] uppercase tracking-wider ${p.muted}`}>{m.label}</dt>
            <dd
              className={`font-display text-2xl font-extrabold mt-1 ${
                m.highlight ? p.accent : p.heading
              }`}
            >
              {m.value}
            </dd>
          </div>
        ))}
      </dl>
    </SectionShell>
  );
};
