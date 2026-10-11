import React, { createContext, useContext, useEffect, useState } from 'react'

const PreferencesContext = createContext()

export function PreferencesProvider({ children }) {
  const [preferences, setPreferences] = useState(() => {
    const saved = localStorage.getItem('user_preferences')
    const parsed = saved ? JSON.parse(saved) : {}
    return {
      language: 'English',
      ...parsed,
      theme: localStorage.getItem('theme') || parsed.theme || 'dark'
    }
  })

  useEffect(() => {
    const isLight = preferences.theme === 'light'
    document.documentElement.dataset.theme = isLight ? 'light' : 'dark'
    document.documentElement.style.colorScheme = isLight ? 'light' : 'dark'
    document.body.classList.toggle('light', isLight)
    localStorage.setItem('theme', isLight ? 'light' : 'dark')
  }, [preferences.theme])

  const updatePreference = (key, value) => {
    setPreferences(prev => {
      const updated = { ...prev, [key]: value }
      localStorage.setItem('user_preferences', JSON.stringify(updated))
      return updated
    })
  }

  return (
    <PreferencesContext.Provider value={{ preferences, updatePreference }}>
      {children}
    </PreferencesContext.Provider>
  )
}

export function usePreferences() {
  return useContext(PreferencesContext)
}
