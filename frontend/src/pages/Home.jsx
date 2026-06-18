import React from 'react'
import { Link } from 'react-router-dom'

const features = [
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
      </svg>
    ),
    title: 'Health Vault',
    desc: 'Upload PDFs, images, and prescriptions from your device or phone camera. All reports are stored per family member and can be securely renamed and viewed.',
    color: 'text-teal-400',
    bg: 'bg-teal-950/50',
    border: 'border-teal-900/50',
    tag: 'Reports Page',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    title: 'Health Dashboard',
    desc: 'View vitals, lab markers, AI-flagged diagnostic warnings, medication history, checkup logs, and personalized diet guidelines — all automatically derived from your uploaded reports.',
    color: 'text-cyan-400',
    bg: 'bg-cyan-950/50',
    border: 'border-cyan-900/50',
    tag: 'Dashboard Page',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
    title: 'AI Health Chat',
    desc: 'Ask questions about your medical reports, symptoms, or lab results in plain language. The AI reads your vault data and gives contextual, easy-to-understand health guidance.',
    color: 'text-emerald-400',
    bg: 'bg-emerald-950/50',
    border: 'border-emerald-900/50',
    tag: 'AI Chat Page',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
    title: 'Family Profiles',
    desc: 'Create and manage separate health profiles for each family member — yourself, parents, spouse, or children. Switch profiles instantly from the navbar to view their reports and health data.',
    color: 'text-violet-400',
    bg: 'bg-violet-950/50',
    border: 'border-violet-900/50',
    tag: 'Multi-Profile',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    title: 'Mobile Camera Scan',
    desc: "On mobile, tap the camera button in the bottom navigation bar to scan a prescription or report using your phone camera. The image is added to the active profile's vault immediately.",
    color: 'text-amber-400',
    bg: 'bg-amber-950/50',
    border: 'border-amber-900/50',
    tag: 'Mobile Only',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
    title: 'Emergency Board',
    desc: 'Access critical helplines instantly — national emergency (112), government ambulance (108), blood bank (1097), poison control, and first-aid guides. No login required to view this page.',
    color: 'text-rose-400',
    bg: 'bg-rose-950/50',
    border: 'border-rose-900/50',
    tag: 'Always Available',
  },
]

export default function Home() {
  return (
    <div className="bg-[#080C14] text-slate-100 min-h-screen">

      {/* ── HERO ──────────────────────────────────────────────────── */}
      <section className="relative pt-32 pb-24 px-6 sm:px-12 lg:px-24 overflow-hidden">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[700px] h-[500px] rounded-full bg-teal-700/7 blur-[160px] pointer-events-none" />

        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-12 relative z-10">
          
          {/* Hero Image - Top on Mobile, Right on Desktop */}
          <div className="w-full lg:w-1/2 order-1 lg:order-2 flex justify-center lg:justify-end relative">
            {/* Soft backdrop glow behind image */}
            <div className="absolute inset-0 bg-teal-500/10 rounded-3xl blur-2xl transform rotate-3 -z-10" />
            <img 
              src="/health.jpg" 
              alt="HealthyBe Family Health" 
              className="w-full max-w-md lg:max-w-full rounded-3xl border border-slate-800/80 shadow-[0_25px_60px_rgba(0,0,0,0.5)] object-cover aspect-[4/3] hover:scale-[1.01] transition-transform duration-500"
            />
          </div>

          {/* Hero Text Content - Bottom on Mobile, Left on Desktop */}
          <div className="w-full lg:w-1/2 order-2 lg:order-1 text-center lg:text-left space-y-6">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1]">
              Manage your family's
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 via-cyan-400 to-emerald-400">
                health records easily.
              </span>
            </h1>

            <p className="text-slate-400 text-base sm:text-lg leading-relaxed max-w-xl mx-auto lg:mx-0">
              Upload medical reports, track vitals and lab results, chat with an AI health assistant, and access emergency helplines — all in one place, for your whole family.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
              <Link
                to="/dashboard"
                className="group w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-slate-950 font-black text-sm rounded-2xl shadow-lg shadow-teal-500/20 hover:shadow-teal-500/30 transition-all duration-300 hover:-translate-y-0.5 active:scale-[0.98]"
              >
                Go to Dashboard
                <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
              <Link
                to="/emergency"
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-slate-900/70 hover:bg-slate-800/70 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-slate-100 font-semibold text-sm rounded-2xl transition-all duration-300"
              >
                <svg className="w-4 h-4 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Emergency Board
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── DIVIDER ───────────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-6">
        <div className="h-px bg-gradient-to-r from-transparent via-slate-800 to-transparent" />
      </div>

      {/* ── FEATURES ──────────────────────────────────────────────── */}
      <section className="py-24 px-6 sm:px-12 lg:px-24">
        <div className="max-w-7xl mx-auto">

          <div className="text-center mb-14 space-y-2">
            <span className="text-xs font-black text-teal-400 uppercase tracking-[0.3em]">What's Inside</span>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
              Everything the app includes.
            </h2>
            <p className="text-slate-500 text-sm mt-2 max-w-lg mx-auto">
              Six features built to help you and your family stay on top of health records, results, and emergencies.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((feat, i) => (
              <div
                key={i}
                className="group p-7 rounded-2xl bg-slate-950/60 border border-slate-800/50 hover:border-slate-700/70 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl flex flex-col gap-4"
              >
                {/* Icon + tag row */}
                <div className="flex items-start justify-between">
                  <div className={`inline-flex p-3 rounded-xl ${feat.bg} border ${feat.border} ${feat.color}`}>
                    {feat.icon}
                  </div>
                  <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg ${feat.bg} border ${feat.border} ${feat.color}`}>
                    {feat.tag}
                  </span>
                </div>

                {/* Text */}
                <div>
                  <h3 className="font-bold text-base text-slate-100 mb-2">{feat.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{feat.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────── */}
      <section className="py-20 px-6 sm:px-12 lg:px-24">
        <div className="max-w-2xl mx-auto text-center space-y-5">
          <div className="h-px bg-gradient-to-r from-transparent via-slate-800 to-transparent mb-10" />
          <h2 className="text-3xl font-black tracking-tight">Ready to get started?</h2>
          <p className="text-slate-400 text-sm">
            Create a free account, add your family profiles, and upload your first report.
          </p>
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-slate-950 font-black text-sm rounded-2xl shadow-lg shadow-teal-500/20 transition-all duration-300 hover:-translate-y-0.5"
          >
            Get Started
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
      </section>

    </div>
  )
}