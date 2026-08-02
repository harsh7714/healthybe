import React from 'react'

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  isLoading = false,
  ...props
}) {
  const baseStyle = [
    'relative inline-flex items-center justify-center gap-2 font-semibold rounded-2xl',
    'transition-all duration-200 select-none cursor-pointer overflow-hidden',
    'active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/50',
  ].join(' ')

  const variants = {
    primary: [
      'bg-gradient-to-r from-teal-500 to-cyan-500 text-slate-950 font-bold',
      'shadow-[0_4px_16px_rgba(20,184,166,0.3),inset_0_1px_0_rgba(255,255,255,0.2)]',
      'hover:from-teal-400 hover:to-cyan-400 hover:shadow-[0_6px_24px_rgba(20,184,166,0.4)]',
      'hover:-translate-y-0.5',
    ].join(' '),

    secondary: [
      'bg-white/[0.06] hover:bg-white/[0.10] text-slate-300 hover:text-slate-100',
      'border border-white/[0.08] hover:border-white/[0.14]',
      'shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]',
      'hover:-translate-y-0.5',
    ].join(' '),

    danger: [
      'bg-gradient-to-r from-rose-500 to-rose-700 text-white font-bold',
      'shadow-[0_4px_16px_rgba(244,63,94,0.3),inset_0_1px_0_rgba(255,255,255,0.15)]',
      'hover:from-rose-400 hover:to-rose-600 hover:shadow-[0_6px_24px_rgba(244,63,94,0.4)]',
      'hover:-translate-y-0.5',
    ].join(' '),

    rose: [
      'bg-gradient-to-r from-rose-500 to-rose-700 text-white font-bold',
      'shadow-[0_4px_16px_rgba(244,63,94,0.3),inset_0_1px_0_rgba(255,255,255,0.15)]',
      'hover:from-rose-400 hover:to-rose-600 hover:-translate-y-0.5',
    ].join(' '),

    ghost: [
      'hover:bg-white/[0.06] text-slate-400 hover:text-slate-200',
      'rounded-xl',
    ].join(' '),

    glass: [
      'bg-white/[0.06] hover:bg-white/[0.10] text-slate-200',
      'border border-white/[0.08] hover:border-teal-500/30',
      'backdrop-blur-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]',
      'hover:-translate-y-0.5',
    ].join(' '),

    'scanner-primary': [
      'bg-gradient-to-r from-teal-500 to-cyan-500 text-slate-950 font-bold',
      'shadow-[0_4px_16px_rgba(20,184,166,0.3)] hover:from-teal-400 hover:to-cyan-400',
      'hover:-translate-y-0.5',
    ].join(' '),

    'scanner-secondary': [
      'btn-scanner-secondary',
      'hover:-translate-y-0.5',
    ].join(' '),

    'scanner-danger': [
      'btn-scanner-danger',
      'hover:-translate-y-0.5',
    ].join(' '),
  }

  const sizes = {
    xs: 'px-3 py-1.5 text-[11px]',
    sm: 'px-4 py-2 text-xs',
    md: 'px-5 py-2.5 text-sm',
    lg: 'px-7 py-3.5 text-sm',
    xl: 'px-8 py-4 text-sm',
  }

  const variantStyle = variants[variant] || variants.primary
  const sizeStyle = sizes[size] || sizes.md

  return (
    <button
      className={`${baseStyle} ${variantStyle} ${sizeStyle} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {/* Shimmer overlay on primary */}
      {variant === 'primary' && (
        <span
          className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none"
          style={{
            background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.15) 50%, transparent 100%)',
            backgroundSize: '200% 100%',
          }}
        />
      )}

      {isLoading && (
        <span className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-current border-t-transparent flex-shrink-0" />
      )}
      {children}
    </button>
  )
}
