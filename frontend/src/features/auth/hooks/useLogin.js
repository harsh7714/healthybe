import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@context/AuthContext'
import { useProfiles } from '@context/ProfileContext'
import { ROUTES } from '@constants/routes'
import { authApi } from '../services/auth.api'

export function useLogin() {
  const { setUser } = useAuth()
  const { refreshData } = useProfiles()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      const { user } = await authApi.login({ email, password })
      setUser(user)
      await refreshData()
      navigate(location.state?.from || ROUTES.DASHBOARD, { replace: true })
    } catch (problem) {
      setError(problem.message)
    } finally {
      setBusy(false)
    }
  }

  return { email, setEmail, password, setPassword, error, busy, submit }
}
