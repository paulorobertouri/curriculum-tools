import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  title,
  subtitle,
}) => {
  return (
    <section
      className={`rounded-[2rem] border border-slate-200/80 bg-white/90 p-6 shadow-[0_18px_60px_-28px_rgba(15,23,42,0.28)] backdrop-blur sm:p-8 ${className}`}
    >
      {(title || subtitle) && (
        <div className='mb-6'>
          {subtitle && (
            <p className='text-sm font-semibold uppercase tracking-[0.18em] text-sky-700'>
              {subtitle}
            </p>
          )}
          {title && (
            <h2 className='mt-2 text-2xl font-bold tracking-tight text-slate-950'>
              {title}
            </h2>
          )}
        </div>
      )}
      {children}
    </section>
  );
};
