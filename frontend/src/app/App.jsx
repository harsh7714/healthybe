import { useMemo } from 'react'
import { Outlet } from 'react-router-dom'
import AppLayout from '@layouts/AppLayout'
import { AuthProvider } from '@context/AuthContext'
import { ProfileProvider } from '@context/ProfileContext'
import { ThemeProvider } from '@context/ThemeContext'
import { useAuth } from '@context/useAuth'
import { useProfiles } from '@context/useProfiles'
import { useTheme } from '@context/useTheme'
import useAppBootstrap from '@hooks/useAppBootstrap'

function AppContent() {
  useAppBootstrap()
  const theme = useTheme()
  const auth = useAuth()
  const profiles = useProfiles()
  const context = useMemo(() => ({ ...theme, ...auth, ...profiles }), [theme, auth, profiles])

  return (
    <AppLayout {...context}>
      <Outlet />
    </AppLayout>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ProfileProvider>
          <AppContent />
        </ProfileProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
