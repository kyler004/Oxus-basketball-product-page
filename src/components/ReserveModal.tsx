import React, { useState, useEffect, useRef } from 'react';
import { BallConfig, BallEdition, ThemeMode } from '../types';
import { X, Check, ShieldCheck, Sparkles, Box, QrCode, ArrowRight, ArrowLeft, Award, Lock } from 'lucide-react';
import { sound } from '../utils/audio';
import gsap from 'gsap';

interface ReserveModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: BallConfig;
  onUpdateConfig?: (updated: Partial<BallConfig>) => void;
  themeMode?: ThemeMode;
}

const EDITIONS = [
  {
    id: 'heritage' as BallEdition,
    name: 'Heritage Amber Clay',
    colorA: '#D45B10',
    colorB: '#94380E',
    basePrice: 260,
    serialPrefix: 'ED-01',
    limit: 500,
    leadTime: '3-5 Business Days',
    description: 'Original cured regulation composite with high-friction micro-pores and classic hardwood amber tone.',
  },
  {
    id: 'stealth' as BallEdition,
    name: 'Night Stealth Obsidian',
    colorA: '#1E1F24',
    colorB: '#121316',
    basePrice: 280,
    serialPrefix: 'ED-02',
    limit: 500,
    leadTime: '4-6 Business Days',
    description: 'Triple-black tactical stealth finish with low-reflection matte pebble grain.',
  },
  {
    id: 'eclipse' as BallEdition,
    name: 'Coyote Gold Horizon',
    colorA: '#968770',
    colorB: '#6B5E4B',
    basePrice: 310,
    serialPrefix: 'ED-03',
    limit: 500,
    leadTime: '5-7 Business Days',
    description: 'Tactical coyote bronze composite with 24K mirror foil channels.',
  },
  {
    id: 'monolith' as BallEdition,
    name: 'Camo Sage Drab',
    colorA: '#4E5B4E',
    colorB: '#364036',
    basePrice: 275,
    serialPrefix: 'ED-04',
    limit: 500,
    leadTime: '3-5 Business Days',
    description: 'Tactical olive-drab matte composite with non-slip low-reflection grip topography.',
  },
  {
    id: 'olympus' as BallEdition,
    name: 'Olympus Concrete Ivory',
    colorA: '#E2E4E8',
    colorB: '#C0C4CC',
    basePrice: 320,
    serialPrefix: 'ED-05',
    limit: 500,
    leadTime: '7-10 Business Days',
    description: 'Pure exhibition ivory finish accented with titanium monogramming.',
  },
];

const STEPS = [
  { step: 1, label: 'FINISH EDITION', short: '01 FINISH' },
  { step: 2, label: 'SPECIFICATIONS', short: '02 SPECS' },
  { step: 3, label: 'DISPATCH DETAILS', short: '03 DETAILS' },
  { step: 4, label: 'CERTIFICATE', short: '04 CERTIFICATE' },
];

