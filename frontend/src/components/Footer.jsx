import React from 'react'
import { NavLink } from 'react-router-dom'

const pages = [
  { label: 'Home', path: '/' },
  { label: 'Dashboard', path: '/dashboard' },
  { label: 'AI Chat', path: '/chat' },
  { label: 'Health Vault', path: '/reports' },
  { label: 'Emergency', path: '/emergency' },
  { label: 'Settings', path: '/settings' },
]

export default function Footer() {
  return (
    <footer className="border-t border-slate-900/80 bg-[#080C14] text-slate-400 mt-auto">
      <div className="max-w-7xl mx-auto px-6 sm:px-12 lg:px-24 py-14">

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 pb-10 border-b border-slate-900/60">

          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full border border-slate-800 flex items-center justify-center bg-slate-950 overflow-hidden shadow-md">
                <img src="/favicon.ico" alt="HealthyBe" className="w-full h-full object-cover rounded-full" />
              </div>
              <span className="font-black text-white text-lg tracking-wide">HealthyBe</span>
            </div>
            <p className="text-sm text-slate-500 leading-relaxed max-w-xs">
              A family health management app — upload reports, track vitals, chat with AI, and access emergency contacts all in one place.
            </p>
          </div>

          {/* Pages */}
          <div className="space-y-4">
            <h4 className="text-xs font-black text-slate-300 uppercase tracking-[0.2em]">Pages</h4>
            <ul className="space-y-2.5">
              {pages.map(link => (
                <li key={link.path}>
                  <NavLink
                    to={link.path}
                    className={({ isActive }) =>
                      `text-sm transition-colors duration-200 hover:text-teal-400 ${isActive ? 'text-teal-400 font-semibold' : 'text-slate-500'}`
                    }
                  >
                    {link.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>

          {/* App Info */}
          <div className="space-y-4">
            <h4 className="text-xs font-black text-slate-300 uppercase tracking-[0.2em]">App Info</h4>
            <ul className="space-y-3 text-sm text-slate-500">
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 text-teal-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Free to use
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 text-teal-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                Mobile camera scanning
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 text-teal-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Multi-family profiles
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 text-rose-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Emergency board — no login needed
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-slate-600 font-mono">
            © {new Date().getFullYear()} HealthyBe. All rights reserved.
          </p>
          <p className="text-xs text-slate-700 font-mono">
            v1.0.0 · Built for families
          </p>
        </div>

      </div>
    </footer>
  )
}