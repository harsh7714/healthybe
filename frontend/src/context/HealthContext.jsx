import React from 'react'
import { AuthProvider, useAuth } from './AuthContext'
import { ProfileProvider, useProfiles } from './ProfileContext'
import { ReportProvider, useReports } from './ReportContext'
import { PreferencesProvider, usePreferences } from './PreferencesContext'

export function HealthProvider({ children }) {
  return (
    <PreferencesProvider>
      <AuthProvider>
        <ProfileProvider>
          <ReportProvider>
            {children}
          </ReportProvider>
        </ProfileProvider>
      </AuthProvider>
    </PreferencesProvider>
  )
}

export function useHealth() {
  const auth = useAuth()
  const profiles = useProfiles()
  const reports = useReports()
  const preferences = usePreferences()

  return {
    ...auth,
    ...profiles,
    ...reports,
    ...preferences
  }
}
