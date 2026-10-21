import { useState } from 'react'
import { authApi } from '../services/auth.api'

export function usePasswordReset() {
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [stage, setStage] = useState(0)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')

  async function submit(event) {
    event.preventDefault()
    setNotice('')
    setError('')
    try {
      if (!stage) {
        await authApi.requestPasswordReset(email)
        setStage(1)
        setNotice('If an account matches that email, a verification code has been sent.')
      } else {
        const result = await authApi.resetPassword({ email, code, password })
        setStage(2)
        setNotice(result.message)
      }
    } catch (problem) {
      setError(problem.message)
    }
  }

  return {
    email,
    setEmail,
    code,
    setCode,
    password,
    setPassword,
    stage,
    notice,
    error,
    submit,
  }
}
