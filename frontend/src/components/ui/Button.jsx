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
  const baseStyle = 'inline-flex items-center justify-center gap-2 font-bold rounded-2xl transition-all duration-300 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none'
  
  let variantStyle = 'bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-slate-950 shadow-lg shadow-teal-500/20'
  if (variant === 'secondary') {
    variantStyle = 'bg-slate-900/70 hover:bg-slate-800/70 border border-slate-800 hover:border-slate-700 text-slate-300'
  } else if (variant === 'danger' || variant === 'rose') {
    variantStyle = 'bg-gradient-to-r from-rose-500 to-red-650 hover:from-rose-400 hover:to-red-550 text-slate-100 shadow-lg shadow-rose-500/20'
  } else if (variant === 'ghost') {
    variantStyle = 'hover:bg-slate-900/50 text-slate-400 hover:text-slate-200'
  } else if (variant === 'scanner-primary') {
    variantStyle = 'bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-slate-950 shadow-lg shadow-teal-500/25'
  } else if (variant === 'scanner-secondary') {
    variantStyle = 'bg-gradient-to-r from-slate-900 to-slate-950 hover:from-slate-850 hover:to-slate-900 text-slate-200 border border-slate-800 hover:border-slate-700 shadow-md shadow-black/40'
  } else if (variant === 'scanner-danger') {
    variantStyle = 'bg-gradient-to-r from-red-600 to-red-900 hover:from-red-500 hover:to-red-800 text-slate-100'
  }

  const sizeStyle = size === 'sm' ? 'px-4 py-2 text-xs' : size === 'lg' ? 'px-8 py-4 text-sm' : 'px-6 py-3 text-sm'

  return (
    <button 
      className={`${baseStyle} ${variantStyle} ${sizeStyle} ${className} btn-${variant}`} 
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <span className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-current border-t-transparent" />
      )}
      {children}
    </button>
  )
}
