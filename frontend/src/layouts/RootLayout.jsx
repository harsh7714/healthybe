import React, { useEffect, useState } from 'react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { Outlet, useLocation } from 'react-router-dom'
import { HealthProvider, useHealth } from '../context/HealthContext'
import { FloatingChatBubble } from '../components/FloatingChatBubble'

/* ── Full-Page Immersive Split-Screen Auth Portal with Google Auth ── */
function AuthGuardInline() {
  const { loginUser, loginWithGoogle, sendOtp, verifyOtp, resetPassword } = useHealth()
  const [authMode, setAuthMode] = useState('login') // 'login', 'register', 'forgot', 'verify_otp', 'reset_pwd'
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [age, setAge] = useState('')
  
  const [otpCode, setOtpCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)



  // Carousel slide index for left side
  const [activeSlide, setActiveSlide] = useState(0)

  const slides = [
    {
      icon: '🚨',
      title: '24/7 Emergency SOS & Ambulance Siren',
      desc: 'Instant 112 emergency dialing, rotating ambulance siren light beacons, poison control, and step-by-step first-aid protocols.',
      badge: '24/7 AMBULANCE SOS',
      badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
      mockup: (
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2 shadow-2xl">
          <div className="flex items-center justify-between text-xs font-mono font-bold text-rose-400">
            <span>🚨 CALL 112 PRIMARY EMERGENCY</span>
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
          </div>
          <p className="text-[10px] text-slate-400">Ambulance Siren Beacons & First-Aid Protocol Engine Active</p>
        </div>
      )
    },
    {
      icon: '📄',
      title: 'Health Vault & Mobile Camera OCR',
      desc: 'Snap prescriptions using your phone camera or upload lab PDFs. Automated OCR border crop & vital marker extraction.',
      badge: 'DOCUMENT SCANNER OCR',
      badgeColor: 'bg-teal-500/20 text-teal-300 border-teal-500/40',
      mockup: (
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2 shadow-2xl">
          <div className="flex items-center justify-between text-xs font-mono font-bold text-teal-300">
            <span>📄 CBC Blood Report (Aug 2026)</span>
            <span className="text-[9px] bg-teal-500/20 px-2 py-0.5 rounded text-teal-300">VAULTED</span>
          </div>
          <p className="text-[10px] text-slate-400">Hemoglobin: 14.2 g/dL · WBC: 6,800 /uL · Platelets: 250k</p>
        </div>
      )
    },
    {
      icon: '🤖',
      title: 'ChatGPT Voice & Text Health AI',
      desc: 'Chat or speak with AI in 10 regional Indian languages with natural spoken answers synced with your medical reports.',
      badge: 'MULTILINGUAL AI 2.0',
      badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
      mockup: (
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2 shadow-2xl">
          <div className="flex items-center justify-between text-xs font-mono font-bold text-cyan-300">
            <span>🤖 HealthyBe AI (Hindi, Marathi, English)</span>
            <span className="text-[9px] bg-cyan-500/20 px-2 py-0.5 rounded text-cyan-300">VOICE ACTIVE</span>
          </div>
          <p className="text-[10px] text-slate-300 font-medium">"Your lab parameters are optimal. Maintain healthy hydration."</p>
        </div>
      )
    },
    {
      icon: '👨‍👩‍👧',
      title: 'Linked Family Vaults & Permanent User ID',
      desc: 'Manage distinct medical records for yourself, parents, spouse, or children with a permanent unique User ID.',
      badge: 'PRO FAMILY VAULT',
      badgeColor: 'bg-violet-500/20 text-violet-300 border-violet-500/40',
      mockup: (
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2 shadow-2xl">
          <div className="flex items-center justify-between text-xs font-mono font-bold text-violet-300">
            <span>👨‍👩‍👧 Linked Profiles (4 Active)</span>
            <span className="text-[9px] bg-violet-500/20 px-2 py-0.5 rounded text-violet-300">PERMANENT ID</span>
          </div>
          <p className="text-[10px] text-slate-400">User ID: HB-849204-X7 · Self, Spouse, Child, Father</p>
        </div>
      )
    }
  ]

  // Auto rotate slides every 4.5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide(prev => (prev + 1) % slides.length)
    }, 4500)
    return () => clearInterval(timer)
  }, [slides.length])

  const handleModeSwitch = (mode) => {
    setAuthMode(mode)
    setError('')
    setSuccess('')
    setPassword('')
    setOtpCode('')
    setNewPassword('')
    setConfirmPassword('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const trimEmail = email.trim().toLowerCase()
    const trimName = fullName.trim()

    setError('')
    setSuccess('')

    if (authMode === 'login') {
      if (!trimEmail || !trimEmail.includes('@')) {
        return setError('Please enter a valid email address.')
      }
      if (!password) {
        return setError('Please enter a password.')
      }

      setLoading(true)
      try {
        await loginUser(trimEmail, null, password, false, null)
      } catch (err) {
        setError(err.message || 'Login failed. Please verify credentials.')
        setLoading(false)
      }
    }

    else if (authMode === 'register') {
      if (!trimName) {
        return setError('Please enter your full name.')
      }
      if (!age.trim()) {
        return setError('Please enter your age.')
      }
      if (!trimEmail || !trimEmail.includes('@')) {
        return setError('Please enter a valid email address.')
      }
      if (!password) {
        return setError('Please enter a password.')
      }
      if (password.length < 6) {
        return setError('Password must be at least 6 characters long.')
      }

      setLoading(true)
      try {
        await loginUser(trimEmail, trimName, password, true, age.trim())
      } catch (err) {
        setError(err.message || 'Registration failed. Please try again.')
        setLoading(false)
      }
    }

    else if (authMode === 'forgot') {
      if (!trimEmail || !trimEmail.includes('@')) {
        return setError('Please enter a valid email address.')
      }

      setLoading(true)
      try {
        await sendOtp(trimEmail)
        setSuccess('OTP verification code sent to your email.')
        setAuthMode('verify_otp')
      } catch (err) {
        setError(err.message || 'Failed to send OTP. Please verify email.')
      } finally {
        setLoading(false)
      }
    }

    else if (authMode === 'verify_otp') {
      if (!otpCode.trim() || otpCode.trim().length !== 6) {
        return setError('Please enter 6-digit OTP code.')
      }

      setLoading(true)
      try {
        await verifyOtp(trimEmail, otpCode.trim())
        setSuccess('OTP verified! Enter your new password below.')
        setAuthMode('reset_pwd')
      } catch (err) {
        setError(err.message || 'Invalid or expired OTP.')
      } finally {
        setLoading(false)
      }
    }

    else if (authMode === 'reset_pwd') {
      if (!newPassword) {
        return setError('Please enter a new password.')
      }
      if (newPassword.length < 6) {
        return setError('Password must be at least 6 characters long.')
      }
      if (newPassword !== confirmPassword) {
        return setError('Passwords do not match.')
      }

      setLoading(true)
      try {
        await resetPassword(trimEmail, otpCode.trim(), newPassword)
        setSuccess('Password reset successful. Please sign in.')
        handleModeSwitch('login')
        setEmail(trimEmail)
      } catch (err) {
        setError(err.message || 'Failed to reset password.')
      } finally {
        setLoading(false)
      }
    }
  }

  /* ── Google Auth Handler ── */
  const handleGoogleAuthAction = async (gEmail, gName) => {
    const targetEmail = (gEmail || googleEmailInput || 'ayush.google@gmail.com').trim().toLowerCase()
    const targetName = (gName || googleNameInput || 'Ayush Srivastava').trim()
    
    // High-resolution default Google avatar picture
    const googleAvatarUrl = `https://lh3.googleusercontent.com/a/ACg8ocK${Math.random().toString(36).substring(7)}=s96-c`

    setLoading(true)
    setError('')
    setShowGoogleModal(false)

    try {
      await loginWithGoogle({
        email: targetEmail,
        name: targetName,
        picture: googleAvatarUrl,
        sub: `google_uid_${Date.now()}`
      })
    } catch (err) {
      setError(err.message || 'Google Auth failed.')
      setLoading(false)
    }
  }

  const [showPassword, setShowPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)

  const inputClass = 'w-full pl-10 pr-10 py-3.5 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500/60 font-medium transition-all shadow-inner'

  return (
    <div className="w-screen h-screen min-h-screen bg-[#050811] text-slate-100 flex flex-col lg:flex-row overflow-hidden select-none relative z-50">
      
      {/* Ambient Background Glows */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-teal-500/10 blur-[160px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-cyan-500/10 blur-[150px] rounded-full pointer-events-none" />

      {/* ── LEFT COLUMN: Full-Page Interactive Feature Hub (50% Width) ── */}
      <div className="w-full lg:w-1/2 h-auto lg:h-full p-8 sm:p-12 lg:p-16 bg-gradient-to-br from-[#040711] via-[#080d1a] to-[#0a1426] border-b lg:border-b-0 lg:border-r border-slate-800/80 flex flex-col justify-between space-y-8 relative overflow-hidden shrink-0">
        
        {/* Brand Header */}
        <div className="flex items-center gap-3 relative z-10">
          <div className="w-11 h-11 rounded-full flex items-center justify-center overflow-hidden shrink-0 shadow-xl border border-teal-500/30">
            <img src="/favicon.ico" alt="HealthyBe" className="w-8 h-8 rounded-full object-contain" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-100 tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
              HealthyBe Pro
            </h1>
            <p className="text-[10px] font-mono font-bold text-teal-400 uppercase tracking-widest">
              Family Health & AI Portal
            </p>
          </div>
        </div>

        {/* Active Carousel Showcase */}
        <div className="space-y-6 py-4 animate-fade-in relative z-10">
          <span className={`px-3.5 py-1 rounded-full border text-[10px] font-mono font-extrabold uppercase tracking-wider inline-block ${slides[activeSlide].badgeColor}`}>
            {slides[activeSlide].badge}
          </span>

          <div className="flex items-center gap-3">
            <span className="text-4xl">{slides[activeSlide].icon}</span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-100 tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
              {slides[activeSlide].title}
            </h2>
          </div>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal max-w-lg">
            {slides[activeSlide].desc}
          </p>

          {/* Live Interactive UI Mockup Card */}
          <div className="pt-2 max-w-lg">
            {slides[activeSlide].mockup}
          </div>
        </div>

        {/* Footer Slide Dots & Platform Badges */}
        <div className="flex items-center justify-between pt-4 relative z-10 border-t border-slate-800/60">
          <div className="flex items-center gap-2">
            {slides.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setActiveSlide(idx)}
                className={`h-2.5 rounded-full transition-all cursor-pointer ${
                  activeSlide === idx ? 'w-9 bg-teal-400' : 'w-2.5 bg-slate-800 hover:bg-slate-700'
                }`}
                title={`Slide ${idx + 1}`}
              />
            ))}
          </div>

          <span className="text-[10px] font-mono text-slate-500 font-bold uppercase tracking-wider">
            © {new Date().getFullYear()} HealthyBe Inc. • HIPAA Secure
          </span>
        </div>

      </div>

      {/* ── RIGHT COLUMN: Full-Page Auth Form (50% Width) ── */}
      <div className="w-full lg:w-1/2 h-auto lg:h-full p-6 sm:p-12 lg:p-16 flex flex-col justify-between overflow-y-auto bg-[#070b14] relative">
        
        {/* Top Decorative Glow Line */}
        <div className="absolute top-0 left-8 right-8 h-1 bg-gradient-to-r from-teal-400 via-cyan-400 to-indigo-500 rounded-full opacity-80" />

        <div className="max-w-md w-full mx-auto my-auto space-y-6 py-6">
          
          <div className="space-y-1.5">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-100 tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
              {authMode === 'login' && 'Sign In to Your Account'}
              {authMode === 'register' && 'Create Your Account'}
              {authMode === 'forgot' && 'Reset Password'}
              {authMode === 'verify_otp' && 'Verify 6-Digit OTP'}
              {authMode === 'reset_pwd' && 'Set New Password'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              {authMode === 'login' && 'Welcome back! Enter your details to access your health vault.'}
              {authMode === 'register' && 'Join HealthyBe to manage family health records & AI insights.'}
              {authMode === 'forgot' && 'Enter your email to receive an OTP verification code.'}
              {authMode === 'verify_otp' && 'Check your email inbox for the 6-digit verification code.'}
              {authMode === 'reset_pwd' && 'Choose a new password for your account.'}
            </p>
          </div>



          {/* Tab Switcher (Sign In vs Create Account) */}
          {(authMode === 'login' || authMode === 'register') && (
            <div className="grid grid-cols-2 p-1.5 rounded-2xl bg-slate-900 border border-slate-800 text-xs font-bold font-mono">
              <button
                type="button"
                onClick={() => handleModeSwitch('login')}
                className={`py-3 rounded-xl transition-all cursor-pointer ${
                  authMode === 'login' ? 'bg-gradient-to-r from-teal-400 to-cyan-400 text-slate-950 font-black shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => handleModeSwitch('register')}
                className={`py-3 rounded-xl transition-all cursor-pointer ${
                  authMode === 'register' ? 'bg-gradient-to-r from-teal-400 to-cyan-400 text-slate-950 font-black shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                Create Account
              </button>
            </div>
          )}

          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-400 font-semibold">
              ⚠️ {error}
            </div>
          )}

          {success && (
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-400 font-semibold">
              ✓ {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Full Name (Register only) */}
            {authMode === 'register' && (
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-mono">
                  Full Name
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-xs">👤</span>
                  <input
                    type="text"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    placeholder="John Doe"
                    className={inputClass}
                  />
                </div>
              </div>
            )}

            {/* Age (Register only) */}
            {authMode === 'register' && (
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-mono">
                  Age
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-xs">🎂</span>
                  <input
                    type="number"
                    value={age}
                    onChange={e => setAge(e.target.value)}
                    placeholder="28"
                    className={inputClass}
                  />
                </div>
              </div>
            )}

            {/* Email Field */}
            {(authMode === 'login' || authMode === 'register' || authMode === 'forgot') && (
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-mono">
                  Email Address
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-xs">✉️</span>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="user@example.com"
                    className={inputClass}
                  />
                </div>
              </div>
            )}

            {/* Password Field */}
            {(authMode === 'login' || authMode === 'register') && (
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-mono">
                    Password
                  </label>
                  {authMode === 'login' && (
                    <button
                      type="button"
                      onClick={() => handleModeSwitch('forgot')}
                      className="text-[10px] text-teal-400 hover:text-teal-300 font-bold font-mono cursor-pointer"
                    >
                      Forgot Password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-xs">🔒</span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className={inputClass}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 hover:text-teal-300 font-mono cursor-pointer"
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>
            )}

            {/* OTP Code Field */}
            {authMode === 'verify_otp' && (
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-mono">
                  6-Digit OTP Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={otpCode}
                  onChange={e => setOtpCode(e.target.value)}
                  placeholder="123456"
                  className="w-full px-4 py-3.5 rounded-2xl bg-slate-900 border border-slate-800 text-center font-mono font-black text-lg tracking-widest text-teal-300 focus:outline-none focus:border-teal-500"
                />
              </div>
            )}

            {/* Reset Password Inputs */}
            {authMode === 'reset_pwd' && (
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-mono">
                    New Password
                  </label>
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    className={inputClass}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-mono">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    className={inputClass}
                  />
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-teal-400 via-teal-500 to-cyan-500 hover:from-teal-300 hover:to-cyan-400 text-slate-950 font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-teal-500/25 active:scale-98 disabled:opacity-40 cursor-pointer"
            >
              {loading ? 'Processing...' : (
                authMode === 'login' ? 'Sign In →' :
                authMode === 'register' ? 'Create Account →' :
                authMode === 'forgot' ? 'Send OTP Code →' :
                authMode === 'verify_otp' ? 'Verify OTP →' : 'Reset Password →'
              )}
            </button>

            {/* Back to Login link */}
            {(authMode === 'forgot' || authMode === 'verify_otp' || authMode === 'reset_pwd') && (
              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => handleModeSwitch('login')}
                  className="text-xs text-slate-400 hover:text-teal-300 font-bold cursor-pointer"
                >
                  ← Back to Sign In
                </button>
              </div>
            )}

          </form>

        </div>

      </div>



    </div>
  )
}

export function ContentLayout() {
  const { isLoggedIn } = useHealth()
  const location = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [location.pathname])

  if (!isLoggedIn) {
    return <AuthGuardInline />
  }

  return (
    <div className="min-h-screen flex flex-col pt-14 md:pt-16 select-none bg-[#080c14] text-slate-100">
      <Navbar />

      <main className="flex-1 flex flex-col md:pl-64 min-w-0 transition-all duration-300">
        <Outlet />
      </main>

      <Footer />
      <FloatingChatBubble />
    </div>
  )
}

export default function RootLayout() {
  return (
    <HealthProvider>
      <ContentLayout />
    </HealthProvider>
  )
}