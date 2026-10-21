import { createRoot } from 'react-dom/client'
import '@styles/variables.css'
import '@styles/globals.css'
import '@styles/home.css'
import '@styles/shared.css'
import '@styles/reports.css'
import '@styles/chat.css'
import '@styles/profiles.css'
import '@styles/theme.css'
import '@styles/responsive.css'
import { RouterProvider } from 'react-router-dom'
import { router } from './app/routes.jsx'

createRoot(document.getElementById('root')).render(<RouterProvider router={router} />)
