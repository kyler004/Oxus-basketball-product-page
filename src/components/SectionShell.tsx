import React from 'react';
import { ThemeMode } from '../types';
import { palette } from '../utils/theme';

interface SectionShellProps {
  id: string;
  eyebrow: string;
  title: React.ReactNode;
  description: string;
  themeMode?: ThemeMode;
  /** Extra content under the description (calls to action) */
  actions?: React.ReactNode;
  /** Right-hand column content */
  children?: React.ReactNode;
}

/**
 * Shared two-column layout: copy on the left, details on the right,
 * leaving the centre free for the 3D ball.
 */
export const SectionShell: React.FC<SectionShellProps> = ({
  id,
  eyebrow,
  title,
  description,
  themeMode = 'day',
  actions,
  children,
}) => {
  const p = palette(themeMode === 'night');

  return (
    <section
      id={id}
      className="relative w-full h-full max-w-[1440px] mx-auto flex flex-col justify-between gap-8 lg:flex-row lg:items-center lg:gap-0 px-8 sm:px-14 pt-24 pb-20 pointer-events-none"
    >
      <div className="w-full lg:w-[23rem] pointer-events-auto">
        <p className={`font-mono-tech text-[11px] font-bold tracking-[0.28em] uppercase mb-4 ${p.accent}`}>
          {eyebrow}
        </p>
        <h2
          className={`font-display text-4xl sm:text-5xl font-extrabold leading-[1.04] mb-5 ${p.heading}`}
        >
          {title}
        </h2>
        <p className={`font-mono-tech text-sm leading-relaxed ${p.body}`}>{description}</p>
        {actions && <div className="mt-7 flex flex-wrap items-center gap-3">{actions}</div>}
      </div>

      {children && (
        <div className="w-full lg:w-[23rem] pointer-events-auto font-mono-tech select-none">
          {children}
        </div>
      )}
    </section>
  );
};

