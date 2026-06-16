import React, { useState, useEffect, useRef } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useHealth } from '../context/HealthContext'
import { photoToPdf } from '../utils/photoToPdf'
import { useTranslation } from '../utils/i18n'

function Navbar() {
  const { 
    family, 
    activeProfileId, 
    setActiveProfileId, 
    activeProfile, 
    uploadReportToS3,
    isLoggedIn
  } = useHealth()

  const { t } = useTranslation()
  const navigate = useNavigate()
  const cameraInputRef = useRef(null)

  const [isLight, setIsLight] = useState(() => {
    return localStorage.getItem('theme') === 'light'
  })
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  // Sync theme
  useEffect(() => {
    if (isLight) {
      document.body.classList.add('light')
      localStorage.setItem('theme', 'light')
    } else {
      document.body.classList.remove('light')
      localStorage.setItem('theme', 'dark')
    }
  }, [isLight])

  const handleCameraClick = () => {
    if (!isLoggedIn) {
      navigate('/dashboard')
      return
    }
    const isRealPhone = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    if (!isRealPhone) {
      alert("Camera scanning is available only on mobile phones.")
      return
    }
    cameraInputRef.current?.click()
  }

  const handleCameraCapture = async (e) => {
    const files = Array.from(e.target.files)
    if (files.length === 0) return
    e.target.value = ''

    for (const file of files) {
      const defaultName = `Camera_Report_${new Date().toISOString().slice(0, 10)}`
      let customName = window.prompt("Enter a name for this report:", defaultName)

      // If user cancels the prompt, cancel this upload
      if (customName === null) continue

      customName = customName.trim()
      if (!customName) {
        customName = defaultName
      }

      // Ensure extension is .pdf
      const finalFilename = customName.toLowerCase().endsWith('.pdf') ? customName : `${customName}.pdf`

      let fileToUpload = file
      if (file.type.startsWith('image/')) {
        try {
          fileToUpload = await photoToPdf(file)
        } catch (err) {
          console.error("Failed to convert captured photo to PDF:", err)
        }
      }
      await uploadReportToS3(fileToUpload, activeProfileId, finalFilename)
    }

    const scanMore = window.confirm("Would you like to scan/capture another image for this profile?")
    if (scanMore) {
      cameraInputRef.current?.click()
    } else {
      navigate('/reports')
    }
  }

  // Links definitions are now static so all pages show in the navbar
  const desktopLinks = [
    { path: "/", label: t('nav.home') },
    { path: "/dashboard", label: t('nav.dashboard') },
    { path: "/chat", label: t('nav.chat') },
    { path: "/reports", label: t('nav.reports') },
    { path: "/emergency", label: t('nav.emergency') }
  ]

  const drawerLinks = [
    { path: "/", label: t('nav.home'), icon: "🏠" },
    { path: "/dashboard", label: t('nav.dashboard'), icon: "📊" },
    { path: "/chat", label: t('nav.chat'), icon: "💬" },
    { path: "/reports", label: t('nav.reports'), icon: "📁" },
    { path: "/emergency", label: t('nav.emergency'), icon: "🚨" },
    { path: "/settings", label: t('nav.settings'), icon: "⚙️" }
  ]

  return (
    <>
      {/* Hidden Native Camera Input */}
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

      {/* 1. DESKTOP FLOATING NAVBAR */}
      <nav className="hidden md:flex fixed top-5 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-5xl bg-slate-950/75 backdrop-blur-lg border border-slate-800/80 px-6 py-3 rounded-full items-center justify-between shadow-2xl transition-all duration-300">
        
        {/* Brand Logo */}
        <NavLink to="/" className="flex items-center gap-2.5 hover:opacity-90 transition-opacity">
          <div className="w-8 h-8 rounded-full border border-slate-800/80 flex items-center justify-center bg-slate-950 shadow-md overflow-hidden">
            <img src="/favicon.ico" alt="HealthyBe Logo" className="w-full h-full object-cover rounded-full" />
          </div>
          <h1 className="font-extrabold text-white tracking-wide text-lg">HealthyBe</h1>
        </NavLink>

        {/* Navigation Links */}
        <div className="flex items-center gap-1.5">
          {desktopLinks.map((link) => (
            <NavLink
              key={link.path}
              to={link.path}
              className={({ isActive }) =>
                `px-4 py-2 rounded-full text-xs font-semibold tracking-wide transition-all duration-200 ${
                  isActive
                    ? 'text-teal-400 bg-teal-950/30 border border-teal-900/40 shadow-inner'
                    : 'text-slate-400 hover:text-slate-200'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-4">
          {/* Theme Toggle Button */}
          <button
            onClick={() => setIsLight(!isLight)}
            aria-label="Toggle Theme"
            className="p-2.5 rounded-full bg-slate-900 border border-slate-800/80 hover:border-slate-700/80 text-slate-400 hover:text-slate-200 transition-all duration-200 shadow-md"
          >
            {isLight ? (
              <svg className="w-4 h-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            ) : (
              <svg className="w-4 h-4 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M12 7a5 5 0 100 10 5 5 0 000-10z" />
              </svg>
            )}
          </button>

          {isLoggedIn ? (
            /* Profile Avatar Dropdown */
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-teal-400 text-xs hover:border-teal-400 transition-all duration-200 shadow-md focus:outline-none overflow-hidden"
              >
                {activeProfile?.profileImageUrl ? (
                  <img src={activeProfile?.profileImageUrl} alt={activeProfile?.name || ''} className="w-full h-full object-cover" />
                ) : (
                  activeProfile?.initials || ''
                )}
              </button>
              
              {dropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)}></div>
                  <div className="absolute right-0 mt-3.5 w-56 rounded-2xl bg-slate-950 border border-slate-900 p-2 shadow-2xl z-50 animate-fade-in space-y-1">
                    <NavLink 
                      to="/settings" 
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-900 transition-all"
                    >
                      <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {t('nav.settings')}
                    </NavLink>
                    
                    <div className="border-t border-slate-900 my-1"></div>
                    <div className="px-3 py-1 text-[9px] font-black text-slate-500 uppercase tracking-wider font-mono">
                      {t('nav.switchProfile')}
                    </div>
                    
                    <div className="space-y-0.5">
                      {family.map((member) => (
                        <button
                          key={member.id}
                          type="button"
                          onClick={() => {
                            setActiveProfileId(member.id)
                            setDropdownOpen(false)
                          }}
                          className={`w-full text-left flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                            member.id === activeProfileId 
                              ? 'text-teal-400 bg-teal-950/20' 
                              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-slate-900 border border-slate-850 text-[9px] font-extrabold flex items-center justify-center text-teal-400 overflow-hidden">
                              {member.profileImageUrl ? (
                                <img src={member.profileImageUrl} alt={member.name} className="w-full h-full object-cover" />
                              ) : (
                                member.initials
                              )}
                            </span>
                            <span>{member.name}</span>
                          </div>
                          {member.id === activeProfileId && <span className="text-[10px] text-teal-400">✓</span>}
                        </button>
                      ))}
                    </div>
                    
                    <div className="border-t border-slate-900 my-1"></div>
                    <div className="px-3 py-1.5 text-[9px] text-slate-500 font-mono truncate">
                      {activeProfile?.email || ''}
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            /* Sign In Link for Desktop */
            <NavLink
              to="/dashboard"
              className="px-6 py-2 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-black font-extrabold text-xs rounded-full uppercase tracking-wider transition-all"
            >
              {t('nav.signIn')}
            </NavLink>
          )}
        </div>
      </nav>

      {/* 2. MOBILE TOP BAR */}
      <header className="flex md:hidden fixed top-0 left-0 right-0 h-16 bg-slate-950/80 backdrop-blur-md border-b border-slate-900/80 px-4 items-center justify-between z-50 shadow-md">
        <button 
          onClick={() => setIsDrawerOpen(true)}
          aria-label="Open navigation drawer"
          className="p-2 rounded-xl text-slate-400 hover:text-slate-200 active:bg-slate-900/50 transition-colors focus:outline-none"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <NavLink to="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full border border-slate-800/80 flex items-center justify-center bg-slate-950 overflow-hidden">
            <img src="/favicon.ico" alt="HealthyBe Logo" className="w-full h-full object-cover" />
          </div>
          <span className="font-extrabold text-white text-base tracking-wide">HealthyBe</span>
        </NavLink>

        <button
          onClick={() => setIsLight(!isLight)}
          aria-label="Toggle Theme"
          className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 active:scale-95 transition-all"
        >
          {isLight ? (
            <svg className="w-4 h-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          ) : (
            <svg className="w-4 h-4 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M12 7a5 5 0 100 10 5 5 0 000-10z" />
            </svg>
          )}
        </button>
      </header>

      {/* 3. MOBILE SLIDING DRAWER BACKDROP */}
      {isDrawerOpen && (
        <div 
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] md:hidden animate-fade-in"
          onClick={() => setIsDrawerOpen(false)}
        ></div>
      )}

      {/* 4. MOBILE SLIDING DRAWER (ANDROID STYLE) */}
      <div className={`fixed top-0 bottom-0 left-0 w-80 bg-slate-950 border-r border-slate-900 z-[70] md:hidden flex flex-col transition-transform duration-300 ease-in-out ${
        isDrawerOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {/* Drawer Header */}
        <div className="p-6 bg-slate-900/40 border-b border-slate-900 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isLoggedIn ? (
                <>
                  <div className="w-10 h-10 rounded-full bg-teal-950 border border-teal-900 text-teal-400 font-black flex items-center justify-center text-sm shadow-md overflow-hidden">
                    {activeProfile?.profileImageUrl ? (
                      <img src={activeProfile?.profileImageUrl} alt={activeProfile?.name || ''} className="w-full h-full object-cover" />
                    ) : (
                      activeProfile?.initials || ''
                    )}
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-200">{activeProfile?.name || ''}</h4>
                    <p className="text-[10px] text-slate-500 font-mono mt-0.5">{activeProfile?.email || ''}</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 text-sm shadow-md">
                    👤
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-200">Guest Account</h4>
                    <p className="text-[10px] text-slate-500 font-mono mt-0.5">Please sign in to access records</p>
                  </div>
                </>
              )}
            </div>
            <button 
              onClick={() => setIsDrawerOpen(false)}
              aria-label="Close drawer"
              className="p-1.5 rounded-full text-slate-500 hover:text-slate-300 active:bg-slate-900 transition-colors focus:outline-none"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Profile Switcher */}
          {isLoggedIn && (
            <div className="space-y-1">
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block font-mono">{t('nav.selectProfile')}</span>
              <div className="grid grid-cols-3 gap-1.5 pt-1">
                {family.map(member => (
                  <button
                    key={member.id}
                    onClick={() => {
                      setActiveProfileId(member.id)
                      setIsDrawerOpen(false)
                    }}
                    className={`py-2 rounded-lg border text-[10px] font-extrabold text-center transition-all truncate px-1 ${
                      member.id === activeProfileId 
                        ? 'bg-teal-950/30 border-teal-900/50 text-teal-400 shadow-inner' 
                        : 'bg-slate-900/20 border-slate-900 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {member.profileImageUrl ? (
                      <img src={member.profileImageUrl} alt={member.name} className="w-4 h-4 rounded-full object-cover inline-block" />
                    ) : (
                      member.initials
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Drawer Body NavLinks */}
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1.5">
          {drawerLinks.map((link) => (
            <NavLink
              key={link.path}
              to={link.path}
              onClick={() => setIsDrawerOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3.5 px-4 py-3.5 rounded-xl text-xs font-bold tracking-wide transition-all ${
                  isActive
                    ? 'text-teal-400 bg-teal-950/20 border-l-4 border-teal-400 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
                }`
              }
            >
              <span className="text-base leading-none">{link.icon}</span>
              <span>{link.label}</span>
            </NavLink>
          ))}
          {!isLoggedIn && (
            <NavLink
              to="/dashboard"
              onClick={() => setIsDrawerOpen(false)}
              className="flex items-center gap-3.5 px-4 py-3.5 rounded-xl text-xs font-bold tracking-wide text-teal-400 hover:bg-teal-950/20 transition-all border border-teal-900/30 mt-4"
            >
              <span className="text-base leading-none">🔑</span>
              <span>{t('nav.signIn')} / Register</span>
            </NavLink>
          )}
        </div>

        {/* Drawer Footer */}
        <div className="p-4 border-t border-slate-900 text-center">
          <p className="text-[9px] font-mono text-slate-600">HealthyBe v1.0.0 Android-Drawer</p>
        </div>
      </div>

      {/* 5. MOBILE BOTTOM NAVIGATION BAR */}
      <div className="fixed bottom-0 left-0 right-0 h-16 bg-slate-950/90 backdrop-blur-lg border-t border-slate-900/80 flex items-center justify-around px-2 pb-safe z-50 shadow-[0_-4px_24px_rgba(0,0,0,0.4)] md:hidden">
        
        {/* Tab 1: Home */}
        <NavLink
          to="/"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center w-12 h-12 transition-all ${
              isActive ? 'text-teal-400' : 'text-slate-500 hover:text-slate-400'
            }`
          }
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          <span className="text-[9px] font-bold mt-0.5">{t('nav.home')}</span>
        </NavLink>

        {/* Tab 2: Dashboard */}
        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center w-12 h-12 transition-all ${
              isActive ? 'text-teal-400' : 'text-slate-500 hover:text-slate-400'
            }`
          }
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <span className="text-[9px] font-bold mt-0.5">{t('nav.dashboard')}</span>
        </NavLink>

        {/* Center: Camera FAB */}
        <div className="relative -top-4">
          <button
            onClick={handleCameraClick}
            aria-label="Scan Document"
            className="w-14 h-14 bg-gradient-to-tr from-teal-500 to-cyan-500 text-slate-950 hover:from-teal-400 hover:to-cyan-400 rounded-full flex items-center justify-center shadow-[0_4px_20px_rgba(45,212,191,0.4)] active:scale-95 transition-all border-4 border-slate-950 focus:outline-none"
          >
            <svg className="w-6 h-6 text-slate-950" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>

        {/* Tab 3: AI Chat */}
        <NavLink
          to="/chat"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center w-12 h-12 transition-all ${
              isActive ? 'text-teal-400' : 'text-slate-500 hover:text-slate-400'
            }`
          }
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <span className="text-[9px] font-bold mt-0.5">{t('nav.chat')}</span>
        </NavLink>

        {/* Tab 4: Vault */}
        <NavLink
          to="/reports"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center w-12 h-12 transition-all ${
              isActive ? 'text-teal-400' : 'text-slate-500 hover:text-slate-400'
            }`
          }
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
          </svg>
          <span className="text-[9px] font-bold mt-0.5">{t('nav.reports')}</span>
        </NavLink>
      </div>
    </>
  )
}

export default Navbar