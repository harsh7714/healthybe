import { createBrowserRouter, createRoutesFromElements, Route } from 'react-router-dom'
import App from './App.jsx'
import HomePage from '@/features/home/pages/HomePage.jsx'
import UploadPage from '@/features/reports/pages/UploadPage.jsx'
import ChatPage from '@/features/chat/pages/ChatPage.jsx'
import ReportsPage from '@/features/reports/pages/ReportsPage.jsx'
import ProfilePage from '@/features/profiles/pages/ProfilePage.jsx'
import LoginPage from '@/features/auth/pages/LoginPage.jsx'
import ForgotPasswordPage from '@/features/auth/pages/ForgotPasswordPage.jsx'
import LogoutPage from '@/features/auth/pages/LogoutPage.jsx'
import DeleteAccountPage from '@/features/account/pages/DeleteAccountPage.jsx'
import RegisterPage from '@/features/auth/pages/RegisterPage.jsx'
import RequireAccount from './RequireAccount.jsx'

export const router = createBrowserRouter(createRoutesFromElements(
  <Route element={<App />}>
    <Route index element={<HomePage />} />
    <Route path="dashboard" element={<RequireAccount><UploadPage /></RequireAccount>} />
    <Route path="chat" element={<RequireAccount><ChatPage /></RequireAccount>} />
    <Route path="reports" element={<RequireAccount><ReportsPage /></RequireAccount>} />
    <Route path="profile" element={<RequireAccount><ProfilePage /></RequireAccount>} />
    <Route path="settings" element={<RequireAccount><ProfilePage /></RequireAccount>} />
    <Route path="login" element={<LoginPage />} />
    <Route path="register" element={<RegisterPage />} />
    <Route path="forgot-password" element={<ForgotPasswordPage />} />
    <Route path="logout" element={<RequireAccount><LogoutPage /></RequireAccount>} />
    <Route path="delete-account" element={<RequireAccount><DeleteAccountPage /></RequireAccount>} />
    <Route path="*" element={<HomePage />} />
  </Route>
))
