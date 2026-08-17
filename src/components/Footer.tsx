import React, { useState, useEffect, useRef } from 'react';
import { ShieldCheck, Award, ArrowUp, Send, Check } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { sound } from '../utils/audio';

gsap.registerPlugin(ScrollTrigger);

interface FooterProps {
  onScrollToSection: (sectionId: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onScrollToSection }) => {
  const [email, setEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const footerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.footer-col',
        { y: 30, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          stagger: 0.12,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: footerRef.current,
            start: 'top 85%',
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

  const scrollToTop = () => {
    sound.playMetallicClick();
    onScrollToSection('overview');
  };

  return (
    <footer
      ref={footerRef}
      className="relative z-30 bg-[#B3B3BC] border-t border-black/[0.08] pt-16 pb-12 px-6 sm:px-12 text-[#555760]"
    >
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
        {/* Brand & Manifesto */}
        <div className="footer-col md:col-span-2 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#121316] text-[#BEBEC6] flex items-center justify-center font-extrabold text-xs">
              KS
            </div>
            <div>
              <span className="font-extrabold text-sm sm:text-base tracking-[0.2em] text-[#121316] uppercase block">
                KINETIC SPHERE ®
              </span>
              <span className="text-[10px] text-[#787A84] font-mono-tech block font-semibold">
                Original. Not for retail
              </span>
            </div>
          </div>

          <p className="text-xs sm:text-sm font-mono-tech leading-relaxed max-w-md text-[#555760]">
            A masterwork of ballistics engineering. Designed to redefine regulation rebound symmetry, micro-channeled fingertip control, and pure rotational stability.
          </p>

          <div className="flex items-center gap-4 pt-2">
            <div className="flex items-center gap-1.5 text-xs font-mono-tech text-[#121316] font-bold">
              <ShieldCheck className="w-4 h-4" />
              <span>FIBA APPROVED LEVEL 1</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-mono-tech text-[#555760]">
              <Award className="w-4 h-4 text-[#121316]" />
              <span>ISO-9001 CALIBRATED</span>
            </div>
          </div>
        </div>

        {/* Section Links */}
        <div className="footer-col">
          <h4 className="font-mono-tech text-[11px] font-bold uppercase tracking-widest text-[#121316] mb-4">
            3D EXPERIENCE SECTIONS
          </h4>
          <ul className="space-y-2.5 text-xs font-mono-tech">
            {[
              { id: 'overview', label: '01 // OVERVIEW' },
              { id: 'anatomy', label: '02 // ANATOMY 3D' },
              { id: 'macro', label: '03 // GRIP & GRAIN' },
              { id: 'aerodynamics', label: '04 // AERODYNAMICS' },
              { id: 'bespoke', label: '05 // BESPOKE STUDIO' },
            ].map((link) => (
              <li key={link.id}>
                <button
                  onClick={() => {
                    sound.playMetallicClick();
                    onScrollToSection(link.id);
                  }}
                  className="text-[#6B6D76] hover:text-[#121316] transition-colors cursor-pointer text-left font-medium"
                >
                  {link.label}
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Limited Drop Newsletter */}
        <div className="footer-col">
          <h4 className="font-mono-tech text-[11px] font-bold uppercase tracking-widest text-[#121316] mb-4">
            LIMITED EDITION ALERTS
          </h4>
          <p className="text-xs font-mono-tech text-[#555760] mb-3">
            Receive priority allocations for numbered 500-unit pro tour production runs.
          </p>

          {isSubscribed ? (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-700/10 border border-emerald-700/25 text-xs font-mono-tech text-emerald-800">
              <Check className="w-4 h-4 stroke-[3]" />
              <span className="font-bold">PRIORITY ALLOCATION CONFIRMED</span>
            </div>
          ) : (
            <form onSubmit={handleSubscribe} className="space-y-2">
              <div className="relative">
                <input
                  type="email"
                  required
                  placeholder="Enter email..."
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/40 border border-black/10 text-xs text-[#121316] font-mono-tech focus:outline-none focus:border-[#121316] pr-10"
                />
                <button
                  type="submit"
                  className="absolute right-2 top-2 p-1 text-[#121316] hover:text-black"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="max-w-7xl mx-auto pt-8 border-t border-black/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] font-mono-tech text-[#787A84]">
        <p>© 2026 THE KINETIC SPHERE LABS. ALL RIGHTS RESERVED.</p>

        <button
          onClick={scrollToTop}
          className="flex items-center gap-1.5 text-[#555760] hover:text-[#121316] transition-colors cursor-pointer font-bold"
        >
          <span>RETURN TO APEX</span>
          <ArrowUp className="w-3.5 h-3.5" />
        </button>
      </div>
    </footer>
  );
};
