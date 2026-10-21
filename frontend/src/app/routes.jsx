import { createElement, lazy, Suspense } from 'react'
import { createBrowserRouter, createRoutesFromElements, Route } from 'react-router-dom'
import App from './App.jsx'
import ProtectedRoute from './ProtectedRoute.jsx'
import { ROUTES } from '@constants/routes'

const HomePage = lazy(() => import('@features/home/pages/HomePage.jsx'))
const UploadPage = lazy(() => import('@features/reports/pages/UploadPage.jsx'))
const ChatPage = lazy(() => import('@features/chat/pages/ChatPage.jsx'))
const ReportsPage = lazy(() => import('@features/reports/pages/ReportsPage.jsx'))
const ProfilePage = lazy(() => import('@features/profiles/pages/ProfilePage.jsx'))
const LoginPage = lazy(() => import('@features/auth/pages/LoginPage.jsx'))
const ForgotPasswordPage = lazy(() => import('@features/auth/pages/ForgotPasswordPage.jsx'))
const LogoutPage = lazy(() => import('@features/auth/pages/LogoutPage.jsx'))
const DeleteAccountPage = lazy(() => import('@features/settings/pages/DeleteAccountPage.jsx'))
const RegisterPage = lazy(() => import('@features/auth/pages/RegisterPage.jsx'))

const routeElement = Page => createElement(Suspense, { fallback: null }, createElement(Page))
const protectedElement = Page => <ProtectedRoute>{routeElement(Page)}</ProtectedRoute>
const segment = path => path.slice(1)

export const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path={ROUTES.HOME} element={<App />}>
      <Route index element={routeElement(HomePage)} />
      <Route path={segment(ROUTES.DASHBOARD)} element={protectedElement(UploadPage)} />
      <Route path={segment(ROUTES.CHAT)} element={protectedElement(ChatPage)} />
      <Route path={segment(ROUTES.REPORTS)} element={protectedElement(ReportsPage)} />
      <Route path={segment(ROUTES.PROFILE)} element={protectedElement(ProfilePage)} />
      <Route path={segment(ROUTES.SETTINGS)} element={protectedElement(ProfilePage)} />
      <Route path={segment(ROUTES.LOGIN)} element={routeElement(LoginPage)} />
      <Route path={segment(ROUTES.REGISTER)} element={routeElement(RegisterPage)} />
      <Route path={segment(ROUTES.FORGOT_PASSWORD)} element={routeElement(ForgotPasswordPage)} />
      <Route path={segment(ROUTES.LOGOUT)} element={protectedElement(LogoutPage)} />
      <Route path={segment(ROUTES.DELETE_ACCOUNT)} element={protectedElement(DeleteAccountPage)} />
      <Route path={ROUTES.NOT_FOUND} element={routeElement(HomePage)} />
    </Route>,
  ),
)
