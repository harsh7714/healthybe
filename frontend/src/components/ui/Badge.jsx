import React from 'react'

const variants = {
  normal: {
    dot: 'bg-emerald-400',
    badge: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
    pulse: false,
  },
  borderline: {
    dot: 'bg-amber-400',
    badge: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
    pulse: true,
  },
  warning: {
    dot: 'bg-amber-400',
    badge: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
    pulse: true,
  },
  amber: {
    dot: 'bg-amber-400',
    badge: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
    pulse: true,
  },
  critical: {
    dot: 'bg-rose-400',
    badge: 'bg-rose-500/10 border-rose-500/20 text-rose-400',
    pulse: true,
  },
  high: {
    dot: 'bg-rose-400',
    badge: 'bg-rose-500/10 border-rose-500/20 text-rose-400',
    pulse: true,
  },
  danger: {
    dot: 'bg-rose-400',
    badge: 'bg-rose-500/10 border-rose-500/20 text-rose-400',
    pulse: true,
  },
  rose: {
    dot: 'bg-rose-400',
    badge: 'bg-rose-500/10 border-rose-500/20 text-rose-400',
    pulse: true,
  },
  info: {
    dot: 'bg-cyan-400',
    badge: 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400',
    pulse: false,
  },
  cyan: {
    dot: 'bg-cyan-400',
    badge: 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400',
    pulse: false,
  },
  violet: {
    dot: 'bg-violet-400',
    badge: 'bg-violet-500/10 border-violet-500/20 text-violet-400',
    pulse: false,
  },
  teal: {
    dot: 'bg-teal-400',
    badge: 'bg-teal-500/10 border-teal-500/20 text-teal-400',
    pulse: false,
  },
}

export function Badge({ children, variant = 'normal', className = '', showDot = true, ...props }) {
  const config = variants[variant] || variants.normal

  return (
    <span
      className={`
        inline-flex items-center gap-1.5
        px-2.5 py-0.5 rounded-full
        text-[9px] font-bold uppercase tracking-wider
        border
        ${config.badge}
        ${className}
      `}
      {...props}
    >
      {showDot && (
        <span className="relative flex-shrink-0 w-1.5 h-1.5">
          {config.pulse && (
            <span
              className={`absolute inset-0 rounded-full ${config.dot} opacity-60 animate-ping`}
              style={{ animationDuration: '1.8s' }}
            />
          )}
          <span className={`relative block w-1.5 h-1.5 rounded-full ${config.dot}`} />
        </span>
      )}
      {children}
    </span>
  )
}