export const ReserveModal: React.FC<ReserveModalProps> = ({
  isOpen,
  onClose,
  config,
  onUpdateConfig,
  themeMode = 'day',
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const contentStepRef = useRef<HTMLDivElement>(null);
  const isNight = themeMode === 'night';

  const [currentStep, setCurrentStep] = useState<number>(1);
  const [selectedEditionId, setSelectedEditionId] = useState<BallEdition>(config.edition || 'heritage');
  const [monogram, setMonogram] = useState('KS-24');
  const [size, setSize] = useState<'size7' | 'size6'>('size7');
  const [packaging, setPackaging] = useState<'vault' | 'standard'>('vault');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [country, setCountry] = useState('United States');
  const [assignedSerial, setAssignedSerial] = useState('');

  const activeEdition = EDITIONS.find((e) => e.id === selectedEditionId) || EDITIONS[0];
  const totalPrice = activeEdition.basePrice + (packaging === 'vault' ? 80 : 0);

  useEffect(() => {
    if (isOpen) {
      setCurrentStep(1);
      const randomUnit = Math.floor(Math.random() * 480) + 1;
      setAssignedSerial(`${activeEdition.serialPrefix} // #${String(randomUnit).padStart(3, '0')}/${activeEdition.limit}`);
      
      const ctx = gsap.context(() => {
        gsap.fromTo(
          modalRef.current,
          { scale: 0.95, opacity: 0, y: 15 },
          { scale: 1, opacity: 1, y: 0, duration: 0.4, ease: 'power3.out' }
        );
      }, modalRef);
      return () => ctx.revert();
    }
  }, [isOpen]);

  // Step transition animation
  useEffect(() => {
    if (contentStepRef.current) {
      gsap.fromTo(
        contentStepRef.current,
        { opacity: 0, x: 20 },
        { opacity: 1, x: 0, duration: 0.35, ease: 'power2.out' }
      );
    }
  }, [currentStep]);

  if (!isOpen) return null;

  const handleSelectEdition = (editionId: BallEdition) => {
    sound.playMetallicClick();
    setSelectedEditionId(editionId);
    const ed = EDITIONS.find((e) => e.id === editionId);
    if (ed) {
      const randomUnit = Math.floor(Math.random() * 480) + 1;
      setAssignedSerial(`${ed.serialPrefix} // #${String(randomUnit).padStart(3, '0')}/${ed.limit}`);
      if (onUpdateConfig) {
        onUpdateConfig({ edition: editionId, leatherName: ed.name });
      }
    }
  };

  const handleNextStep = () => {
    sound.playMetallicClick();
    if (currentStep < 4) {
      if (currentStep === 3) {
        sound.playDeconstructTone(false);
      }
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrevStep = () => {
    sound.playMetallicClick();
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  return (
    <div
      id="reserve-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-8 bg-black/75 backdrop-blur-xl transition-all duration-300 pointer-events-auto select-none"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          sound.playMetallicClick();
          onClose();
        }
      }}
    >
      <div
        ref={modalRef}
        id="reserve-modal-container"
        className={`relative w-full max-w-3xl max-h-[90vh] flex flex-col rounded-2xl border transition-all duration-300 font-mono-tech ${
          isNight
            ? 'bg-[#15161C] border-white/15 text-white shadow-2xl shadow-black/80'
            : 'bg-[#EDEDF2] border-black/15 text-[#121316] shadow-2xl shadow-black/20'
        }`}
      >
        {/* 1. Modal Top Header Bar */}
        <div className={`flex items-center justify-between px-6 sm:px-8 py-4 border-b shrink-0 ${
          isNight ? 'bg-[#15161C] border-white/10' : 'bg-[#EDEDF2] border-black/10'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${
              isNight ? 'bg-white/10 border-white/20 text-white' : 'bg-black/5 border-black/15 text-[#121316]'
            }`}>
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className={`text-sm sm:text-base font-extrabold tracking-tight font-display ${
                isNight ? 'text-white' : 'text-[#121316]'
              }`}>
                RESERVE BESPOKE ALLOCATION
              </h3>
              <p className={`text-[10px] tracking-wider uppercase ${
                isNight ? 'text-[#8E90A0]' : 'text-[#656770]'
              }`}>
                FIBA 29.5" MATCH SPECIFICATION // 8.0 PSI NITROGEN
              </p>
            </div>
          </div>

          <button
            id="close-reserve-modal-btn"
            onClick={() => {
              sound.playMetallicClick();
              onClose();
            }}
            title="Close Reservation"
            className={`p-2 rounded-full border transition-all cursor-pointer ${
              isNight
                ? 'border-white/10 hover:border-white/30 text-white/70 hover:text-white bg-white/5'
                : 'border-black/10 hover:border-black/30 text-[#121316]/70 hover:text-[#121316] bg-black/5'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 2. Step Progress Navigation Bar */}
        <div className={`flex items-center justify-between px-6 sm:px-8 py-3 border-b overflow-x-auto text-[11px] shrink-0 ${
          isNight ? 'border-white/10 bg-white/[0.02]' : 'border-black/10 bg-black/[0.02]'
        }`}>
          {STEPS.map((s) => {
            const isActive = currentStep === s.step;
            const isCompleted = currentStep > s.step;
            return (
              <div
                key={s.step}
                className={`flex items-center gap-2 whitespace-nowrap transition-colors ${
                  isActive
                    ? isNight ? 'text-white font-bold' : 'text-[#121316] font-bold'
                    : isCompleted
                    ? 'text-emerald-500 font-semibold'
                    : isNight ? 'text-white/40' : 'text-black/40'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border transition-colors ${
                    isActive
                      ? isNight ? 'bg-white text-[#121316] border-white' : 'bg-[#121316] text-white border-[#121316]'
                      : isCompleted
                      ? 'bg-emerald-500/20 text-emerald-500 border-emerald-500/40'
                      : isNight ? 'border-white/20 text-white/40' : 'border-black/20 text-black/40'
                  }`}
                >
                  {isCompleted ? <Check className="w-3 h-3 stroke-[3]" /> : s.step}
                </div>
                <span className="hidden sm:inline tracking-wider">{s.label}</span>
                <span className="sm:hidden tracking-wider">{s.short}</span>
                {s.step < 4 && (
                  <span className={`mx-2 ${isNight ? 'text-white/20' : 'text-black/20'}`}>—</span>
                )}
              </div>
            );
          })}
        </div>

        {/* 3. Step Content Area (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8">
          <div ref={contentStepRef} className="max-w-2xl mx-auto">
            {/* STEP 1: FINISH & EDITION SELECTION */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div>
                  <h4 className={`text-base sm:text-lg font-bold font-display uppercase tracking-tight ${
                    isNight ? 'text-white' : 'text-[#121316]'
                  }`}>
                    01 // SELECT BESPOKE LEATHER FINISH
                  </h4>
                  <p className={`text-xs mt-1 leading-relaxed ${
                    isNight ? 'text-[#8E90A0]' : 'text-[#656770]'
                  }`}>
                    Each batch is hand-cured, serialized, and strictly limited to 500 units globally.
                  </p>
                </div>

                <div className="flex flex-col gap-2.5">
                  {EDITIONS.map((ed) => {
                    const isSelected = selectedEditionId === ed.id;
                    return (
                      <div
                        key={ed.id}
                        id={`step1-edition-${ed.id}`}
                        onClick={() => handleSelectEdition(ed.id)}
                        className={`group flex items-center justify-between p-3.5 rounded-xl border transition-all cursor-pointer ${
                          isSelected
                            ? isNight
                              ? 'border-white bg-white/10 text-white shadow-sm'
                              : 'border-[#121316] bg-black/5 text-[#121316] shadow-sm'
                            : isNight
                            ? 'border-white/10 text-white/70 hover:border-white/25 hover:bg-white/[0.03]'
                            : 'border-black/10 text-[#121316]/70 hover:border-black/25 hover:bg-black/[0.03]'
                        }`}
                      >
                        <div className="flex items-center gap-3.5">
                          <div
                            className="w-7 h-7 rounded-full border border-black/20 shrink-0 shadow-sm"
                            style={{
                              background: `linear-gradient(135deg, ${ed.colorA}, ${ed.colorB})`,
                            }}
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <h5 className="text-xs uppercase tracking-wider font-bold">
                                {ed.name}
                              </h5>
                              <span className={`text-[9px] px-1.5 py-0.5 rounded ${
                                isNight ? 'bg-white/10 text-white/80' : 'bg-black/10 text-[#121316]/80'
                              }`}>
                                {ed.serialPrefix}
                              </span>
                            </div>
                            <p className={`text-[10px] mt-0.5 max-w-md line-clamp-1 ${
                              isNight ? 'text-[#8E90A0]' : 'text-[#656770]'
                            }`}>
                              {ed.description}
                            </p>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className={`text-sm font-bold block ${
                            isNight ? 'text-white' : 'text-[#121316]'
                          }`}>
                            ${ed.basePrice} USD
                          </span>
                          <span className="text-[9px] text-emerald-500 font-semibold uppercase">
                            {ed.leadTime}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* STEP 2: SPECIFICATIONS & MONOGRAM */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div>
                  <h4 className={`text-base sm:text-lg font-bold font-display uppercase tracking-tight ${
                    isNight ? 'text-white' : 'text-[#121316]'
                  }`}>
                    02 // CALIBRATION & BESPOKE CUSTOMIZATION
                  </h4>
                  <p className={`text-xs mt-1 leading-relaxed ${
                    isNight ? 'text-[#8E90A0]' : 'text-[#656770]'
                  }`}>
                    Configure court sizing, custom laser monogram hot-stamping, and packaging vault.
                  </p>
                </div>

                {/* Sizing selection */}
                <div className="space-y-2">
                  <label className={`text-[11px] uppercase tracking-wider font-bold ${
                    isNight ? 'text-[#8E90A0]' : 'text-[#656770]'
                  }`}>
                    REGULATION SIZING SPECIFICATION
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      id="spec-size-7"
                      onClick={() => {
                        sound.playMetallicClick();
                        setSize('size7');
                      }}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        size === 'size7'
                          ? isNight
                            ? 'border-white bg-white/10 text-white font-bold'
                            : 'border-[#121316] bg-black/5 text-[#121316] font-bold'
                          : isNight
                          ? 'border-white/10 text-white/60 hover:border-white/20'
                          : 'border-black/10 text-[#121316]/60 hover:border-black/20'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs">SIZE 7 (OFFICIAL MATCH)</span>
                        <span className="text-[10px] opacity-70">29.5 IN</span>
                      </div>
                      <span className={`text-[9px] block mt-1 ${isNight ? 'text-[#8E90A0]' : 'text-[#656770]'}`}>
                        NBA / FIBA Men's Professional Regulation
                      </span>
                    </button>

                    <button
                      type="button"
                      id="spec-size-6"
                      onClick={() => {
                        sound.playMetallicClick();
                        setSize('size6');
                      }}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        size === 'size6'
                          ? isNight
                            ? 'border-white bg-white/10 text-white font-bold'
                            : 'border-[#121316] bg-black/5 text-[#121316] font-bold'
                          : isNight
                          ? 'border-white/10 text-white/60 hover:border-white/20'
                          : 'border-black/10 text-[#121316]/60 hover:border-black/20'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs">SIZE 6 (INTERMEDIATE)</span>
                        <span className="text-[10px] opacity-70">28.5 IN</span>
                      </div>
                      <span className={`text-[9px] block mt-1 ${isNight ? 'text-[#8E90A0]' : 'text-[#656770]'}`}>
                        WNBA / FIBA Women's & Youth Match Spec
                      </span>
                    </button>
                  </div>
                </div>

                {/* Laser Hot-Stamp Monogram */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className={`text-[11px] uppercase tracking-wider font-bold ${
                      isNight ? 'text-[#8E90A0]' : 'text-[#656770]'
                    }`}>
                      LASER HOT-STAMP MONOGRAM (2-6 CHARACTERS)
                    </label>
                    <span className="text-[10px] text-amber-500 font-semibold uppercase">
                      INCLUDED WITH BESPOKE
                    </span>
                  </div>
                  <div className="flex gap-3">
                    <input
                      id="spec-monogram-input"
                      type="text"
                      maxLength={6}
                      value={monogram}
                      onChange={(e) => setMonogram(e.target.value.toUpperCase())}
                      placeholder="e.g. KS-24"
                      className={`flex-1 px-4 py-2.5 rounded-xl border text-sm font-mono-tech tracking-[0.2em] uppercase font-bold focus:outline-none ${
                        isNight
                          ? 'bg-black/40 border-white/20 text-white focus:border-white'
                          : 'bg-white border-black/20 text-[#121316] focus:border-black'
                      }`}
                    />
                    <div className={`px-4 py-2.5 rounded-xl border flex items-center justify-center min-w-28 font-mono-tech font-bold text-sm tracking-[0.25em] ${
                      isNight ? 'bg-white/5 border-white/10 text-amber-400' : 'bg-black/5 border-black/10 text-amber-700'
                    }`}>
                      {monogram || '---'}
                    </div>
                  </div>
                </div>

                {/* Vault Packaging */}
                <div className="space-y-2">
                  <label className={`text-[11px] uppercase tracking-wider font-bold ${
                    isNight ? 'text-[#8E90A0]' : 'text-[#656770]'
                  }`}>
                    EXHIBITION PACKAGING VAULT
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      id="spec-pkg-vault"
                      onClick={() => {
                        sound.playMetallicClick();
                        setPackaging('vault');
                      }}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        packaging === 'vault'
                          ? isNight
                            ? 'border-white bg-white/10 text-white font-bold'
                            : 'border-[#121316] bg-black/5 text-[#121316] font-bold'
                          : isNight
                          ? 'border-white/10 text-white/60 hover:border-white/20'
                          : 'border-black/10 text-[#121316]/60 hover:border-black/20'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs">WALNUT VAULT CASE</span>
                        <span className="text-[10px] text-amber-400 font-bold">+$80</span>
                      </div>
                      <span className={`text-[9px] block mt-1 ${isNight ? 'text-[#8E90A0]' : 'text-[#656770]'}`}>
                        Solid American Walnut + acrylic museum display cradle
                      </span>
                    </button>

                    <button
                      type="button"
                      id="spec-pkg-standard"
                      onClick={() => {
                        sound.playMetallicClick();
                        setPackaging('standard');
                      }}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        packaging === 'standard'
                          ? isNight
                            ? 'border-white bg-white/10 text-white font-bold'
                            : 'border-[#121316] bg-black/5 text-[#121316] font-bold'
                          : isNight
                          ? 'border-white/10 text-white/60 hover:border-white/20'
                          : 'border-black/10 text-[#121316]/60 hover:border-black/20'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs">MATCH HARDSHELL</span>
                        <span className="text-[10px] text-emerald-500 font-bold">INCLUDED</span>
                      </div>
                      <span className={`text-[9px] block mt-1 ${isNight ? 'text-[#8E90A0]' : 'text-[#656770]'}`}>
                        Ballistic nylon travel case with nitrogen pump
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: DISPATCH DETAILS & SUMMARY */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div>
                  <h4 className={`text-base sm:text-lg font-bold font-display uppercase tracking-tight ${
                    isNight ? 'text-white' : 'text-[#121316]'
                  }`}>
                    03 // DISPATCH ALLOCATION DETAILS
                  </h4>
                  <p className={`text-xs mt-1 leading-relaxed ${
                    isNight ? 'text-[#8E90A0]' : 'text-[#656770]'
                  }`}>
                    Provide delivery recipient information to secure your serialized reservation slot.
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className={`block text-[10px] uppercase tracking-wider mb-1 font-bold ${
                      isNight ? 'text-[#8E90A0]' : 'text-[#656770]'
                    }`}>
                      FULL RECIPIENT NAME *
                    </label>
                    <input
                      id="dispatch-name-input"
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Elena Rostova"
                      className={`w-full px-4 py-2.5 rounded-xl border text-xs font-mono-tech focus:outline-none ${
                        isNight
                          ? 'bg-black/40 border-white/20 text-white focus:border-white'
                          : 'bg-white border-black/20 text-[#121316] focus:border-black'
                      }`}
                    />
                  </div>

                  <div>
                    <label className={`block text-[10px] uppercase tracking-wider mb-1 font-bold ${
                      isNight ? 'text-[#8E90A0]' : 'text-[#656770]'
                    }`}>
                      NOTIFICATION EMAIL *
                    </label>
                    <input
                      id="dispatch-email-input"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. elena@studio.com"
                      className={`w-full px-4 py-2.5 rounded-xl border text-xs font-mono-tech focus:outline-none ${
                        isNight
                          ? 'bg-black/40 border-white/20 text-white focus:border-white'
                          : 'bg-white border-black/20 text-[#121316] focus:border-black'
                      }`}
                    />
                  </div>

                  <div>
                    <label className={`block text-[10px] uppercase tracking-wider mb-1 font-bold ${
                      isNight ? 'text-[#8E90A0]' : 'text-[#656770]'
                    }`}>
                      DESTINATION REGION
                    </label>
                    <select
                      id="dispatch-country-select"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className={`w-full px-4 py-2.5 rounded-xl border text-xs font-mono-tech focus:outline-none cursor-pointer ${
                        isNight
                          ? 'bg-[#15161C] border-white/20 text-white focus:border-white'
                          : 'bg-white border-black/20 text-[#121316] focus:border-black'
                      }`}
                    >
                      <option value="United States">United States (Free Insured Express)</option>
                      <option value="United Kingdom">United Kingdom (DHL Priority Air)</option>
                      <option value="European Union">European Union (DHL Priority Air)</option>
                      <option value="Japan">Japan (Express Courier)</option>
                      <option value="Canada">Canada (Priority Ground)</option>
                      <option value="Australia">Australia (Express Courier)</option>
                    </select>
                  </div>
                </div>

                {/* Pricing and Breakdown Line */}
                <div className={`p-4 rounded-xl border space-y-2 ${
                  isNight ? 'bg-white/[0.03] border-white/10' : 'bg-black/[0.03] border-black/10'
                }`}>
                  <div className="flex justify-between text-xs">
                    <span className={isNight ? 'text-[#8E90A0]' : 'text-[#656770]'}>
                      {activeEdition.name} ({activeEdition.serialPrefix})
                    </span>
                    <span className="font-bold">${activeEdition.basePrice} USD</span>
                  </div>
                  {packaging === 'vault' && (
                    <div className="flex justify-between text-xs">
                      <span className={isNight ? 'text-[#8E90A0]' : 'text-[#656770]'}>
                        American Walnut Exhibition Vault
                      </span>
                      <span className="font-bold">+$80 USD</span>
                    </div>
                  )}
                  <div className="flex justify-between text-xs">
                    <span className={isNight ? 'text-[#8E90A0]' : 'text-[#656770]'}>
                      Monogram Laser Calibration ({monogram || 'NONE'})
                    </span>
                    <span className="font-bold text-emerald-500">INCLUDED</span>
                  </div>
                  <div className="pt-2 border-t border-black/10 dark:border-white/10 flex justify-between items-center">
                    <span className="text-xs uppercase font-bold">TOTAL RESERVATION DEPOSIT</span>
                    <span className={`text-base font-extrabold font-display ${
                      isNight ? 'text-white' : 'text-[#121316]'
                    }`}>
                      ${totalPrice} USD
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 4: CERTIFICATE OF ALLOCATION */}
            {currentStep === 4 && (
              <div className="space-y-6 text-center">
                <div className="inline-flex p-3 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                  <Award className="w-8 h-8" />
                </div>

                <div>
                  <span className="text-[10px] tracking-[0.3em] font-bold text-emerald-500 uppercase block mb-1">
                    CONFIRMED ALLOCATION // RESERVED
                  </span>
                  <h4 className={`text-xl sm:text-2xl font-extrabold font-display tracking-tight ${
                    isNight ? 'text-white' : 'text-[#121316]'
                  }`}>
                    CERTIFICATE OF SERIAL ALLOCATION
                  </h4>
                  <p className={`text-xs mt-1 max-w-md mx-auto ${
                    isNight ? 'text-[#8E90A0]' : 'text-[#656770]'
                  }`}>
                    Your individual sphere has been reserved from the master batch and assigned to the precision curing line.
                  </p>
                </div>

                {/* Cryptographic Allocation Card */}
                <div className={`p-5 rounded-2xl border text-left space-y-4 ${
                  isNight
                    ? 'bg-black/50 border-white/20 shadow-inner'
                    : 'bg-white border-black/15 shadow-sm'
                }`}>
                  <div className="flex items-center justify-between pb-3 border-b border-black/10 dark:border-white/10">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">
                        SERIAL ALLOCATION RECORD
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-amber-500 uppercase">
                      AUTHENTICATED
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                    <div>
                      <span className={`text-[9px] uppercase tracking-wider block ${
                        isNight ? 'text-[#8E90A0]' : 'text-[#656770]'
                      }`}>
                        SERIAL NUMBER
                      </span>
                      <span className="font-bold text-amber-400 block mt-0.5">
                        {assignedSerial}
                      </span>
                    </div>

                    <div>
                      <span className={`text-[9px] uppercase tracking-wider block ${
                        isNight ? 'text-[#8E90A0]' : 'text-[#656770]'
                      }`}>
                        EDITION FINISH
                      </span>
                      <span className={`font-bold block mt-0.5 ${
                        isNight ? 'text-white' : 'text-[#121316]'
                      }`}>
                        {activeEdition.name}
                      </span>
                    </div>

                    <div>
                      <span className={`text-[9px] uppercase tracking-wider block ${
                        isNight ? 'text-[#8E90A0]' : 'text-[#656770]'
                      }`}>
                        MONOGRAM
                      </span>
                      <span className={`font-bold block mt-0.5 ${
                        isNight ? 'text-white' : 'text-[#121316]'
                      }`}>
                        {monogram || 'STANDARD'}
                      </span>
                    </div>

                    <div>
                      <span className={`text-[9px] uppercase tracking-wider block ${
                        isNight ? 'text-[#8E90A0]' : 'text-[#656770]'
                      }`}>
                        PACKAGING
                      </span>
                      <span className={`font-bold block mt-0.5 ${
                        isNight ? 'text-white' : 'text-[#121316]'
                      }`}>
                        {packaging === 'vault' ? 'WALNUT VAULT' : 'HARDSHELL'}
                      </span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-black/10 dark:border-white/10 flex items-center justify-between text-[10px]">
                    <span className={isNight ? 'text-[#8E90A0]' : 'text-[#656770]'}>
                      RECIPIENT: <strong className={isNight ? 'text-white' : 'text-[#121316]'}>{name || 'VALUED COLLECTOR'}</strong> ({country})
                    </span>
                    <span className="text-emerald-500 font-bold uppercase">
                      DISPATCH: {activeEdition.leadTime}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 4. Modal Footer Controls (Next / Back Actions) */}
        <div className={`flex items-center justify-between px-6 sm:px-8 py-4 border-t shrink-0 ${
          isNight ? 'bg-[#15161C] border-white/10' : 'bg-[#EDEDF2] border-black/10'
        }`}>
          {currentStep > 1 && currentStep < 4 ? (
            <button
              id="reserve-step-prev-btn"
              type="button"
              onClick={handlePrevStep}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full border text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                isNight
                  ? 'border-white/20 text-white hover:bg-white/10'
                  : 'border-black/20 text-[#121316] hover:bg-black/10'
              }`}
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>BACK</span>
            </button>
          ) : (
            <div className="text-[10px] text-emerald-500 flex items-center gap-1.5 font-bold uppercase">
              <Lock className="w-3 h-3" />
              <span>256-BIT ENCRYPTED ALLOCATION</span>
            </div>
          )}

          {currentStep < 3 && (
            <button
              id="reserve-step-next-btn"
              type="button"
              onClick={handleNextStep}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-md active:scale-95 ${
                isNight
                  ? 'bg-white text-[#121316] hover:bg-neutral-200'
                  : 'bg-[#121316] text-[#EDEDF2] hover:bg-[#25272E]'
              }`}
            >
              <span>CONTINUE TO {STEPS[currentStep].label}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}

          {currentStep === 3 && (
            <button
              id="reserve-step-confirm-btn"
              type="button"
              onClick={handleNextStep}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-md active:scale-95 ${
                isNight
                  ? 'bg-emerald-400 text-black hover:bg-emerald-300 font-extrabold'
                  : 'bg-emerald-600 text-white hover:bg-emerald-700 font-extrabold'
              }`}
            >
              <span>CONFIRM ALLOCATION (${totalPrice} USD)</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}

          {currentStep === 4 && (
            <button
              id="reserve-step-done-btn"
              type="button"
              onClick={() => {
                sound.playMetallicClick();
                onClose();
              }}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-md active:scale-95 ${
                isNight
                  ? 'bg-white text-[#121316] hover:bg-neutral-200'
                  : 'bg-[#121316] text-[#EDEDF2] hover:bg-[#25272E]'
              }`}
            >
              <span>DONE</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
