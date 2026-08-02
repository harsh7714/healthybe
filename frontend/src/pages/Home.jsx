import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useHealth } from '../context/HealthContext'

const features = [
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
      </svg>
    ),
    title: 'Health Vault',
    desc: 'Upload lab PDFs, camera prescriptions, and imaging reports. All documents organized securely per family member.',
    color: 'text-teal-400',
    tag: 'Reports Vault',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    title: 'Clinical Telemetry Dashboard',
    desc: 'View vitals telemetry, blood test lab markers, AI diagnostic flags, active medications, and personalized diet guidelines.',
    color: 'text-cyan-400',
    tag: 'Live Dashboard',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
    title: 'ChatGPT Voice & Text Health AI',
    desc: 'Ask questions about lab results or symptoms in 10 regional languages with instant spoken voice responses.',
    color: 'text-emerald-400',
    tag: 'AI Voice 2.0',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    title: 'Linked Family Vaults',
    desc: 'Create distinct health vaults for yourself, parents, spouse, or children. Switch profiles with a single tap.',
    color: 'text-violet-400',
    tag: 'Multi-Profile',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    title: 'Mobile Document Scanner',
    desc: "Use your phone camera to snap paper prescriptions or test reports. Automatically crops borders and OCR cleans text.",
    color: 'text-amber-400',
    tag: 'Mobile Scanner',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
    title: 'Emergency Board & Ambulance Siren',
    desc: 'Instant access to national 112 emergency calling, first-aid protocols, poison control, and ambulance beacon animations.',
    color: 'text-rose-400',
    tag: '24/7 SOS',
  },
]

const steps = [
  {
    num: '01',
    title: 'Create Pro Family Profile',
    desc: 'Sign up free and receive your permanent unique User ID to link family profiles.',
    color: 'text-teal-400',
  },
  {
    num: '02',
    title: 'Upload or Camera Scan Reports',
    desc: 'Drag & drop lab PDFs or snap paper prescriptions with the mobile scanner.',
    color: 'text-cyan-400',
  },
  {
    num: '03',
    title: 'Explore AI Telemetry Insights',
    desc: 'Dashboard auto-fills with clinical vitals. Speak with AI in 10 languages.',
    color: 'text-emerald-400',
  },
]

