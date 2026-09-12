import React from 'react'

export function Spinner({ 
  size = 'md', 
  className = '', 
  color = 'text-teal-400',
  trackColor = 'text-slate-700/40',
  children, 
  ...props 
}) {
  const sizeMap = {
    xs: 'w-3.5 h-3.5',
    sm: 'w-5 h-5',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  }

  const sizeClass = sizeMap[size] || sizeMap.md

  return (
    <div className={`inline-flex flex-col items-center justify-center gap-3 ${className}`} {...props}>
      <svg
        className={`animate-spin ${sizeClass} ${color}`}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        role="status"
        aria-label="Loading"
      >
        <circle
          className={trackColor}
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="3.5"
        />
        <path
          className="opacity-90"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
      {children && (
        <div className="text-center text-xs sm:text-sm text-slate-300 font-medium">
          {children}
        </div>
      )}
    </div>
  )
}
