import React, { useEffect, useState } from 'react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { Outlet, useLocation } from 'react-router-dom'
import { HealthProvider, useHealth } from '../context/HealthContext'

function AuthGuardInline() {
  const { loginUser, sendOtp, verifyOtp, resetPassword } = useHealth()
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

  // Clear inputs and errors on view change
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

    // ────────────────────────────────────────────────────────
    // Login Flow
    // ────────────────────────────────────────────────────────
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
        setError(err.message || 'Login failed. Please try again.')
        setLoading(false)
      }
    }

    // ────────────────────────────────────────────────────────
    // Registration Flow
    // ────────────────────────────────────────────────────────
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

    // ────────────────────────────────────────────────────────
    // Send OTP Flow
    // ────────────────────────────────────────────────────────
    else if (authMode === 'forgot') {
      if (!trimEmail || !trimEmail.includes('@')) {
        return setError('Please enter a valid email address.')
      }

      setLoading(true)
      try {
        await sendOtp(trimEmail)
        setSuccess('OTP verification code has been sent successfully to your email.')
        setAuthMode('verify_otp')
      } catch (err) {
        setError(err.message || 'Failed to send OTP. Please verify your email.')
      } finally {
        setLoading(false)
      }
    }

    // ────────────────────────────────────────────────────────
    // Verify OTP Flow
    // ────────────────────────────────────────────────────────
    else if (authMode === 'verify_otp') {
      if (!otpCode.trim() || otpCode.trim().length !== 6) {
        return setError('Please enter the 6-digit OTP code.')
      }

      setLoading(true)
      try {
        await verifyOtp(trimEmail, otpCode.trim())
        setSuccess('OTP verified successfully. Please set your new password.')
        setAuthMode('reset_pwd')
      } catch (err) {
        setError(err.message || 'Invalid or expired OTP.')
      } finally {
        setLoading(false)
      }
    }

    // ────────────────────────────────────────────────────────
    // Reset Password Flow
    // ────────────────────────────────────────────────────────
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
        setSuccess('Password reset successful. Please sign in with your new credentials.')
        handleModeSwitch('login')
        // Pre-fill email for convenience
        setEmail(trimEmail)
      } catch (err) {
        setError(err.message || 'Failed to reset password. Please request a new OTP.')
      } finally {
        setLoading(false)
      }
    }
  }

  return (
    <div className="flex-1 flex items-center justify-center pt-32 pb-20 px-6 min-h-[500px]">
      <div className="w-full max-w-sm relative">
        {/* Logo & Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-teal-500 to-cyan-500 shadow-lg shadow-teal-500/25 mb-4">
            <svg className="w-7 h-7 text-slate-950" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">
            {authMode === 'login' && 'Welcome back'}
            {authMode === 'register' && 'Create your account'}
            {authMode === 'forgot' && 'Reset Password'}
            {authMode === 'verify_otp' && 'Verify OTP'}
            {authMode === 'reset_pwd' && 'Set New Password'}
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            {authMode === 'login' && 'Sign in to access your health vault'}
            {authMode === 'register' && 'Join HealthyBe to manage family health'}
            {authMode === 'forgot' && 'Enter your email to receive a verification OTP code'}
            {authMode === 'verify_otp' && 'Enter the 6-digit code sent to your email'}
            {authMode === 'reset_pwd' && 'Enter your new secure password'}
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-slate-950/80 border border-slate-800/80 rounded-3xl p-8 shadow-2xl backdrop-blur-sm">
          {/* Tab switcher - only show for login/register modes */}
          {(authMode === 'login' || authMode === 'register') && (
            <div className="flex rounded-xl bg-slate-900 p-1 mb-6">
              <button
                type="button"
                onClick={() => handleModeSwitch('login')}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${authMode === 'login' ? 'bg-teal-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => handleModeSwitch('register')}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${authMode === 'register' ? 'bg-teal-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
              >
                Create Account
              </button>
            </div>
          )}

          {/* Banner removed for production security */}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name field — only for registration */}
            {authMode === 'register' && (
              <div className="space-y-1.5 animate-fade-in">
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Full Name</label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    placeholder="Your Full Name"
                    autoComplete="name"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/20 transition-all"
                  />
                </div>
              </div>
            )}

            {/* Age field — only for registration */}
            {authMode === 'register' && (
              <div className="space-y-1.5 animate-fade-in">
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Age</label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 flex items-center justify-center">
                    <span className="text-xs">🎂</span>
                  </div>
                  <input
                    type="number"
                    value={age}
                    onChange={e => setAge(e.target.value)}
                    placeholder="Your Age (e.g. 24)"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/20 transition-all"
                  />
                </div>
              </div>
            )}

            {/* Email field — show for login, register, forgot */}
            {(authMode === 'login' || authMode === 'register' || authMode === 'forgot') && (
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Email Address</label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <input
                    id="auth-email"
                    type="email"
                    value={email}
                    disabled={authMode === 'verify_otp' || authMode === 'reset_pwd'}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    autoComplete="email"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/20 transition-all disabled:opacity-50"
                  />
                </div>
              </div>
            )}

            {/* Password field — show for login, register */}
            {(authMode === 'login' || authMode === 'register') && (
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Password</label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <input
                    id="auth-password"
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete={authMode === 'login' ? "current-password" : "new-password"}
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/20 transition-all"
                  />
                </div>
                {authMode === 'login' && (
                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      onClick={() => handleModeSwitch('forgot')}
                      className="text-xs font-semibold text-teal-400 hover:text-teal-300 transition-colors"
                    >
                      Forgot Password?
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* OTP Code field — show for verify_otp */}
            {authMode === 'verify_otp' && (
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Verification OTP Code</label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 flex items-center justify-center">
                    <span className="text-xs">🔑</span>
                  </div>
                  <input
                    type="text"
                    maxLength={6}
                    value={otpCode}
                    onChange={e => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="••••••"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/20 transition-all font-mono tracking-widest text-center"
                  />
                </div>
              </div>
            )}

            {/* Reset Password fields — show for reset_pwd */}
            {authMode === 'reset_pwd' && (
              <>
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">New Password</label>
                  <div className="relative">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/20 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Confirm New Password</label>
                  <div className="relative">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/20 transition-all"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Error message */}
            {error && (
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20">
                <svg className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <p className="text-xs text-rose-400 font-medium leading-relaxed">{error}</p>
              </div>
            )}

            {/* Success message */}
            {success && (
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <span className="text-xs">✅</span>
                <p className="text-xs text-emerald-400 font-medium leading-relaxed">{success}</p>
              </div>
            )}

            {/* Submit */}
            <button
              id="auth-submit-btn"
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-slate-950 font-black text-sm tracking-wide transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-teal-500/25 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  {authMode === 'login' && 'Signing in...'}
                  {authMode === 'register' && 'Creating account...'}
                  {authMode === 'forgot' && 'Sending OTP...'}
                  {authMode === 'verify_otp' && 'Verifying code...'}
                  {authMode === 'reset_pwd' && 'Saving password...'}
                </span>
              ) : (
                <>
                  {authMode === 'login' && 'Sign In →'}
                  {authMode === 'register' && 'Create Account →'}
                  {authMode === 'forgot' && 'Send OTP Code →'}
                  {authMode === 'verify_otp' && 'Verify OTP →'}
                  {authMode === 'reset_pwd' && 'Reset Password →'}
                </>
              )}
            </button>
          </form>

          {/* Bottom links for recovery screens */}
          {authMode !== 'login' && authMode !== 'register' && (
            <div className="mt-5 text-center space-y-3">
              {authMode === 'verify_otp' && (
                <div>
                  <button
                    type="button"
                    onClick={async () => {
                      setError('')
                      setSuccess('')
                      setLoading(true)
                      try {
                        await sendOtp(email.trim().toLowerCase())
                        setSuccess('A new OTP has been sent successfully to your email.')
                      } catch (err) {
                        setError(err.message || 'Failed to resend OTP.')
                      } finally {
                        setLoading(false)
                      }
                    }}
                    className="text-xs text-slate-400 hover:text-slate-200 font-semibold underline underline-offset-4 font-mono"
                  >
                    Resend Code
                  </button>
                </div>
              )}
              <div>
                <button
                  type="button"
                  onClick={() => handleModeSwitch('login')}
                  className="text-xs text-teal-400 hover:text-teal-300 font-bold transition-colors"
                >
                  ← Back to Sign In
                </button>
              </div>
            </div>
          )}

          {/* Disclaimer */}
          <p className="text-center text-[11px] text-slate-600 leading-relaxed mt-5">
            Passwords are encrypted securely in our database.
          </p>
        </div>

        {/* Feature pills */}
        <div className="flex flex-wrap items-center justify-center gap-2 mt-5">
          {['Health Vault', 'AI Analysis', 'Family Profiles', 'Emergency Board'].map(f => (
            <span key={f} className="px-3 py-1 rounded-full bg-slate-900/80 border border-slate-800/60 text-[10px] text-slate-500 font-medium">
              {f}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

function RootLayout() {
  const location = useLocation()
  const isChatRoute = location.pathname === '/chat'
  const { isLoggedIn } = useHealth()

  // Define protected paths
  const isProtectedRoute = ['/chat', '/dashboard', '/reports', '/settings'].includes(location.pathname)

  useEffect(() => {
    if (isChatRoute && isLoggedIn) {
      document.body.classList.add('overflow-hidden')
      document.documentElement.classList.add('overflow-hidden')
    } else {
      document.body.classList.remove('overflow-hidden')
      document.documentElement.classList.remove('overflow-hidden')
    }
    return () => {
      document.body.classList.remove('overflow-hidden')
      document.documentElement.classList.remove('overflow-hidden')
    }
  }, [isChatRoute, isLoggedIn])

  return (
    <div className={isChatRoute && isLoggedIn ? 'h-screen overflow-hidden flex flex-col bg-[#0B0F19] no-scrollbar' : 'bg-[#0B0F19] text-slate-100 min-h-screen flex flex-col'}>
      <Navbar />
      <div className={isChatRoute && isLoggedIn ? 'flex-1 overflow-hidden flex flex-col no-scrollbar' : 'flex-1 flex flex-col'}>
        {isProtectedRoute && !isLoggedIn ? (
          <AuthGuardInline />
        ) : (
          <Outlet />
        )}
      </div>
      {(!isChatRoute || !isLoggedIn) && <Footer />}
    </div>
  )
}

function RootLayoutWrapper() {
  return (
    <HealthProvider>
      <RootLayout />
    </HealthProvider>
  )
}

export default RootLayoutWrapper