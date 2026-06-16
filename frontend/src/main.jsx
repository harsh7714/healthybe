import { createRoot } from 'react-dom/client'
import './index.css'
import RootLayout from './layouts/RootLayout.jsx'
import { Route } from 'react-router-dom'
import { createBrowserRouter, RouterProvider, createRoutesFromElements } from 'react-router-dom'
import Home from './pages/Home.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Chat from './pages/Chat.jsx'
import Reports from './pages/Reports.jsx'
import Settings from './pages/Settings.jsx'
import Emergency from './pages/Emergency.jsx'

const router = createBrowserRouter(createRoutesFromElements(
  <Route path="/" element={<RootLayout />}>
    <Route path='/' element={<Home />} />
    <Route path='/dashboard' element={<Dashboard />} />
    <Route path='/chat' element={<Chat />} />
    <Route path='/reports' element={<Reports />} />
    <Route path='/settings' element={<Settings />} />
    <Route path='/emergency' element={<Emergency />} />
  </Route>
))

createRoot(document.getElementById('root')).render(
    <RouterProvider router={router} />
)