export default function Home() {
  const { activeProfile, reports = [], family = [] } = useHealth()
  const [copyToast, setCopyToast] = useState('')

  /* Retrieve permanent User ID */
  const [userId] = useState(() => {
    let saved = localStorage.getItem('healthybe_permanent_user_id')
    if (!saved) {
      const randNum = Math.floor(100000 + Math.random() * 900000)
      const randCode = Math.random().toString(36).substring(2, 4).toUpperCase()
      saved = `HB-${randNum}-${randCode}`
      localStorage.setItem('healthybe_permanent_user_id', saved)
    }
    return saved
  })

  const copyUserId = () => {
    navigator.clipboard.writeText(userId)
    setCopyToast('Permanent User ID copied!')
    setTimeout(() => setCopyToast(''), 3000)
  }

  const userName = activeProfile?.name || 'HealthyBe User'
  const reportCount = reports ? reports.length : 0

  return (
    <div className="text-slate-100 min-h-screen">

      {/* Copy Toast */}
      {copyToast && (
        <div className="fixed top-20 right-6 z-50 px-4 py-2.5 rounded-2xl bg-emerald-500 text-slate-950 font-bold text-xs shadow-2xl animate-fade-in">
          ✓ {copyToast}
        </div>
      )}

      {/* ── WELCOME HERO SECTION (POST-LOGIN / SIGNUP) ── */}
      <section className="relative pt-8 md:pt-14 pb-16 px-4 sm:px-8 lg:px-16 overflow-hidden">
        
        {/* Glowing Background Orbs */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-teal-500/10 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute top-40 right-10 w-[400px] h-[300px] bg-cyan-500/10 blur-[100px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-12 relative z-10">

          {/* Left Text Column with Welcome Greeting */}
          <div className="w-full lg:w-1/2 text-center lg:text-left space-y-6">

            {/* Pill Tag & Permanent User ID Badge */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-300 font-mono text-xs font-bold tracking-wider uppercase">
                <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
                <span>⚡ VERIFIED ACCOUNT</span>
              </div>

              {/* Permanent User ID Chip */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-slate-300 font-mono text-xs font-bold">
                <span>ID: <strong className="text-teal-300 select-all">{userId}</strong></span>
                <button
                  type="button"
                  onClick={copyUserId}
                  className="text-[10px] text-teal-400 font-bold hover:text-teal-300 bg-teal-500/10 border border-teal-500/20 px-2 py-0.5 rounded-lg cursor-pointer"
                  title="Copy User ID"
                >
                  📋 Copy
                </button>
              </div>
            </div>

            {/* Welcome Greeting Headline */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-100 leading-tight" style={{ fontFamily: 'var(--font-display)' }}>
              Welcome back, <br />
              <span className="bg-gradient-to-r from-teal-400 via-cyan-300 to-emerald-400 bg-clip-text text-transparent">
                {userName}! 👋
              </span>
            </h1>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-xl mx-auto lg:mx-0 font-normal">
              Your health vault is active with <strong>{reportCount} report(s)</strong> stored across <strong>{family.length} family profile(s)</strong>. Ask AI questions or run live telemetry analytics anytime.
            </p>

            {/* Call to Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
              <Link
                to="/dashboard"
                className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-teal-400 via-teal-500 to-cyan-500 hover:from-teal-300 hover:to-cyan-400 text-slate-950 font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-teal-500/25 active:scale-95 text-center"
              >
                Open Dashboard →
              </Link>
              <Link
                to="/reports"
                className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 font-bold text-xs uppercase tracking-wider transition-all text-center"
              >
                📷 Upload Medical Report
              </Link>
              <Link
                to="/chat"
                className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-teal-300 font-bold text-xs uppercase tracking-wider transition-all text-center"
              >
                💬 Ask AI Chat
              </Link>
            </div>

          </div>

          {/* Right Live Dashboard Telemetry Mockup */}
          <div className="w-full lg:w-1/2 flex justify-center lg:justify-end">
            <div className="relative w-full max-w-md">
              <div className="absolute -inset-4 rounded-3xl bg-gradient-to-r from-teal-500/20 via-cyan-500/10 to-indigo-500/20 blur-2xl opacity-60" />

              <div className="relative rounded-3xl bg-[#0c1220] border border-slate-800 p-6 shadow-2xl space-y-5">
                
                {/* Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-950 border border-teal-500/40 flex items-center justify-center font-black text-teal-400 text-sm overflow-hidden shrink-0">
                      {activeProfile?.profileImageUrl ? (
                        <img src={activeProfile.profileImageUrl} alt={userName} className="w-full h-full object-cover" />
                      ) : (
                        activeProfile?.initials || 'U'
                      )}
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-100">{userName}</h4>
                      <p className="text-[10px] text-slate-400 font-mono">Permanent User ID: {userId}</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold text-[9px] uppercase tracking-wider font-mono">
                    ● AI ACTIVE
                  </span>
                </div>

                {/* Animated ECG Pulse Wave */}
                <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
                  <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono">
                    <span>ECG TELEMETRY WAVE</span>
                    <span className="text-teal-400 font-bold">72 BPM (OPTIMAL)</span>
                  </div>
                  <div className="h-10 flex items-center justify-center overflow-hidden">
                    <svg className="w-full h-8 text-teal-400 animate-pulse" viewBox="0 0 300 40" fill="none">
                      <path d="M0 20 H60 L70 5 L80 35 L90 10 L100 25 L110 20 H200 L210 5 L220 35 L230 10 L240 25 L250 20 H300" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </div>

                {/* Vitals Cards */}
                <div className="grid grid-cols-3 gap-2.5">
                  <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 text-center">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block font-mono">Heart Rate</span>
                    <span className="text-base font-black text-slate-100 font-mono">72 <span className="text-[9px] text-slate-400">bpm</span></span>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 text-center">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block font-mono">BP Rate</span>
                    <span className="text-base font-black text-slate-100 font-mono">120/80</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 text-center">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block font-mono">Oxygen</span>
                    <span className="text-base font-black text-slate-100 font-mono">99%</span>
                  </div>
                </div>

                {/* AI Summary Badge */}
                <div className="p-3.5 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-start gap-2.5">
                  <span className="text-teal-400 text-sm">💡</span>
                  <p className="text-[11px] text-teal-200 leading-relaxed font-medium">
                    All lab biomarkers are in optimal clinical ranges. Next checkup recommended in 6 months.
                  </p>
                </div>

              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ── FEATURES GRID ── */}
      <section className="py-16 px-4 sm:px-8 lg:px-16 border-t border-slate-800/80 bg-[#080c14]">
        <div className="max-w-7xl mx-auto space-y-12">
          
          <div className="text-center space-y-2">
            <span className="text-[10px] font-extrabold text-teal-400 uppercase tracking-widest font-mono">
              Complete Feature Suite
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-100" style={{ fontFamily: 'var(--font-display)' }}>
              Everything Your Family Needs for Health Management
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <div 
                key={i}
                className="p-6 rounded-3xl bg-[#0c1220] border border-slate-800/80 hover:border-teal-500/40 transition-all duration-300 hover:-translate-y-1 space-y-4 shadow-xl"
              >
                <div className="flex items-center justify-between">
                  <div className={`p-3 rounded-2xl bg-slate-900 ${f.color} border border-slate-800`}>
                    {f.icon}
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-[10px] font-mono text-slate-400 font-bold">
                    {f.tag}
                  </span>
                </div>

                <div className="space-y-1.5">
                  <h3 className="font-extrabold text-base text-slate-100">{f.title}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ── WORKFLOW STEPPER ── */}
      <section className="py-16 px-4 sm:px-8 lg:px-16 border-t border-slate-800/80">
        <div className="max-w-5xl mx-auto space-y-12 text-center">
          
          <div className="space-y-2">
            <span className="text-[10px] font-extrabold text-teal-400 uppercase tracking-widest font-mono">
              Simple 3-Step Process
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-100" style={{ fontFamily: 'var(--font-display)' }}>
              How HealthyBe Works
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            {steps.map((s, i) => (
              <div key={i} className="p-6 rounded-3xl bg-[#0c1220] border border-slate-800 space-y-3 relative">
                <span className={`text-2xl font-black font-mono ${s.color}`}>{s.num}</span>
                <h3 className="font-bold text-sm text-slate-100">{s.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>

        </div>
      </section>

    </div>
  )
}