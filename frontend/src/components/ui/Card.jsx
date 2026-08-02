import React from 'react'

export function Card({ children, className = '', glow = false, ...props }) {
  return (
    <div
      className={`
        relative rounded-3xl overflow-hidden
        bg-white/[0.03] backdrop-blur-xl
        border border-white/[0.07]
        shadow-[0_4px_24px_-4px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.06)]
        transition-all duration-300
        ${glow ? 'border-teal-500/25 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.5),0_0_20px_rgba(20,184,166,0.1),inset_0_1px_0_rgba(20,184,166,0.08)]' : ''}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardHeader({ children, className = '', ...props }) {
  return (
    <div
      className={`flex justify-between items-center pb-3 border-b border-white/[0.06] ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardContent({ children, className = '', ...props }) {
  return (
    <div className={`pt-4 ${className}`} {...props}>
      {children}
    </div>
  )
}
