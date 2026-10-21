import { useMemo } from 'react'
import { Outlet } from 'react-router-dom'
import AppLayout from '@layouts/AppLayout'
import { AuthProvider, useAuth } from '@context/AuthContext'
import { ProfileProvider, useProfiles } from '@context/ProfileContext'
import { ThemeProvider, useTheme } from '@context/ThemeContext'
import useAppBootstrap from '@hooks/useAppBootstrap'

function AppContent() {
  useAppBootstrap()
  const theme = useTheme()
  const auth = useAuth()
  const profiles = useProfiles()
  const context = useMemo(() => ({ ...theme, ...auth, ...profiles }), [theme, auth, profiles])

  return <AppLayout {...context}><Outlet/></AppLayout>
}

export default function App() {
  return <ThemeProvider>
    <AuthProvider>
      <ProfileProvider>
        <AppContent/>
      </ProfileProvider>
    </AuthProvider>
  </ThemeProvider>
}
