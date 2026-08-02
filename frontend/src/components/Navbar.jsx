import React, { useState, useEffect, useRef } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useHealth } from '../context/HealthContext'
import { photoToPdf, photosToMultiPagePdf } from '../utils/photoToPdf'
import { useTranslation } from '../utils/translationService'

/* ════════════════════════════════════════════════════════════════
   ICONS — clean, explicit width/height
   ════════════════════════════════════════════════════════════════ */
const IconHome = ({ className = 'w-5 h-5' }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
)
const IconDashboard = ({ className = 'w-5 h-5' }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 5a1 1 0 011-1h4a1 1 0 011 1v5a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10-4a1 1 0 011-1h4a1 1 0 011 1v8a1 1 0 01-1 1h-4a1 1 0 01-1-1v-8z" />
  </svg>
)
const IconChat = ({ className = 'w-5 h-5' }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
  </svg>
)
const IconReports = ({ className = 'w-5 h-5' }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
)
const IconEmergency = ({ className = 'w-5 h-5' }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
)
const IconSettings = ({ className = 'w-5 h-5' }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
)
const IconCamera = ({ className = 'w-5 h-5' }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
)
const IconSun = ({ className = 'w-4 h-4' }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M12 7a5 5 0 100 10 5 5 0 000-10z" />
  </svg>
)
const IconMoon = ({ className = 'w-4 h-4' }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
  </svg>
)
const IconChevronRight = ({ className = 'w-4 h-4' }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
  </svg>
)

/* ════════════════════════════════════════════════════════════════
   DESKTOP PRO SIDEBAR (SLEEK & SLEEK PROPORTIONS)
   ════════════════════════════════════════════════════════════════ */
