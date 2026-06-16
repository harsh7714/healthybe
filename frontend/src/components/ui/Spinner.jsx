import React from 'react'

export function Spinner({ size = 'md', className = '', ...props }) {
  const sizeClass = size === 'sm' ? 'w-4 h-4 border-2' : size === 'lg' ? 'w-10 h-10 border-3' : 'w-6 h-6 border-2'
  return (
    <div 
      className={`animate-spin rounded-full border-t-teal-400 border-r-transparent border-b-transparent border-l-transparent ${sizeClass} ${className}`} 
      style={{ borderLeftColor: 'transparent', borderRightColor: 'transparent', borderBottomColor: 'transparent' }}
      {...props}
    />
  )
}
