import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@context/useAuth'
import { ROUTES } from '@constants/routes'

export default function ProtectedRoute({ children }) {
  const { user, authReady } = useAuth()
  const location = useLocation()
  if (!authReady)
    return (
      <div className="account-loading" role="status">
        Checking your HealthyBe session…
      </div>
    )
  if (!user) return <Navigate to={ROUTES.LOGIN} replace state={{ from: location.pathname }} />
  return children
}
