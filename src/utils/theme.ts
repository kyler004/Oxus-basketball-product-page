/**
 * Single source of truth for the page palette.
 * Warm neutral stone (day) / warm charcoal (night) with one burnt-orange accent
 * that echoes the leather of the ball. Class names are written out in full so
 * Tailwind can detect them.
 */
export const palette = (isNight: boolean) => ({
  heading: isNight ? 'text-[#F4EFE8]' : 'text-[#1A1714]',
  body: isNight ? 'text-[#CFC7BC]' : 'text-[#473F37]',
  muted: isNight ? 'text-[#9A9184]' : 'text-[#6B6358]',
  accent: isNight ? 'text-[#F28C3E]' : 'text-[#B8480A]',
  accentBg: isNight
    ? 'bg-[#F28C3E] text-[#14110F] hover:bg-[#F7A260]'
    : 'bg-[#B8480A] text-white hover:bg-[#9C3D08]',
  primaryBtn: isNight
    ? 'bg-[#F4EFE8] text-[#14110F] hover:bg-white'
    : 'bg-[#1A1714] text-[#F1ECE4] hover:bg-[#2E2924]',
  ghostBtn: isNight
    ? 'border border-white/25 text-[#F4EFE8] hover:bg-white/10'
    : 'border border-black/25 text-[#1A1714] hover:bg-black/5',
  line: isNight ? 'border-white/15' : 'border-black/15',
  rowIdle: isNight
    ? 'border-white/15 text-[#CFC7BC] hover:text-white hover:border-white/40'
    : 'border-black/15 text-[#473F37] hover:text-[#1A1714] hover:border-black/45',
  rowActive: isNight
    ? 'border-[#F28C3E] text-white bg-white/[0.04]'
    : 'border-[#B8480A] text-[#1A1714] bg-black/[0.04]',
  chip: isNight ? 'bg-white/10 text-[#F4EFE8]' : 'bg-black/[0.06] text-[#1A1714]',
});

