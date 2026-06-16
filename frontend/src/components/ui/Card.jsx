import React from 'react'

export function Card({ children, className = '', ...props }) {
  return (
    <div 
      className={`rounded-2xl bg-slate-950/60 border border-slate-900/80 backdrop-blur-md shadow-xl transition-all duration-300 ${className}`} 
      {...props}
    >
      {children}
    </div>
  )
}

export function CardHeader({ children, className = '', ...props }) {
  return (
    <div 
      className={`flex justify-between items-center pb-3 border-b border-slate-900 ${className}`} 
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
