import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@context/AuthContext'
import { useProfiles } from '@context/ProfileContext'
import { ROUTES } from '@constants/routes'
import { authApi } from '../services/auth.api'

export function useLogout() {
  const { setUser } = useAuth()
  const { setReports, setMembers } = useProfiles()
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function signOut() {
    setBusy(true)
    setError('')
    try {
      await authApi.logout()
      setUser(null)
      setReports([])
      setMembers([])
      navigate(ROUTES.LOGIN, { replace: true })
    } catch (problem) {
      setError(problem.message)
      setBusy(false)
    }
  }

  return { error, busy, signOut }
}
