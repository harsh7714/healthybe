import { useMemo, useState } from 'react'
import { AuthContext } from './auth.context'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [authReady, setAuthReady] = useState(false)
  const value = useMemo(() => ({ user, setUser, authReady, setAuthReady }), [user, authReady])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
