import React, { useState, useEffect, useRef } from 'react';
import { 
  ShieldCheck, 
  Award, 
  ArrowUp, 
  Send, 
  Check, 
  ArrowUpRight, 
  Activity, 
  Layers, 
  Compass, 
  Sparkles, 
  ExternalLink, 
  ChevronRight,
  Disc,
  Flame,
  Globe,
  Radio
} from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { BallConfig, ThemeMode } from '../types';
import { sound } from '../utils/audio';

gsap.registerPlugin(ScrollTrigger);

interface FooterProps {
  onScrollToSection: (sectionId: string) => void;
  themeMode: ThemeMode;
  config: BallConfig;
  onOpenCourtSandbox?: () => void;
  onOpenReserveModal?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ 
  onScrollToSection, 
  themeMode, 
  config,
  onOpenCourtSandbox,
  onOpenReserveModal 
}) => {
  const [email, setEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [serialQuery, setSerialQuery] = useState('');
  const [serialStatus, setSerialStatus] = useState<string | null>(null);
  const [liveTimestamp, setLiveTimestamp] = useState('');
  const footerRef = useRef<HTMLElement>(null);

  const isNight = themeMode === 'night';

  // Live UTC Clock for Atelier telemetry
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setLiveTimestamp(
        now.toISOString().substring(11, 19) + ' UTC // LAB-09'
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.footer-col',
        { y: 35, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.75,
          stagger: 0.08,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: footerRef.current,
            start: 'top 90%',
            toggleActions: 'play none none none',
          },
        }
      );
    }, footerRef);

    return () => ctx.revert();
  }, []);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    sound.playMetallicClick();
    setIsSubscribed(true);
  };

  const handleVerifySerial = (e: React.FormEvent) => {
    e.preventDefault();
    if (!serialQuery) return;
    sound.playMetallicClick();
    setSerialStatus(`VALIDATED: REGISTERED TO BATCH 001 // ${serialQuery.toUpperCase()}`);
    setTimeout(() => {
      setSerialStatus(null);
    }, 5000);
  };

  const scrollToTop = () => {
    sound.playMetallicClick();
    onScrollToSection('overview');
  };

  return (
    <footer
      ref={footerRef}
      id="bespoke-atelier-footer"
      className={`relative z-30 w-full overflow-y-auto max-h-screen transition-colors duration-500 font-mono-tech ${
        isNight
          ? 'bg-[#0B0C0E]/95 text-[#C4C6D2] border-t border-white/10'
          : 'bg-[#B0B0BA]/95 text-[#3A3C44] border-t border-black/15'
      }`}
    >
      {/* Top Animated Ticker Marquee */}
      <div 
        className={`w-full py-2.5 px-4 border-b overflow-hidden select-none text-[10px] tracking-[0.25em] uppercase font-bold flex items-center justify-between ${
          isNight 
            ? 'bg-black/60 border-white/10 text-white/70' 
            : 'bg-black/5 border-black/10 text-[#121316]/75'
        }`}
      >
        <div className="flex items-center gap-3 shrink-0">
          <span className="flex items-center gap-1.5 text-emerald-500 font-bold">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            ATELIER STATUS: PRO TOUR ACTIVE
          </span>
          <span className="opacity-30">|</span>
          <span className="hidden sm:inline">CALIBRATION: 7.8 PSI NITROGEN PURGED</span>
          <span className="hidden sm:inline opacity-30">|</span>
          <span className="hidden md:inline">HYDROPHOBIC LEATHER GRADE: 100% S-GRADE</span>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <span className="text-[10px] opacity-75 font-mono">{liveTimestamp}</span>
        </div>
      </div>

      {/* Main Grid Content */}
      <div className="max-w-[1400px] mx-auto px-6 sm:px-12 lg:px-16 pt-12 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12 mb-12">
          
          {/* Column 1: Brand & Atelier Engineering Manifesto */}
          <div className="footer-col space-y-5">
            <div className="flex items-center gap-3.5">
              <button
                onClick={scrollToTop}
                className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all cursor-pointer group ${
                  isNight 
                    ? 'bg-white/10 border-white/20 text-white hover:bg-white hover:text-[#121316]' 
                    : 'bg-black/10 border-black/15 text-[#121316] hover:bg-[#121316] hover:text-white'
                }`}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polygon points="12 2 2 22 22 22" />
                </svg>
              </button>
              <div>
                <span className={`font-extrabold text-base tracking-[0.2em] uppercase block ${
                  isNight ? 'text-white' : 'text-[#121316]'
                }`}>
                  KINETIC SPHERE ®
                </span>
                <span className="text-[10px] tracking-wider uppercase opacity-60 block font-semibold">
                  AEROSPACE BALLISTICS LAB // LOT 001
                </span>
              </div>
            </div>

            <p className="text-xs leading-relaxed opacity-85">
              Engineered at the intersection of computational fluid dynamics and heritage leather craftsmanship. Calibrated for true-arc flight symmetry, dynamic Magnus stability, and instantaneous tactile grip response.
            </p>

            {/* Certifications and Badges */}
            <div className="space-y-2 pt-1">
              <div className={`flex items-center gap-2 text-[11px] font-bold py-1.5 px-3 rounded-lg border ${
                isNight 
                  ? 'bg-white/5 border-white/10 text-white' 
                  : 'bg-white/40 border-black/10 text-[#121316]'
              }`}>
                <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>FIBA APPROVED OFFICIAL LEVEL 1 SPEC</span>
              </div>

              <div className={`flex items-center gap-2 text-[11px] font-bold py-1.5 px-3 rounded-lg border ${
                isNight 
                  ? 'bg-white/5 border-white/10 text-white' 
                  : 'bg-white/40 border-black/10 text-[#121316]'
              }`}>
                <Award className="w-4 h-4 text-amber-400 shrink-0" />
                <span>ISO-9001 AERODYNAMIC REBOUND CERTIFIED</span>
              </div>
            </div>
          </div>

          {/* Column 2: 3D Experience Matrix & Interactive Launchers */}
          <div className="footer-col space-y-4">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-sky-400" />
              <h4 className={`text-xs font-extrabold uppercase tracking-widest ${
                isNight ? 'text-white' : 'text-[#121316]'
              }`}>
                3D SIMULATION MATRIX
              </h4>
            </div>

            <ul className="space-y-2 text-xs">
              {[
                { id: 'overview', num: '01', label: 'Overview & Apex Trajectory' },
                { id: 'anatomy', num: '02', label: '3D Anatomical Deconstruction' },
                { id: 'macro', num: '03', label: 'Macro Pebble & Micro-Grain' },
                { id: 'aerodynamics', num: '04', label: 'Wind Tunnel Aerodynamics' },
                { id: 'bespoke', num: '05', label: 'Bespoke Customizer Studio' },
              ].map((link) => (
                <li key={link.id}>
                  <button
                    onClick={() => {
                      sound.playMetallicClick();
                      onScrollToSection(link.id);
                    }}
                    className={`w-full flex items-center justify-between py-1 px-2 rounded-md transition-all cursor-pointer text-left group ${
                      isNight 
                        ? 'hover:bg-white/10 hover:text-white text-white/70' 
                        : 'hover:bg-black/10 hover:text-[#121316] text-[#121316]/75'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-[10px] opacity-40 font-mono">{link.num}</span>
                      <span className="font-semibold">{link.label}</span>
                    </span>
                    <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                  </button>
                </li>
              ))}
            </ul>

            {/* Quick action buttons */}
            <div className="pt-2 flex flex-col gap-2">
              {onOpenCourtSandbox && (
                <button
                  onClick={() => {
                    sound.playMetallicClick();
                    onOpenCourtSandbox();
                  }}
                  className={`w-full py-2 px-3 rounded-lg border text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    isNight 
                      ? 'bg-[#181A22] border-white/20 text-white hover:bg-white hover:text-black' 
                      : 'bg-white/60 border-black/15 text-[#121316] hover:bg-[#121316] hover:text-white'
                  }`}
                >
                  <Activity className="w-3.5 h-3.5" />
                  <span>Court Physics Sandbox</span>
                </button>
              )}

              {onOpenReserveModal && (
                <button
                  onClick={() => {
                    sound.playMetallicClick();
                    onOpenReserveModal();
                  }}
                  className={`w-full py-2 px-3 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    isNight 
                      ? 'bg-amber-400 text-black hover:bg-amber-300' 
                      : 'bg-[#121316] text-white hover:bg-[#252830]'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Reserve Bespoke Allocation</span>
                </button>
              )}
            </div>
          </div>

          {/* Column 3: Live Customization Telemetry & Specs */}
          <div className="footer-col space-y-4">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-400" />
              <h4 className={`text-xs font-extrabold uppercase tracking-widest ${
                isNight ? 'text-white' : 'text-[#121316]'
              }`}>
                ACTIVE BALL TELEMETRY
              </h4>
            </div>

            <div className={`p-3.5 rounded-xl border text-xs space-y-2.5 ${
              isNight ? 'bg-white/5 border-white/10' : 'bg-white/50 border-black/10'
            }`}>
              <div className="flex items-center justify-between pb-2 border-b border-current/10">
                <span className="opacity-60 text-[10px]">EDITION:</span>
                <span className="font-bold uppercase tracking-wider">{config.edition}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="opacity-60 text-[10px]">LEATHER COLOR:</span>
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full border border-black/20" 
                    style={{ backgroundColor: config.leatherColor }}
                  />
                  <span className="font-semibold text-[11px] truncate max-w-[120px]">{config.leatherName}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="opacity-60 text-[10px]">MONOGRAM FOIL:</span>
                <span className="font-semibold uppercase text-[11px]">{config.monogramFoil}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="opacity-60 text-[10px]">GRIP CHANNEL:</span>
                <span className="font-semibold uppercase text-[11px]">{config.gripDensity}</span>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-current/10 text-[10px]">
                <span className="opacity-60">REGISTRY CODE:</span>
                <span className="font-mono text-emerald-500 font-bold">{config.monogramText || 'KS-ELITE'}</span>
              </div>
            </div>

            {/* Serial Number Validator Form */}
            <form onSubmit={handleVerifySerial} className="space-y-1.5">
              <label className="text-[10px] tracking-wider uppercase opacity-60 block font-semibold">
                SERIAL NUMBER AUTHENTICITY QUERY
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g. KS-001/500"
                  value={serialQuery}
                  onChange={(e) => setSerialQuery(e.target.value)}
                  className={`w-full px-3 py-1.5 rounded-lg text-xs pr-8 font-mono border focus:outline-none ${
                    isNight
                      ? 'bg-black/40 border-white/20 text-white placeholder:text-white/30 focus:border-amber-400'
                      : 'bg-white/70 border-black/15 text-[#121316] placeholder:text-black/40 focus:border-[#121316]'
                  }`}
                />
                <button
                  type="submit"
                  title="Verify Serial"
                  className="absolute right-2 top-1.5 p-1 text-current opacity-70 hover:opacity-100 cursor-pointer"
                >
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
              {serialStatus && (
                <p className="text-[10px] text-emerald-500 font-bold animate-pulse pt-0.5">
                  {serialStatus}
                </p>
              )}
            </form>
          </div>

          {/* Column 4: Limited Drop Registry & VIP Newsletter */}
          <div className="footer-col space-y-4">
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-amber-400" />
              <h4 className={`text-xs font-extrabold uppercase tracking-widest ${
                isNight ? 'text-white' : 'text-[#121316]'
              }`}>
                VIP DISPATCH REGISTRY
              </h4>
            </div>

            <p className="text-xs leading-relaxed opacity-80">
              Join the priority allocation roster. Receive private access keys for upcoming 500-unit handcrafted tour editions before public drop windows.
            </p>

            {isSubscribed ? (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 space-y-1">
                <div className="flex items-center gap-2 text-xs font-bold">
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>ALLOCATION ACCESS GRANTED</span>
                </div>
                <p className="text-[10px] opacity-80">
                  Priority key dispatched to {email}. You will receive 48-hour early checkout access for Drop 02.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="space-y-2">
                <div className="relative">
                  <input
                    type="email"
                    required
                    placeholder="Enter athlete or studio email..."
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-xs pr-10 focus:outline-none transition-all ${
                      isNight
                        ? 'bg-black/50 border-white/20 text-white placeholder:text-white/40 focus:border-amber-400 focus:bg-black/70'
                        : 'bg-white/60 border-black/20 text-[#121316] placeholder:text-black/40 focus:border-[#121316] focus:bg-white'
                    }`}
                  />
                  <button
                    type="submit"
                    title="Register"
                    className={`absolute right-2 top-2 p-1.5 rounded-lg transition-colors cursor-pointer ${
                      isNight ? 'bg-white/10 hover:bg-white text-white hover:text-black' : 'bg-black/10 hover:bg-black text-black hover:text-white'
                    }`}
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-[10px] opacity-50 flex items-center gap-1">
                  <span>🔒 End-to-end encrypted VIP queue. No spam ever.</span>
                </p>
              </form>
            )}

            {/* Atelier Socials */}
            <div className="pt-2">
              <span className="text-[10px] tracking-wider uppercase opacity-60 block font-semibold mb-2">
                LAB COMMUNITY & ARCHIVE
              </span>
              <div className="flex items-center gap-2 flex-wrap text-xs">
                {[
                  { name: 'X.COM', url: '#' },
                  { name: 'INSTAGRAM', url: '#' },
                  { name: 'DISCORD', url: '#' },
                  { name: 'YOUTUBE 4K', url: '#' },
                ].map((soc) => (
                  <a
                    key={soc.name}
                    href={soc.url}
                    onClick={(e) => {
                      e.preventDefault();
                      sound.playMetallicClick();
                    }}
                    className={`px-2.5 py-1 rounded-md border text-[10px] font-bold tracking-wider transition-all ${
                      isNight
                        ? 'bg-white/5 border-white/10 text-white/80 hover:bg-white hover:text-black'
                        : 'bg-black/5 border-black/10 text-[#121316]/80 hover:bg-[#121316] hover:text-white'
                    }`}
                  >
                    {soc.name}
                  </a>
                ))}
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Horizon Sub-bar */}
        <div className={`pt-6 border-t flex flex-col md:flex-row items-center justify-between gap-4 text-[11px] ${
          isNight ? 'border-white/10 text-white/50' : 'border-black/10 text-[#121316]/60'
        }`}>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-center md:text-left">
            <span className="font-bold text-current">© 2026 THE KINETIC SPHERE ATELIER LABS.</span>
            <span>ALL RIGHTS RESERVED.</span>
            <span className="hidden lg:inline">•</span>
            <span className="hidden lg:inline">PATENT PENDING PCT/US2026/04881</span>
          </div>

          <div className="flex items-center gap-6">
            <button
              onClick={() => {
                sound.playMetallicClick();
                alert('Ballistics Calibration Sheet: ASTM F1882-06 & FIBA Level 1 Standard Rebound 1,420mm - 1,450mm verified.');
              }}
              className="hover:text-current underline decoration-current/30 cursor-pointer"
            >
              FIBA SPEC SHEET
            </button>
            <button
              onClick={() => {
                sound.playMetallicClick();
                alert('Privacy Protocol: Zero telemetry stored without cryptographic athlete consent.');
              }}
              className="hover:text-current underline decoration-current/30 cursor-pointer"
            >
              PRIVACY PROTOCOL
            </button>
            <button
              onClick={scrollToTop}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all cursor-pointer font-bold ${
                isNight 
                  ? 'bg-white/10 border-white/20 text-white hover:bg-white hover:text-black' 
                  : 'bg-black/10 border-black/15 text-[#121316] hover:bg-[#121316] hover:text-white'
              }`}
            >
              <span>RETURN TO APEX</span>
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
