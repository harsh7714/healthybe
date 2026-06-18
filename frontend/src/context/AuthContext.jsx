import React, { createContext, useContext, useState } from 'react'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [userEmail, setUserEmail] = useState(() => {
    return localStorage.getItem('user_email') || ''
  })
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return !!localStorage.getItem('user_email')
  })
  const [userDisplayName, setUserDisplayName] = useState(() => {
    return localStorage.getItem('user_display_name') || ''
  })

  const loginUser = async (email, name = null, password = null, isRegistering = false, age = null) => {
    const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3001'
    const endpoint = isRegistering ? '/api/auth/register' : '/api/auth/login'
    
    const body = isRegistering 
      ? { email: email.trim().toLowerCase(), name: name?.trim(), password, age }
      : { email: email.trim().toLowerCase(), password }

    const res = await fetch(`${apiBase}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}))
      throw new Error(errData.error || `Request failed with status ${res.status}`)
    }

    const data = await res.json()
    const finalEmail = data.user.email
    const finalName = data.user.name

    setUserEmail(finalEmail)
    setIsLoggedIn(true)
    setUserDisplayName(finalName || '')
    localStorage.setItem('user_email', finalEmail)
    localStorage.setItem('user_display_name', finalName || '')
    return data
  }

  const logoutUser = () => {
    setUserEmail('')
    setIsLoggedIn(false)
    setUserDisplayName('')
    localStorage.removeItem('user_email')
    localStorage.removeItem('user_display_name')
  }

  const sendOtp = async (email) => {
    const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3001'
    const res = await fetch(`${apiBase}/api/auth/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim().toLowerCase() })
    })

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}))
      throw new Error(errData.error || `Request failed with status ${res.status}`)
    }

    return await res.json()
  }

  const verifyOtp = async (email, otp) => {
    const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3001'
    const res = await fetch(`${apiBase}/api/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim().toLowerCase(), otp: otp.trim() })
    })

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}))
      throw new Error(errData.error || `Request failed with status ${res.status}`)
    }

    return await res.json()
  }

  const resetPassword = async (email, otp, newPassword) => {
    const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3001'
    const res = await fetch(`${apiBase}/api/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: email.trim().toLowerCase(),
        otp: otp.trim(),
        password: newPassword
      })
    })

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}))
      throw new Error(errData.error || `Request failed with status ${res.status}`)
    }

    return await res.json()
  }

  const sendDeleteOtp = async (email) => {
    const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3001'
    const res = await fetch(`${apiBase}/api/auth/send-delete-otp`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-user-email': email.trim().toLowerCase()
      },
      body: JSON.stringify({ email: email.trim().toLowerCase() })
    })

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}))
      throw new Error(errData.error || `Request failed with status ${res.status}`)
    }

    return await res.json()
  }

  const confirmDeleteAccount = async (email, otp) => {
    const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3001'
    const res = await fetch(`${apiBase}/api/auth/confirm-delete-account`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-user-email': email.trim().toLowerCase()
      },
      body: JSON.stringify({ 
        email: email.trim().toLowerCase(), 
        otp: otp.trim() 
      })
    })

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}))
      throw new Error(errData.error || `Request failed with status ${res.status}`)
    }

    return await res.json()
  }

  return (
    <AuthContext.Provider value={{
      userEmail,
      isLoggedIn,
      userDisplayName,
      loginUser,
      logoutUser,
      sendOtp,
      verifyOtp,
      resetPassword,
      sendDeleteOtp,
      confirmDeleteAccount
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
