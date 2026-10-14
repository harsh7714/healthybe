import React from 'react'
import { Navigate, useLocation, useOutletContext } from 'react-router-dom'

export default function RequireAccount({ children }) {
  const { user, authReady } = useOutletContext()
  const location = useLocation()
  if (!authReady) return <div className="account-loading" role="status">Checking your HealthyBe session…</div>
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }}/>
  return children
}
