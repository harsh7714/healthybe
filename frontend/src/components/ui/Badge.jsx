import React from 'react'

export function Badge({ children, variant = 'normal', className = '', ...props }) {
  const baseStyle = 'inline-block px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border'
  
  let variantStyle = 'bg-emerald-950/40 border-emerald-900/40 text-emerald-400'
  if (variant === 'borderline' || variant === 'warning' || variant === 'amber') {
    variantStyle = 'bg-amber-950/40 border-amber-900/40 text-amber-500'
  } else if (variant === 'critical' || variant === 'high' || variant === 'danger' || variant === 'rose') {
    variantStyle = 'bg-rose-950/40 border-rose-900/40 text-rose-500'
  } else if (variant === 'info' || variant === 'cyan') {
    variantStyle = 'bg-cyan-950/40 border-cyan-900/40 text-cyan-400'
  } else if (variant === 'violet') {
    variantStyle = 'bg-violet-950/40 border-violet-900/40 text-violet-400'
  } else if (variant === 'teal') {
    variantStyle = 'bg-teal-950/40 border-teal-900/40 text-teal-400'
  }

  return (
    <span className={`${baseStyle} ${variantStyle} ${className}`} {...props}>
      {children}
    </span>
  )
}
