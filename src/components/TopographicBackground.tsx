import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ThemeMode } from '../types';

interface TopographicBackgroundProps {
  themeMode?: ThemeMode;
}

export const TopographicBackground: React.FC<TopographicBackgroundProps> = ({ themeMode = 'day' }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isNight = themeMode === 'night';
  const strokeColor = isNight ? '#4A4B56' : '#9A9AA2';
  const textColor = isNight ? '#7A7B8A' : '#85858F';

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Gentle floating animation on contour curves
      gsap.to('.topo-curve-1', {
        y: 12,
        duration: 8,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      });

      gsap.to('.topo-curve-2', {
        y: -10,
        x: 6,
        duration: 10,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
        delay: 0.5,
      });

      gsap.to('.topo-ring-center', {
        scale: 1.03,
        transformOrigin: '50% 50%',
        duration: 6,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      });

      // Subtle pulse on coordinates
      gsap.to('.topo-text', {
        opacity: 0.85,
        duration: 3,
        repeat: -1,
        yoyo: true,
        stagger: 0.6,
        ease: 'power1.inOut',
      });

      // Subtle rotation on tactical crosshairs
      gsap.to('.topo-crosshair', {
        rotation: 360,
        transformOrigin: 'center center',
        duration: 40,
        repeat: -1,
        ease: 'none',
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none opacity-40">
      <svg
        className="w-full h-full object-cover"
        viewBox="0 0 1440 900"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid slice"
      >
        {/* Organic Topographic Contour Curves */}
        <path
          className="topo-curve-1"
          d="M-100 120 C 200 40, 450 220, 720 160 C 990 100, 1200 240, 1540 180"
          stroke={strokeColor}
          strokeWidth="1.2"
          strokeDasharray="4 2"
          opacity="0.35"
        />
        <path
          className="topo-curve-2"
          d="M-80 180 C 240 90, 480 280, 740 220 C 1000 160, 1220 300, 1560 240"
          stroke={strokeColor}
          strokeWidth="1.2"
          opacity="0.45"
        />
        <path
          className="topo-curve-1"
          d="M-60 240 C 280 140, 520 340, 780 280 C 1040 220, 1260 360, 1580 300"
          stroke={strokeColor}
          strokeWidth="1.2"
          opacity="0.4"
        />

        {/* Central Closed Topo Contour Rings */}
        <path
          className="topo-ring-center"
          d="M 520 380 C 440 320, 360 400, 380 500 C 400 600, 580 640, 680 580 C 780 520, 840 420, 760 360 C 680 300, 600 440, 520 380 Z"
          stroke={strokeColor}
          strokeWidth="1.2"
          opacity="0.5"
        />
        <path
          className="topo-ring-center"
          d="M 550 410 C 480 360, 410 430, 420 510 C 430 590, 570 610, 650 560 C 730 510, 780 430, 720 380 C 660 330, 620 460, 550 410 Z"
          stroke={strokeColor}
          strokeWidth="1"
          opacity="0.4"
        />
        <path
          className="topo-ring-center"
          d="M 580 440 C 520 400, 470 450, 480 510 C 490 570, 580 580, 630 540 C 680 500, 720 440, 680 410 C 640 380, 640 480, 580 440 Z"
          stroke={strokeColor}
          strokeWidth="1.2"
          strokeDasharray="6 3"
          opacity="0.55"
        />

        {/* Outer Wave Topo Rings */}
        <path
          className="topo-curve-2"
          d="M-120 480 C 180 380, 320 620, 640 580 C 960 540, 1180 680, 1540 600"
          stroke={strokeColor}
          strokeWidth="1.2"
          opacity="0.38"
        />
        <path
          className="topo-curve-1"
          d="M-100 560 C 200 460, 360 700, 680 660 C 1000 620, 1220 760, 1560 680"
          stroke={strokeColor}
          strokeWidth="1.2"
          opacity="0.45"
        />
        <path
          className="topo-curve-2"
          d="M-80 640 C 220 540, 400 780, 720 740 C 1040 700, 1260 840, 1580 760"
          stroke={strokeColor}
          strokeWidth="1.2"
          opacity="0.35"
        />

        {/* Topographic Elevation Coordinate Marks */}
        <text className="topo-text" x="180" y="275" fill={textColor} fontSize="9" fontFamily="monospace" opacity="0.6">
          PRESSURE 8.0 PSI
        </text>
        <text className="topo-text" x="880" y="215" fill={textColor} fontSize="9" fontFamily="monospace" opacity="0.6">
          ARC RADIUS 23.75 FT
        </text>
        <text className="topo-text" x="320" y="695" fill={textColor} fontSize="9" fontFamily="monospace" opacity="0.6">
          ELEV 29.5" FIBA
        </text>
        <text className="topo-text" x="1120" y="635" fill={textColor} fontSize="9" fontFamily="monospace" opacity="0.6">
          COURT 94×50 FT
        </text>

        {/* Tactical Crosshair Markers */}
        <g className="topo-crosshair" stroke={strokeColor} strokeWidth="1" opacity="0.5">
          <line x1="140" y1="120" x2="160" y2="120" />
          <line x1="150" y1="110" x2="150" y2="130" />
        </g>

        <g className="topo-crosshair" stroke={strokeColor} strokeWidth="1" opacity="0.5">
          <line x1="1280" y1="140" x2="1300" y2="140" />
          <line x1="1290" y1="130" x2="1290" y2="150" />
        </g>

        <g className="topo-crosshair" stroke={strokeColor} strokeWidth="1" opacity="0.5">
          <line x1="120" y1="780" x2="140" y2="780" />
          <line x1="130" y1="770" x2="130" y2="790" />
        </g>

        <g className="topo-crosshair" stroke={strokeColor} strokeWidth="1" opacity="0.5">
          <line x1="1340" y1="760" x2="1360" y2="760" />
          <line x1="1350" y1="750" x2="1350" y2="770" />
        </g>
      </svg>
    </div>
  );
};
