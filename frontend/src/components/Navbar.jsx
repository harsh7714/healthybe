import React, { useState, useEffect, useRef } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useHealth } from '../context/HealthContext'
import { photoToPdf, photosToMultiPagePdf } from '../utils/photoToPdf'
import { useTranslation } from '../utils/translationService'

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
  const capturedPagesRef = useRef([])

  const [isLight, setIsLight] = useState(() => {
    return localStorage.getItem('theme') === 'light'
  })
  const [dropdownOpen, setDropdownOpen] = useState(false)

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

    // Add files to current collection
    capturedPagesRef.current.push(...files)

    // Prompt user to add more pages
    const scanMore = window.confirm(
      `Captured page ${capturedPagesRef.current.length}.\nWould you like to scan/capture another page for this report?`
    )

    if (scanMore) {
      cameraInputRef.current?.click()
      return
    }

    // Done scanning all pages, compile and name
    const pagesCount = capturedPagesRef.current.length
    const defaultName = `Camera_Report_${new Date().toISOString().slice(0, 10)}`
    let customName = window.prompt(
      `Compiling ${pagesCount} page(s) into one PDF.\nEnter a name for this report:`,
      defaultName
    )

    // If user cancels the prompt, cancel this upload and reset captured pages
    if (customName === null) {
      capturedPagesRef.current = []
      return
    }

    customName = customName.trim()
    if (!customName) {
      customName = defaultName
    }

    // Ensure extension is .pdf
    const finalFilename = customName.toLowerCase().endsWith('.pdf') ? customName : `${customName}.pdf`

    try {
      let fileToUpload
      if (capturedPagesRef.current.length === 1) {
        // Single page fast path
        const singleFile = capturedPagesRef.current[0]
        fileToUpload = singleFile.type.startsWith('image/') ? await photoToPdf(singleFile) : singleFile
      } else {
        // Multi page compiling
        const pdfBlob = await photosToMultiPagePdf(capturedPagesRef.current)
        fileToUpload = new File([pdfBlob], finalFilename, { type: 'application/pdf' })
      }

      await uploadReportToS3(fileToUpload, activeProfileId, finalFilename)
      navigate('/reports')
    } catch (err) {
      console.error("Failed to compile multi-page PDF:", err)
    } finally {
      capturedPagesRef.current = [] // clear collection
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

      {/* 3. MOBILE BOTTOM NAVIGATION BAR */}
      <div className="fixed bottom-0 left-0 right-0 h-16 bg-slate-950/90 backdrop-blur-lg border-t border-slate-900/80 flex items-center justify-between px-6 pb-safe z-50 shadow-[0_-4px_24px_rgba(0,0,0,0.4)] md:hidden">
        
        {/* Tab 2: Dashboard */}
        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center w-12 h-12 transition-all ${
              isActive ? 'text-teal-400' : 'text-slate-500 hover:text-slate-400'
            }`
          }
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <span className="text-[8px] font-bold mt-0.5">{t('nav.dashboard')}</span>
        </NavLink>

        {/* Tab 3: Emergency */}
        <NavLink
          to="/emergency"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center w-12 h-12 transition-all ${
              isActive ? 'text-teal-400' : 'text-slate-500 hover:text-slate-400'
            }`
          }
        >
          <svg className="w-4 h-4 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span className="text-[8px] font-bold mt-0.5">{t('nav.emergency')}</span>
        </NavLink>

        {/* Center: Camera FAB */}
        <div className="relative -top-3">
          <button
            onClick={handleCameraClick}
            aria-label="Scan Document"
            className="w-12 h-12 bg-gradient-to-tr from-teal-500 to-cyan-500 text-slate-950 hover:from-teal-400 hover:to-cyan-400 rounded-full flex items-center justify-center shadow-[0_4px_16px_rgba(45,212,191,0.3)] active:scale-95 transition-all border-4 border-slate-950 focus:outline-none"
          >
            <svg className="w-5 h-5 text-slate-950" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>

        {/* Tab 4: Vault */}
        <NavLink
          to="/reports"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center w-12 h-12 transition-all ${
              isActive ? 'text-teal-400' : 'text-slate-500 hover:text-slate-400'
            }`
          }
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
          </svg>
          <span className="text-[8px] font-bold mt-0.5">{t('nav.reports')}</span>
        </NavLink>

        {/* Tab 5: Settings */}
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center w-12 h-12 transition-all ${
              isActive ? 'text-teal-400' : 'text-slate-500 hover:text-slate-400'
            }`
          }
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="text-[8px] font-bold mt-0.5">{t('nav.settings')}</span>
        </NavLink>

      </div>
    </>
  )
}

export default Navbar