import React, { useEffect, useRef } from 'react';
import { Wind } from 'lucide-react';
import { ThemeMode } from '../types';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

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
  const sectionRef = useRef<HTMLDivElement>(null);
  const isNight = themeMode === 'night';

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 75%',
          toggleActions: 'play none none none',
        },
      });

      tl.fromTo(
        '.aero-header > *',
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, stagger: 0.12, ease: 'power3.out' }
      ).fromTo(
        '.aero-telemetry-item',
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, stagger: 0.08, ease: 'power2.out' },
        '-=0.4'
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  // Aerodynamic computational figures
  const dragCoeff = 0.52 + (windSpeed / 120) * 0.04;
  const magnusLift = ((ballRpm / 300) * (windSpeed / 50) * 0.65).toFixed(2);
  const reynoldsNumber = Math.round((windSpeed * 1000 / 3600) * 0.24 * 1.225 / 1.81e-5);
  const trajectoryArchHeight = (3.05 + (parseFloat(magnusLift) * 0.42)).toFixed(2);

  return (
    <section
      ref={sectionRef}
      id="aerodynamics"
      className="relative w-full max-w-[1440px] mx-auto flex flex-col lg:flex-row lg:items-center justify-between gap-16 lg:gap-28 xl:gap-36 px-8 sm:px-14 lg:px-20 pointer-events-none"
    >
      {/* 1. Header & Concept (Directly on site) */}
      <div className="aero-header max-w-lg pointer-events-auto">
        <div className="inline-flex items-center gap-2 mb-3">
          <Wind className="w-4 h-4 text-emerald-400" />
          <span className={`font-mono-tech text-[10px] tracking-[0.25em] font-bold uppercase ${
            isNight ? 'text-emerald-400' : 'text-emerald-700'
          }`}>
            04 // FLIGHT DYNAMICS & MAGNUS SOLVER
          </span>
        </div>

        <h2 className={`text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-none mb-4 font-display ${
          isNight ? 'text-white' : 'text-[#121316]'
        }`}>
          AERODYNAMICS & <br />
          MAGNUS LIFT
        </h2>

        <p className={`text-xs sm:text-sm leading-relaxed max-w-md font-mono-tech mb-6 ${
          isNight ? 'text-[#D0D2DE]' : 'text-[#444650]'
        }`}>
          Real-time computational fluid dynamics solver. Rotational backspin induces velocity differentials across upper and lower boundary surfaces, generating continuous aerodynamic lift for soft rim descent.
        </p>

        {/* Live Wind Vector Status on Site (No card, steady indicator) */}
        <div className="flex items-center gap-6 pt-2 border-t border-black/10 dark:border-white/10 font-mono-tech text-xs">
          <div className="flex flex-col">
            <span className={`text-[9px] uppercase tracking-wider ${
              isNight ? 'text-[#8E90A0]' : 'text-[#656770]'
            }`}>
              WIND VELOCITY
            </span>
            <span className={`text-base font-bold ${isNight ? 'text-white' : 'text-[#121316]'}`}>
              {windSpeed} KM/H
            </span>
          </div>

          <div className="w-[1px] h-8 bg-black/10 dark:bg-white/10" />

          <div className="flex flex-col">
            <span className={`text-[9px] uppercase tracking-wider ${
              isNight ? 'text-[#8E90A0]' : 'text-[#656770]'
            }`}>
              BALL ROTATION
            </span>
            <span className={`text-base font-bold ${isNight ? 'text-white' : 'text-[#121316]'}`}>
              {ballRpm} RPM
            </span>
          </div>

          <div className="w-[1px] h-8 bg-black/10 dark:bg-white/10" />

          <div className="flex flex-col">
            <span className={`text-[9px] uppercase tracking-wider ${
              isNight ? 'text-[#8E90A0]' : 'text-[#656770]'
            }`}>
              ARC APEX HEIGHT
            </span>
            <span className={`text-base font-bold text-emerald-400`}>
              {trajectoryArchHeight} M
            </span>
          </div>
        </div>
      </div>

      {/* 2. Flight Analytics Telemetry Presented Directly on Site with Enlarged Horizontal Space */}
      <div className="w-full lg:max-w-lg lg:ml-auto pointer-events-auto font-mono-tech select-none space-y-6">
        <div className="flex items-center justify-between pb-2 border-b border-black/10 dark:border-white/10">
          <span className={`text-[11px] font-bold uppercase tracking-[0.25em] ${
            isNight ? 'text-[#C4C6D4]' : 'text-[#444650]'
          }`}>
            FLIGHT BALLISTICS TELEMETRY
          </span>
          <span className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-bold tracking-wider uppercase">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            CFD RUNNING
          </span>
        </div>

        {/* Telemetry Data Grid directly on the canvas background */}
        <div className="grid grid-cols-2 gap-x-10 gap-y-6">
          {/* Magnus Lift Force */}
          <div className="aero-telemetry-item flex flex-col">
            <span className={`text-[9px] uppercase tracking-widest font-semibold ${
              isNight ? 'text-[#8E90A0]' : 'text-[#656770]'
            }`}>
              MAGNUS LIFT FORCE (L)
            </span>
            <span className={`text-2xl sm:text-3xl font-extrabold font-display tracking-tight text-emerald-400 mt-0.5`}>
              +{magnusLift} N
            </span>
            <span className={`text-[9px] mt-1 ${isNight ? 'text-[#707280]' : 'text-[#7C7E8A]'}`}>
              Anti-gravitational upward force vector
            </span>
          </div>

          {/* Drag Coefficient */}
          <div className="aero-telemetry-item flex flex-col">
            <span className={`text-[9px] uppercase tracking-widest font-semibold ${
              isNight ? 'text-[#8E90A0]' : 'text-[#656770]'
            }`}>
              DRAG COEFFICIENT (Cd)
            </span>
            <span className={`text-2xl sm:text-3xl font-extrabold font-display tracking-tight ${
              isNight ? 'text-white' : 'text-[#121316]'
            } mt-0.5`}>
              {dragCoeff.toFixed(3)}
            </span>
            <span className={`text-[9px] mt-1 ${isNight ? 'text-[#707280]' : 'text-[#7C7E8A]'}`}>
              Turbulent boundary air friction
            </span>
          </div>

          {/* Reynolds Number */}
          <div className="aero-telemetry-item flex flex-col">
            <span className={`text-[9px] uppercase tracking-widest font-semibold ${
              isNight ? 'text-[#8E90A0]' : 'text-[#656770]'
            }`}>
              REYNOLDS NUMBER (Re)
            </span>
            <span className={`text-2xl sm:text-3xl font-extrabold font-display tracking-tight ${
              isNight ? 'text-white' : 'text-[#121316]'
            } mt-0.5`}>
              {reynoldsNumber.toLocaleString()}
            </span>
            <span className={`text-[9px] mt-1 ${isNight ? 'text-[#707280]' : 'text-[#7C7E8A]'}`}>
              Subcritical turbulent flow regime
            </span>
          </div>

          {/* Dynamic Boundary Transition */}
          <div className="aero-telemetry-item flex flex-col">
            <span className={`text-[9px] uppercase tracking-widest font-semibold ${
              isNight ? 'text-[#8E90A0]' : 'text-[#656770]'
            }`}>
              BOUNDARY LAYER
            </span>
            <span className={`text-2xl sm:text-3xl font-extrabold font-display tracking-tight text-sky-400 mt-0.5`}>
              LAMINAR
            </span>
            <span className={`text-[9px] mt-1 ${isNight ? 'text-[#707280]' : 'text-[#7C7E8A]'}`}>
              Pebble-induced vortex stabilization
            </span>
          </div>
        </div>

        {/* Linear Trajectory Coordinate Footnote directly on site */}
        <div className="aero-telemetry-item pt-4 border-t border-black/10 dark:border-white/10 flex items-center justify-between text-[10px]">
          <span className={isNight ? 'text-[#8E90A0]' : 'text-[#656770]'}>
            RELEASE VELOCITY: <strong className={isNight ? 'text-white' : 'text-[#121316]'}>7.82 M/S</strong>
          </span>
          <span className={isNight ? 'text-[#8E90A0]' : 'text-[#656770]'}>
            OPTIMAL ENTRY ANGLE: <strong className={isNight ? 'text-white' : 'text-[#121316]'}>48.5°</strong>
          </span>
        </div>
      </div>
    </section>
  );
};
