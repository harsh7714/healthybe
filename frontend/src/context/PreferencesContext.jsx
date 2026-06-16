import React, { createContext, useContext, useState } from 'react'

const PreferencesContext = createContext()

export function PreferencesProvider({ children }) {
  const [preferences, setPreferences] = useState(() => {
    const saved = localStorage.getItem('user_preferences')
    return saved ? JSON.parse(saved) : { language: 'English' }
  })

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
