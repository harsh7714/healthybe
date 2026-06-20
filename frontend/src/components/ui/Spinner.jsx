import React from 'react'

export function Spinner({ size = 'md', className = '', children, ...props }) {
  let sizeClass = 'w-10 h-10'
  let padClass = 'p-[3px]'
  let dotClass = 'w-2 h-2'

  if (size === 'sm') {
    sizeClass = 'w-6 h-6'
    padClass = 'p-[2px]'
    dotClass = 'w-1 h-1'
  } else if (size === 'lg') {
    sizeClass = 'w-16 h-16'
    padClass = 'p-[4px]'
    dotClass = 'w-3 h-3'
  } else if (size === 'xl') {
    sizeClass = 'w-56 h-56 sm:w-64 sm:h-64'
    padClass = 'p-[4px]'
    dotClass = 'hidden'
  }

  return (
    <div className={`relative flex items-center justify-center ${sizeClass} ${className}`} {...props}>
      {/* Outer spinning gradient ring */}
      <div className={`absolute inset-0 rounded-full bg-gradient-to-r from-teal-400 via-pink-500 to-cyan-400 animate-spin ${padClass}`}>
        <div className="w-full h-full rounded-full bg-slate-950" />
      </div>
      
      {/* Inner Content or Glowing Pulse */}
      {children ? (
        <div className="absolute inset-4 flex items-center justify-center text-center px-4 z-10 select-none">
          {children}
        </div>
      ) : (
        <div className={`rounded-full bg-teal-400 animate-pulse ${dotClass}`} />
      )}
    </div>
  )
}