function DesktopSidebar({ isLight, toggleTheme }) {
  const { family, activeProfileId, setActiveProfileId, activeProfile, isLoggedIn } = useHealth()
  const { t } = useTranslation()

  const mainLinks = [
    { path: '/',          label: t('nav.home'),      Icon: IconHome,      badge: null },
    { path: '/dashboard', label: t('nav.dashboard'), Icon: IconDashboard, badge: null },
    { path: '/chat',      label: t('nav.chat'),      Icon: IconChat,      badge: 'AI 2.0', badgeColor: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' },
    { path: '/reports',   label: t('nav.reports'),   Icon: IconReports,   badge: null },
  ]

  const toolLinks = [
    { path: '/emergency', label: t('nav.emergency'), Icon: IconEmergency, accent: true, badge: 'SOS', badgeColor: 'bg-rose-500/20 text-rose-400 border-rose-500/30 animate-pulse' },
    { path: '/settings',  label: t('nav.settings'),  Icon: IconSettings,  badge: null },
  ]

  return (
    <aside className="hidden md:flex flex-col fixed top-0 left-0 h-screen w-64 z-40 sidebar-root select-none border-r border-slate-800/80">
      
      {/* 1. Header / Logo */}
      <div className="h-16 px-5 flex items-center justify-between border-b sidebar-divider flex-shrink-0">
        <NavLink to="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-full flex items-center justify-center transition-transform duration-300 group-hover:scale-110 overflow-hidden shrink-0">
            <img src="/favicon.ico" alt="HealthyBe" className="w-7 h-7 rounded-full object-contain" />
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-sm tracking-tight leading-none sidebar-brand-text">
              HealthyBe
            </span>
            <span className="text-[9px] font-bold text-teal-400 mt-1 tracking-wider uppercase font-mono">
              PRO HEALTH PLATFORM
            </span>
          </div>
        </NavLink>
      </div>

      {/* 2. Main Navigation List */}
      <div className="flex-1 overflow-y-auto px-3.5 py-4 space-y-5 no-scrollbar">

        {/* Section 1: Main Menu */}
        <div className="space-y-1">
          <div className="px-3 pb-1.5 text-[9px] font-extrabold uppercase tracking-[0.2em] sidebar-section-label">
            Main Portal
          </div>
          {mainLinks.map((link) => (
            <NavLink
              key={link.path}
              to={link.path}
              end={link.path === '/'}
              className={({ isActive }) => `
                group relative flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all duration-200 h-10
                ${isActive
                  ? 'bg-teal-500/15 text-teal-300 border border-teal-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-white/[0.05]'
                }
              `}
            >
              {({ isActive }) => (
                <>
                  <div className="flex items-center gap-3">
                    <link.Icon className={`w-4 h-4 flex-shrink-0 transition-colors duration-200 ${isActive ? 'text-teal-400' : 'text-slate-400 group-hover:text-slate-200'}`} />
                    <span className="truncate">{link.label}</span>
                  </div>
                  {link.badge && (
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold tracking-wider uppercase border ${link.badgeColor}`}>
                      {link.badge}
                    </span>
                  )}
                  {isActive && (
                    <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-teal-400" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </div>

        {/* Section 2: Care & Tools */}
        <div className="space-y-1">
          <div className="px-3 pb-1.5 text-[9px] font-extrabold uppercase tracking-[0.2em] sidebar-section-label">
            Care & Tools
          </div>
          {toolLinks.map((link) => (
            <NavLink
              key={link.path}
              to={link.path}
              className={({ isActive }) => `
                group relative flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all duration-200 h-10
                ${isActive
                  ? link.accent
                    ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30 shadow-sm'
                    : 'bg-teal-500/15 text-teal-300 border border-teal-500/30'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-white/[0.05]'
                }
              `}
            >
              {({ isActive }) => (
                <>
                  <div className="flex items-center gap-3">
                    <link.Icon className={`w-4 h-4 flex-shrink-0 transition-colors duration-200 ${isActive ? (link.accent ? 'text-rose-400' : 'text-teal-400') : (link.accent ? 'text-rose-400' : 'text-slate-400 group-hover:text-slate-200')}`} />
                    <span className="truncate">{link.label}</span>
                  </div>
                  {link.badge && (
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold tracking-wider uppercase border ${link.badgeColor}`}>
                      {link.badge}
                    </span>
                  )}
                  {isActive && (
                    <span className={`absolute left-0 top-2 bottom-2 w-1 rounded-r-full ${link.accent ? 'bg-rose-400' : 'bg-teal-400'}`} />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </div>

        {/* Section 3: Quick Camera Scan Action */}
        <div className="pt-1">
          <NavLink
            to="/reports?scan=true"
            className="group flex items-center justify-between p-2.5 rounded-xl bg-gradient-to-r from-teal-500/10 to-cyan-500/10 border border-teal-500/20 hover:border-teal-500/40 hover:from-teal-500/20 hover:to-cyan-500/20 transition-all duration-200"
          >
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-teal-500/20 border border-teal-500/30 text-teal-400 group-hover:scale-105 transition-transform flex-shrink-0">
                <IconCamera className="w-4 h-4" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-bold text-slate-200 group-hover:text-teal-300 transition-colors truncate">
                  Scan Document
                </span>
                <span className="text-[9px] text-slate-500 truncate">Camera / PDF OCR</span>
              </div>
            </div>
            <IconChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-teal-400 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
          </NavLink>
        </div>

        {/* Section 4: System controls */}
        <div className="space-y-1 pt-1">
          <div className="px-3 pb-1.5 text-[9px] font-extrabold uppercase tracking-[0.2em] sidebar-section-label">
            Preferences
          </div>
          <button
            onClick={toggleTheme}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold sidebar-theme-btn border border-transparent transition-all duration-200 h-10"
          >
            <div className="flex items-center gap-3">
              {isLight
                ? <IconMoon className="w-4 h-4 sidebar-theme-icon-moon flex-shrink-0" />
                : <IconSun className="w-4 h-4 sidebar-theme-icon-sun flex-shrink-0" />
              }
              <span>{isLight ? 'Dark Mode' : 'Light Mode'}</span>
            </div>
            <div className={`relative w-7 h-4 rounded-full transition-colors duration-200 ${isLight ? 'sidebar-toggle-off' : 'sidebar-toggle-on'}`}>
              <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform duration-200 ${isLight ? 'translate-x-0.5' : 'translate-x-3.5'}`} />
            </div>
          </button>
        </div>

      </div>

      {/* 3. User Profile Card at Sidebar Bottom */}
      <div className="p-3 border-t sidebar-divider flex-shrink-0">
        {isLoggedIn && activeProfile ? (
          <div className="space-y-2">
            <div className="p-2.5 rounded-xl sidebar-profile-card flex items-center justify-between gap-2.5">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="relative flex-shrink-0">
                  <div className="w-9 h-9 rounded-full sidebar-avatar flex items-center justify-center font-extrabold text-xs overflow-hidden border border-teal-500/40 shadow-sm">
                    {activeProfile.profileImageUrl ? (
                      <img src={activeProfile.profileImageUrl} alt={activeProfile.name} className="w-full h-full object-cover" />
                    ) : (
                      activeProfile.initials || '?'
                    )}
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border border-slate-900" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-bold truncate sidebar-profile-name">
                    {activeProfile.name}
                  </span>
                  <span className="text-[9px] font-mono truncate sidebar-profile-email">
                    {activeProfile.relation || activeProfile.email || 'Primary'}
                  </span>
                </div>
              </div>

              <NavLink
                to="/settings"
                className="p-1 rounded-lg sidebar-icon-btn transition-colors flex-shrink-0"
                title="Settings"
              >
                <IconSettings className="w-3.5 h-3.5" />
              </NavLink>
            </div>

            {/* Profile switcher pills */}
            {family.length > 1 && (
              <div className="space-y-1 px-1">
                <div className="text-[9px] font-extrabold uppercase tracking-widest sidebar-section-label">
                  Family ({family.length})
                </div>
                <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
                  {family.map((member) => (
                    <button
                      key={member.id}
                      onClick={() => setActiveProfileId(member.id)}
                      className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-bold transition-all duration-200 flex-shrink-0 border ${
                        member.id === activeProfileId
                          ? 'bg-teal-500/20 text-teal-300 border-teal-500/40'
                          : 'bg-white/[0.03] text-slate-400 hover:text-slate-200 border-transparent'
                      }`}
                    >
                      <span className="w-3.5 h-3.5 rounded-full bg-slate-800 flex items-center justify-center text-[7px] font-bold overflow-hidden flex-shrink-0">
                        {member.profileImageUrl ? (
                          <img src={member.profileImageUrl} alt={member.name} className="w-full h-full object-cover" />
                        ) : (
                          member.initials
                        )}
                      </span>
                      <span className="truncate max-w-[50px]">{member.name.split(' ')[0]}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <NavLink
            to="/dashboard"
            className="w-full py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 sidebar-signin-btn transition-all duration-200 shadow-sm"
          >
            <span>Sign In</span>
            <IconChevronRight className="w-3.5 h-3.5" />
          </NavLink>
        )}
      </div>

    </aside>
  )
}

/* ════════════════════════════════════════════════════════════════
   DESKTOP TOP NAVBAR (PRO CLINICAL HEADER)
   ════════════════════════════════════════════════════════════════ */
function DesktopNavbar({ isLight, toggleTheme }) {
  const { isLoggedIn, activeProfile } = useHealth()
  const { t } = useTranslation()

  return (
    <header className="hidden md:flex fixed top-0 left-64 right-0 h-16 z-30 bg-[#0a0f1d] border-b border-slate-800/90 px-8 items-center justify-between select-none shadow-sm">
      
      {/* Left: Portal Title & Status */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-teal-500/10 border border-teal-500/20">
          <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse flex-shrink-0" />
          <span className="text-xs font-extrabold uppercase tracking-wider text-teal-300 font-mono">
            HealthyBe Portal
          </span>
        </div>
        <span className="text-xs text-slate-500 font-medium hidden lg:inline">
          Family Health Management System
        </span>
      </div>

      {/* Right Controls: Theme Toggle & Sign In / Active Account */}
      <div className="flex items-center gap-3">
        {/* Light / Dark Mode Toggle */}
        <button
          onClick={toggleTheme}
          aria-label="Toggle Theme"
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs font-bold transition-all duration-200 shadow-sm cursor-pointer"
        >
          {isLight ? (
            <>
              <IconMoon className="w-4 h-4 text-indigo-400 flex-shrink-0" />
              <span>Dark Mode</span>
            </>
          ) : (
            <>
              <IconSun className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <span>Light Mode</span>
            </>
          )}
        </button>

        {/* Auth / Account Button */}
        {isLoggedIn ? (
          <NavLink
            to="/settings"
            className="flex items-center gap-2.5 px-4 py-2 rounded-xl bg-teal-500/15 hover:bg-teal-500/25 border border-teal-500/30 text-teal-300 transition-all text-xs font-bold shadow-sm"
          >
            <span className="w-2 h-2 rounded-full bg-teal-400 flex-shrink-0" />
            <span className="truncate max-w-[140px]">{activeProfile?.name || 'Account'}</span>
          </NavLink>
        ) : (
          <NavLink
            to="/dashboard"
            className="px-5 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-black text-xs uppercase tracking-wider transition-all duration-200 shadow-sm"
          >
            {t('nav.signIn')}
          </NavLink>
        )}
      </div>

    </header>
  )
}

/* ════════════════════════════════════════════════════════════════
   MOBILE FLOATING BOTTOM NAVBAR & TOP BAR (NO SIDEBAR IN MOBILE)
   ════════════════════════════════════════════════════════════════ */
function MobileNav({ isLight, toggleTheme }) {
  const { isLoggedIn, activeProfile } = useHealth()
  const { t } = useTranslation()
  const navigate = useNavigate()

  const mobileTabs = [
    { path: '/',          label: t('nav.home'),      Icon: IconHome },
    { path: '/dashboard', label: t('nav.dashboard'), Icon: IconDashboard },
    { path: '/chat',      label: t('nav.chat'),      Icon: IconChat },
    { path: '/reports',   label: t('nav.reports'),   Icon: IconReports },
    { path: '/emergency', label: t('nav.emergency'), Icon: IconEmergency, accent: true },
  ]

  return (
    <>
      {/* ── Mobile Top Header ─────────────────────────────────── */}
      <header className="flex md:hidden fixed top-0 left-0 right-0 h-14 bg-[#080c14] border-b border-slate-800/80 px-4 items-center justify-between z-40 select-none">
        <NavLink to="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full flex items-center justify-center overflow-hidden shrink-0">
            <img src="/favicon.ico" alt="HealthyBe" className="w-6 h-6 rounded-full object-contain" />
          </div>
          <span className="font-extrabold text-white text-sm tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
            HealthyBe
          </span>
        </NavLink>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            aria-label="Toggle Theme"
            className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 flex items-center justify-center active:scale-95 transition-all"
          >
            {isLight ? (
              <IconMoon className="w-4 h-4 text-indigo-400" />
            ) : (
              <IconSun className="w-4 h-4 text-amber-400" />
            )}
          </button>

          {!isLoggedIn ? (
            <NavLink
              to="/dashboard"
              className="px-3 py-1.5 bg-teal-500 text-slate-950 font-bold text-xs rounded-xl uppercase tracking-wider"
            >
              Sign In
            </NavLink>
          ) : (
            <NavLink
              to="/settings"
              className="w-8 h-8 rounded-xl bg-teal-950/40 border border-teal-500/30 flex items-center justify-center text-teal-300 font-bold text-xs overflow-hidden"
            >
              {activeProfile?.profileImageUrl ? (
                <img src={activeProfile.profileImageUrl} alt={activeProfile.name} className="w-full h-full object-cover" />
              ) : (
                activeProfile?.initials || '?'
              )}
            </NavLink>
          )}
        </div>
      </header>

      {/* ── Mobile Detached Floating Bottom Navigation Bar ─────── */}
      <nav className="flex md:hidden fixed bottom-3 left-3 right-3 h-14 bg-[#0c1220] border border-slate-800/90 rounded-2xl items-center justify-around px-2 z-40 shadow-2xl select-none">
        {mobileTabs.map((tab) => (
          <NavLink
            key={tab.path}
            to={tab.path}
            end={tab.path === '/'}
            className={({ isActive }) => `
              relative flex flex-col items-center justify-center w-11 h-11 gap-0.5 rounded-xl transition-all duration-200
              ${isActive
                ? tab.accent
                  ? 'text-rose-400 font-bold'
                  : 'text-teal-400 font-bold'
                : 'text-slate-400 hover:text-slate-200'
              }
            `}
          >
            {({ isActive }) => (
              <>
                <tab.Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? (tab.accent ? 'text-rose-400' : 'text-teal-400') : 'text-slate-400'}`} />
                <span className="text-[9px] font-semibold tracking-tight leading-none">{tab.label}</span>
                {isActive && (
                  <span className={`absolute -bottom-1 w-3 h-0.5 rounded-full ${tab.accent ? 'bg-rose-400' : 'bg-teal-400'}`} />
                )}
              </>
            )}
          </NavLink>
        ))}

        {/* Center Camera Scan FAB */}
        <button
          onClick={() => navigate('/reports?scan=true')}
          aria-label="Scan Document"
          className="relative -top-3 w-11 h-11 rounded-full bg-gradient-to-tr from-teal-500 to-cyan-400 text-slate-950 flex items-center justify-center shadow-lg border-2 border-[#0c1220] active:scale-95 transition-all flex-shrink-0"
        >
          <IconCamera className="w-4.5 h-4.5 text-slate-950" />
        </button>
      </nav>
    </>
  )
}

/* ════════════════════════════════════════════════════════════════
   MAIN COMBINED COMPONENT EXPORT
   ════════════════════════════════════════════════════════════════ */
export default function Navbar() {
  const { isLoggedIn, uploadReportToS3, activeProfileId } = useHealth()
  const navigate = useNavigate()
  const cameraInputRef = useRef(null)
  const capturedPagesRef = useRef([])

  const [isLight, setIsLight] = useState(() => localStorage.getItem('theme') === 'light')

  const toggleTheme = () => setIsLight(v => !v)

  useEffect(() => {
    if (isLight) {
      document.body.classList.add('light')
      localStorage.setItem('theme', 'light')
    } else {
      document.body.classList.remove('light')
      localStorage.setItem('theme', 'dark')
    }
  }, [isLight])

  const handleCameraCapture = async (e) => {
    const files = Array.from(e.target.files)
    if (!files.length) return
    e.target.value = ''

    capturedPagesRef.current.push(...files)

    const scanMore = window.confirm(`Captured page ${capturedPagesRef.current.length}.\nScan another page?`)
    if (scanMore) {
      cameraInputRef.current?.click()
      return
    }

    const defaultName = `Camera_Report_${new Date().toISOString().slice(0, 10)}`
    let customName = window.prompt('Enter a name for this report:', defaultName)
    if (customName === null) {
      capturedPagesRef.current = []
      return
    }
    customName = customName.trim() || defaultName
    const finalFilename = customName.toLowerCase().endsWith('.pdf') ? customName : `${customName}.pdf`

    try {
      let fileToUpload
      if (capturedPagesRef.current.length === 1) {
        const singleFile = capturedPagesRef.current[0]
        fileToUpload = singleFile.type.startsWith('image/') ? await photoToPdf(singleFile) : singleFile
      } else {
        const pdfBlob = await photosToMultiPagePdf(capturedPagesRef.current)
        fileToUpload = new File([pdfBlob], finalFilename, { type: 'application/pdf' })
      }
      await uploadReportToS3(fileToUpload, activeProfileId, finalFilename)
      navigate('/reports')
    } catch (err) {
      console.error("Failed to compile PDF:", err)
    } finally {
      capturedPagesRef.current = []
    }
  }

  return (
    <>
      {isLoggedIn && (
        <input
          type="file"
          ref={cameraInputRef}
          onChange={handleCameraCapture}
          accept="image/*"
          capture="environment"
          className="hidden"
        />
      )}

      {/* Desktop Pro Sidebar (Left) */}
      <DesktopSidebar isLight={isLight} toggleTheme={toggleTheme} />

      {/* Desktop Top Navbar (No Nav Links — ONLY Portal Title + Controls) */}
      <DesktopNavbar isLight={isLight} toggleTheme={toggleTheme} />

      {/* Mobile Top Header & Detached Floating Bottom Bar */}
      <MobileNav isLight={isLight} toggleTheme={toggleTheme} />
    </>
  )
}