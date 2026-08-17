import React, { useEffect, useRef } from 'react';
import { Wind } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface AerodynamicsSectionProps {
  windSpeed?: number;
  onWindSpeedChange?: (speed: number) => void;
  ballRpm?: number;
  onBallRpmChange?: (rpm: number) => void;
}

export const AerodynamicsSection: React.FC<AerodynamicsSectionProps> = ({
  windSpeed = 65,
  ballRpm = 220,
}) => {
  const sectionRef = useRef<HTMLDivElement>(null);

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
      )
        .fromTo(
          '.aero-telemetry-card',
          { y: 35, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.6, ease: 'power3.out' },
          '-=0.4'
        )
        .fromTo(
          '.aero-tile',
          { scale: 0.9, opacity: 0 },
          { scale: 1, opacity: 1, duration: 0.5, stagger: 0.08, ease: 'back.out(1.4)' },
          '-=0.3'
        );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  // Compute aerodynamic calculations dynamically
  const dragCoeff = 0.52 + (windSpeed / 120) * 0.04;
  const magnusLift = ((ballRpm / 300) * (windSpeed / 50) * 0.65).toFixed(2);
  const reynoldsNumber = Math.round((windSpeed * 1000 / 3600) * 0.24 * 1.225 / 1.81e-5);

  return (
    <section
      ref={sectionRef}
      id="aerodynamics"
      className="relative w-full min-h-screen flex flex-col lg:flex-row lg:items-start justify-between gap-10 pt-28 pb-20 px-6 sm:px-12 pointer-events-none"
    >
      {/* Header & Wind Tunnel Controls */}
      <div className="aero-header max-w-xl pointer-events-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/40 border border-black/10 backdrop-blur-md mb-5">
          <Wind className="w-3.5 h-3.5 text-[#121316]" />
          <span className="font-mono-tech text-[10px] text-[#121316] tracking-[0.25em] font-semibold uppercase">
            04 // FLIGHT DYNAMICS
          </span>
        </div>

        <h2 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-[#121316] leading-none mb-3 font-display">
          AERODYNAMICS & <br />
          MAGNUS EFFECT
        </h2>

        <p className="text-[#555760] text-xs sm:text-sm leading-relaxed max-w-md font-mono-tech mb-6">
          Real-time wind-tunnel particle simulation. Backspin generates aerodynamic pressure differentials, creating the Magnus lift vector that stabilizes 3-point arcs and softens rim impact.
        </p>
      </div>

      {/* Flight Ballistics Telemetry Matrix */}
      <div className="w-full lg:max-w-md lg:ml-auto space-y-3 pointer-events-auto">
        <div className="aero-telemetry-card p-5 rounded-xl bg-white/45 backdrop-blur-md border border-black/10 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <span className="font-mono-tech text-[10px] uppercase text-[#787A84] tracking-[0.2em] font-semibold">
              FLIGHT BALLISTICS TELEMETRY
            </span>
            <span className="flex items-center gap-1.5 text-[10px] font-mono-tech text-emerald-700 font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
              SOLVER ACTIVE
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div className="aero-tile p-3 rounded-lg bg-black/5 border border-black/5">
              <span className="block text-[8px] font-mono-tech text-[#787A84] uppercase">
                MAGNUS LIFT FORCE (L)
              </span>
              <span className="font-mono-tech text-base font-extrabold text-[#121316]">
                +{magnusLift} N
              </span>
            </div>

            <div className="aero-tile p-3 rounded-lg bg-black/5 border border-black/5">
              <span className="block text-[8px] font-mono-tech text-[#787A84] uppercase">
                DRAG COEFFICIENT (Cd)
              </span>
              <span className="font-mono-tech text-base font-extrabold text-[#121316]">
                {dragCoeff.toFixed(3)}
              </span>
            </div>

            <div className="aero-tile p-3 rounded-lg bg-black/5 border border-black/5">
              <span className="block text-[8px] font-mono-tech text-[#787A84] uppercase">
                REYNOLDS NUMBER (Re)
              </span>
              <span className="font-mono-tech text-base font-extrabold text-[#121316]">
                {reynoldsNumber.toLocaleString()}
              </span>
            </div>

            <div className="aero-tile p-3 rounded-lg bg-black/5 border border-black/5">
              <span className="block text-[8px] font-mono-tech text-[#787A84] uppercase">
                TRAJECTORY TRUE RATIO
              </span>
              <span className="font-mono-tech text-base font-extrabold text-[#121316]">
                99.4%
              </span>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-white/40 border border-black/10 text-xs font-mono-tech text-[#555760] leading-relaxed">
            Turbulent boundary layer tripping over 8 recessed seams delays vortex separation, yielding a 14% flatter trajectory decay compared to standard spheres.
          </div>
        </div>
      </div>
    </section>
  );
};
