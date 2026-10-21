import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@context/AuthContext'
import { useProfiles } from '@context/ProfileContext'
import { ROUTES } from '@constants/routes'
import { authApi } from '@features/auth/services/auth.api'

export function useDeleteAccount() {
  const { setUser } = useAuth()
  const { setReports, setMembers } = useProfiles()
  const navigate = useNavigate()
  const [confirmation, setConfirmation] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      await authApi.deleteAccount({ confirmation, password })
      setUser(null)
      setReports([])
      setMembers([])
      navigate(ROUTES.REGISTER, { replace: true })
    } catch (problem) {
      setError(problem.message)
      setBusy(false)
    }
  }

  return { confirmation, setConfirmation, password, setPassword, error, busy, submit }
}
