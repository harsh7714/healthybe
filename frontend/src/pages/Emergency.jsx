import React, { useState } from 'react'

function Emergency() {
  const [activeGuide, setActiveGuide] = useState('cpr')

  const handleDial = (number) => {
    window.location.href = `tel:${number}`
  }

  // Helper function to render step SVGs
  const getStepIcon = (iconName) => {
    const classVal = "w-5 h-5"
    switch (iconName) {
      case 'shield':
        return (
          <svg className={classVal} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        )
      case 'chat':
        return (
          <svg className={classVal} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        )
      case 'phone':
        return (
          <svg className={classVal} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
          </svg>
        )
      case 'wind':
        return (
          <svg className={classVal} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        )
      case 'heart':
        return (
          <svg className={classVal} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        )
      case 'arrow-down':
        return (
          <svg className={classVal} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        )
      case 'adjust':
        return (
          <svg className={classVal} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
          </svg>
        )
      case 'pill':
        return (
          <svg className={classVal} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
          </svg>
        )
      case 'refresh':
        return (
          <svg className={classVal} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 8H17" />
          </svg>
        )
      case 'water':
        return (
          <svg className={classVal} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        )
      case 'arrow-up':
        return (
          <svg className={classVal} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
        )
      case 'lock':
        return (
          <svg className={classVal} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        )
      default:
        return (
          <svg className={classVal} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
    }
  }

  const guides = {
    cpr: {
      title: "Cardiopulmonary Resuscitation (CPR)",
      symptom: "Unconscious / Not Breathing",
      label: "CPR Protocol",
      themeColor: "rose",
      badgeClass: "bg-rose-500/20 text-rose-300 border-rose-500/40",
      stepNumClass: "from-rose-500 to-red-600 shadow-rose-500/20",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 11v4m-2-2h4" />
        </svg>
      ),
      doNot: [
        "DO NOT stop compressions until medical personnel arrive.",
        "DO NOT breathe into patient if you are not trained (Hands-Only CPR)."
      ],
      steps: [
        { action: "Verify Safety", details: "Ensure scene is safe for you and the patient.", icon: "shield" },
        { action: "Check Response", details: "Pinch shoulders and shout: 'Are you okay?'", icon: "chat" },
        { action: "Call Hotlines", details: "Dial 112 immediately. Request an AED.", icon: "phone" },
        { action: "Check Breath", details: "Observe chest movements for normal breathing (max 10s).", icon: "wind" },
        { action: "Push Hard & Fast", details: "Deliver 100-120 compressions/min, 2 inches deep in center of chest.", icon: "heart" },
        { action: "Cycle breaths", details: "Give 2 rescue breaths after every 30 compressions if trained.", icon: "wind" }
      ]
    },
    heart_attack: {
      title: "Cardiac Distress / Heart Attack",
      symptom: "Chest Pain / Short Breath",
      label: "Heart Attack",
      themeColor: "orange",
      badgeClass: "bg-orange-500/20 text-orange-300 border-orange-500/40",
      stepNumClass: "from-orange-500 to-amber-600 shadow-orange-500/20",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 12h3L9 5l4 14 3-8h5" />
        </svg>
      ),
      doNot: [
        "DO NOT let the patient walk or exert themselves.",
        "DO NOT give food or drink except recommended medications."
      ],
      steps: [
        { action: "Call 112", details: "Initiate emergency ambulance services immediately.", icon: "phone" },
        { action: "Sit Patient", details: "Position patient upright on floor, knees bent to reduce heart strain.", icon: "arrow-down" },
        { action: "Loosen Clothes", details: "Unbutton collar, loosen tie and belt.", icon: "adjust" },
        { action: "Query Meds", details: "Help administer prescribed nitroglycerin if available.", icon: "pill" },
        { action: "Give Aspirin", details: "Have patient chew one adult aspirin (325mg) if not allergic.", icon: "pill" },
        { action: "Monitor Vitals", details: "Prepare for CPR if patient loses consciousness.", icon: "heart" }
      ]
    },
    choking: {
      title: "Airway Obstruction (Choking)",
      symptom: "Cannot Speak / Choking",
      label: "Choking Help",
      themeColor: "amber",
      badgeClass: "bg-amber-500/20 text-amber-300 border-amber-500/40",
      stepNumClass: "from-amber-400 to-yellow-600 shadow-amber-500/20",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
        </svg>
      ),
      doNot: [
        "DO NOT perform abdominal thrusts on infants or pregnant women.",
        "DO NOT perform blind finger sweeps in the mouth."
      ],
      steps: [
        { action: "Assess Cough", details: "If patient can speak or cough, encourage active coughing.", icon: "chat" },
        { action: "Give Back Blows", details: "Deliver 5 sharp blows between shoulder blades with heel of hand.", icon: "arrow-down" },
        { action: "Abdominal Thrusts", details: "Stand behind, make fist above navel, pull hard inward and upward.", icon: "arrow-up" },
        { action: "Alternate Cycles", details: "Repeat 5 back blows and 5 abdominal thrusts.", icon: "refresh" },
        { action: "Call 112", details: "If airway remains blocked after 2 cycles, call emergency immediately.", icon: "phone" }
      ]
    },
    burns: {
      title: "Severe Thermal Burns",
      symptom: "Skin Blisters / Severe Burn",
      label: "Burns Protocol",
      themeColor: "violet",
      badgeClass: "bg-violet-500/20 text-violet-300 border-violet-500/40",
      stepNumClass: "from-violet-500 to-purple-600 shadow-violet-500/20",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
        </svg>
      ),
      doNot: [
        "DO NOT apply ice, butter, grease, or ointments.",
        "DO NOT peel off stuck clothing or pop blisters."
      ],
      steps: [
        { action: "Cool Burn", details: "Run cool tap water over burn for 10-20 minutes.", icon: "water" },
        { action: "Remove Jewelry", details: "Gently remove tight bands or rings before swelling starts.", icon: "adjust" },
        { action: "Cover Loosely", details: "Apply sterile, non-stick gauze or clean plastic wrap.", icon: "shield" },
        { action: "Elevate Area", details: "Raise burned limb above heart level to limit edema.", icon: "arrow-up" },
        { action: "Prevent Shock", details: "Keep patient warm, flat, and elevate feet slightly.", icon: "shield" }
      ]
    },
    fracture: {
      title: "Bone Fracture & Splinting",
      symptom: "Deformed Limb / Fracture",
      label: "Fracture spl",
      themeColor: "cyan",
      badgeClass: "bg-cyan-500/20 text-cyan-300 border-cyan-500/40",
      stepNumClass: "from-cyan-500 to-blue-600 shadow-cyan-500/20",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      doNot: [
        "DO NOT try to push a protruding bone back in.",
        "DO NOT move the joint above or below the injury site."
      ],
      steps: [
        { action: "Control Bleeding", details: "Apply direct pressure with sterile pad.", icon: "water" },
        { action: "Immobilize Joint", details: "Apply rigid splint or sling to secure limb position.", icon: "lock" },
        { action: "Apply Ice", details: "Use towel-wrapped cold pack for 15 mins to reduce swelling.", icon: "water" },
        { action: "Elevate Limb", details: "Raise injured area above heart level if it causes no pain.", icon: "arrow-up" },
        { action: "Prevent Shock", details: "Keep patient still, warm, and comfortable.", icon: "shield" }
      ]
    }
  }

  const activeColor = guides[activeGuide].themeColor

  return (
    <div className="emergency-bg-root bg-[#0B0F19] text-slate-100 min-h-screen pt-20 md:pt-28 pb-24 md:pb-20 px-4 sm:px-12 lg:px-24 relative overflow-hidden">
      
      {/* Ambient Glow Effects */}
      <div className="absolute top-[-10%] left-[-15%] w-[600px] h-[600px] rounded-full bg-rose-900/15 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-teal-900/15 blur-[150px] pointer-events-none" />

      <div className="max-w-5xl mx-auto space-y-8 relative z-10">
        
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-500 animate-ping" />
              <h1 className="text-2xl sm:text-3xl font-black text-slate-100 tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
                Emergency Medical Response
              </h1>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Immediate 112 dispatch & step-by-step first aid protocols. No login required.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold font-mono uppercase tracking-wider">
              🚨 24/7 Active Dispatch
            </span>
          </div>
        </div>

        {/* Primary Call Action Banner with Rotating Red & Blue Ambulance Light */}
        <button 
          onClick={() => handleDial("112")}
          className="w-full p-6 rounded-3xl bg-gradient-to-r from-rose-600 via-red-600 to-rose-700 hover:from-rose-500 hover:to-red-500 text-white flex flex-col sm:flex-row sm:items-center sm:justify-between items-start transition-all duration-300 shadow-2xl shadow-rose-600/30 active:scale-[0.99] text-left gap-4 group cursor-pointer relative overflow-hidden"
        >
          {/* Animated Ambient Red & Blue Light Beams */}
          <div className="absolute -top-12 -left-12 w-40 h-40 bg-red-500/40 rounded-full blur-2xl siren-red-glow pointer-events-none" />
          <div className="absolute -bottom-12 -right-12 w-40 h-40 bg-blue-500/40 rounded-full blur-2xl siren-blue-glow pointer-events-none" />

          <div className="flex items-center gap-4 relative z-10">
            
            {/* Rotating Ambulance Siren Light Widget */}
            <div className="relative w-14 h-14 rounded-2xl bg-black/40 border border-white/20 flex items-center justify-center shrink-0 shadow-2xl group-hover:scale-110 transition-transform overflow-hidden">
              
              {/* 360 degree Rotating Lens Flare Beam Rays */}
              <div className="absolute inset-0 siren-beacon-spin flex items-center justify-center pointer-events-none">
                <div className="w-full h-2 bg-gradient-to-r from-red-500 via-transparent to-blue-500 blur-[1px] opacity-90" />
                <div className="w-2 h-full bg-gradient-to-b from-blue-500 via-transparent to-red-500 blur-[1px] opacity-90" />
              </div>

              {/* Pulsing Core Siren Orb */}
              <div className="relative z-10 w-7 h-7 rounded-full bg-gradient-to-tr from-rose-500 to-blue-500 flex items-center justify-center text-white text-xs shadow-[0_0_15px_rgba(239,68,68,0.9)]">
                🚨
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl sm:text-2xl font-black leading-none text-white tracking-tight">
                  DIAL PRIMARY EMERGENCY (112)
                </h3>
                <span className="w-2.5 h-2.5 rounded-full bg-blue-400 siren-blue-glow" />
              </div>
              <p className="text-xs font-bold mt-1 text-slate-100">
                Ambulance, Fire, Police & Critical Services Dispatch (Live Siren Response)
              </p>
            </div>
          </div>

          <span className="px-6 py-3 bg-slate-950 hover:bg-black text-rose-400 font-black text-xs rounded-2xl shadow-xl uppercase tracking-widest shrink-0 self-start sm:self-auto transition-all border border-rose-500/40 relative z-10 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-rose-500 siren-red-glow" />
            <span>CALL 112 NOW</span>
          </span>
        </button>

        {/* Helpline Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "AMBULANCE", num: "108", color: "from-rose-500/20 to-red-600/10 border-rose-500/30 text-rose-400" },
            { label: "POISON CONTROL", num: "1800-11-6117", color: "from-amber-500/20 to-yellow-600/10 border-amber-500/30 text-amber-400" },
            { label: "RED CROSS BLOOD", num: "1097", color: "from-cyan-500/20 to-blue-600/10 border-cyan-500/30 text-cyan-400" },
            { label: "POLICE RESPONSE", num: "100", color: "from-violet-500/20 to-indigo-600/10 border-violet-500/30 text-violet-400" }
          ].map((h, idx) => (
            <button 
              key={idx}
              onClick={() => handleDial(h.num)}
              className={`p-4 bg-slate-900/80 border ${h.color} hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 rounded-2xl text-left flex flex-col justify-between h-full min-h-[96px] shadow-md cursor-pointer`}
            >
              <div className="flex justify-between items-start w-full gap-2">
                <span className="text-[9px] font-black tracking-widest uppercase text-slate-400 font-mono">{h.label}</span>
                <span className="text-sm shrink-0">📞</span>
              </div>
              <div className="mt-2 w-full">
                <p className="text-sm sm:text-base font-black tracking-tight break-all font-mono leading-tight">{h.num}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Symptom Cards Grid */}
        <div className="space-y-3 pt-2">
          <h4 className="text-[10px] uppercase font-bold text-slate-400 tracking-widest font-mono">
            SELECT SYMPTOM FOR IMMEDIATE PROTOCOL
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.keys(guides).map((key) => {
              const isActive = activeGuide === key
              const color = guides[key].themeColor
              
              let activeBorder = "border-slate-800"
              if (isActive) {
                if (color === 'rose') activeBorder = "border-rose-500 bg-rose-500/10 text-rose-300"
                if (color === 'orange') activeBorder = "border-orange-500 bg-orange-500/10 text-orange-300"
                if (color === 'amber') activeBorder = "border-amber-500 bg-amber-500/10 text-amber-300"
                if (color === 'violet') activeBorder = "border-violet-500 bg-violet-500/10 text-violet-300"
                if (color === 'cyan') activeBorder = "border-cyan-500 bg-cyan-500/10 text-cyan-300"
              } else {
                activeBorder = "bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-400"
              }

              return (
                <div 
                  key={key}
                  onClick={() => setActiveGuide(key)}
                  className={`p-4 sm:p-5 rounded-2xl border flex items-center gap-4 transition-all duration-200 cursor-pointer shadow-md active:scale-[0.98] ${activeBorder}`}
                >
                  <div className={`p-3 rounded-xl border shrink-0 ${
                    isActive 
                      ? 'bg-slate-950 border-slate-700 text-teal-400' 
                      : 'bg-slate-950 border-slate-850 text-slate-500'
                  }`}>
                    {guides[key].icon}
                  </div>

                  <div className="space-y-0.5 min-w-0 flex-1">
                    <h5 className="text-[10px] font-bold uppercase tracking-wider font-mono opacity-80">
                      {guides[key].label}
                    </h5>
                    <h4 className="text-xs sm:text-sm font-extrabold leading-snug break-words">
                      {guides[key].symptom}
                    </h4>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Protocol Instruction Panel */}
        {guides[activeGuide] && (
          <div className="emergency-protocol-panel bg-[#0c1220] border border-slate-800 rounded-3xl p-5 sm:p-7 md:p-8 space-y-6 shadow-2xl relative overflow-hidden transition-all duration-300">
            
            {/* Protocol Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
              <div>
                <span className="text-[9px] uppercase font-extrabold text-teal-400 tracking-wider font-mono">
                  CRITICAL FIRST AID PROTOCOL
                </span>
                <h2 className="text-xl sm:text-2xl font-black mt-0.5 text-slate-100">{guides[activeGuide].title}</h2>
              </div>
              <span className={`px-3.5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border font-mono ${guides[activeGuide].badgeClass} animate-pulse shrink-0 self-start sm:self-auto`}>
                CRITICAL INSTRUCTION
              </span>
            </div>

            {/* DO NOT Red Lines Box */}
            <div className="emergency-do-not-box p-5 bg-rose-500/10 border border-rose-500/30 rounded-2xl">
              <h4 className="text-xs font-black text-rose-400 uppercase tracking-widest flex items-center gap-2 mb-2 font-mono">
                <span>⚠️</span> CRITICAL RED LINES (WHAT NOT TO DO)
              </h4>
              <ul className="list-disc pl-5 text-xs font-bold space-y-1.5 leading-relaxed text-rose-300">
                {guides[activeGuide].doNot.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </div>

            {/* Step-by-Step Procedure Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {guides[activeGuide].steps.map((step, idx) => (
                <div 
                  key={idx} 
                  className="emergency-step-card p-4 rounded-2xl bg-slate-900 border border-slate-800 flex gap-4 items-start shadow-sm"
                >
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-teal-400 shrink-0">
                    {getStepIcon(step.icon)}
                  </div>
                  
                  <div className="space-y-1 min-w-0 flex-1">
                    <span className="text-[10px] font-black uppercase tracking-wider text-teal-400 font-mono block">
                      Step {idx + 1}: {step.action}
                    </span>
                    <p className="text-xs text-slate-300 leading-relaxed font-medium">
                      {step.details}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Medical Disclaimer */}
            <div className="pt-4 border-t border-slate-800 text-[10px] text-slate-500 text-center font-mono">
              Disclaimer: First aid guidelines do not replace professional paramedic care. Call 112 immediately.
            </div>

          </div>
        )}

      </div>
    </div>
  )
}

export default Emergency
