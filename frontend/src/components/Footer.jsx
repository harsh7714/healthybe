import React from 'react'
import { NavLink } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="relative mt-auto border-t border-slate-800/80 bg-[#080c14] select-none">
      <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
        
        {/* Left: Brand info */}
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full flex items-center justify-center overflow-hidden shrink-0">
            <img src="/favicon.ico" alt="HealthyBe" className="w-4 h-4 rounded-full object-contain" />
          </div>
          <span className="font-bold text-slate-300">HealthyBe Pro Platform</span>
          <span className="hidden sm:inline">•</span>
          <span className="hidden sm:inline font-mono text-[11px]">HIPAA Compliant & Secure</span>
        </div>

        {/* Center: Minimal Links */}
        <div className="flex items-center gap-4 text-[11px]">
          <NavLink to="/" className="hover:text-teal-400 transition-colors">Home</NavLink>
          <NavLink to="/dashboard" className="hover:text-teal-400 transition-colors">Dashboard</NavLink>
          <NavLink to="/chat" className="hover:text-teal-400 transition-colors">AI Chat</NavLink>
          <NavLink to="/reports" className="hover:text-teal-400 transition-colors">Vault</NavLink>
          <NavLink to="/emergency" className="hover:text-rose-400 transition-colors">Emergency</NavLink>
        </div>

        {/* Right: Copyright */}
        <div className="text-[11px] font-mono text-slate-600">
          © {new Date().getFullYear()} HealthyBe Inc.
        </div>

      </div>
    </footer>
  )
}