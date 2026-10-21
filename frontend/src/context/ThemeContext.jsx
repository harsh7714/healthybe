import { useEffect, useMemo, useState } from 'react'
import { ThemeContext } from './theme.context'

export function ThemeProvider({ children }) {
  const [dark, setDarkState] = useState(() => {
    try {
      return (JSON.parse(localStorage.getItem('healthybe-theme')) ?? 'dark') === 'dark'
    } catch {
      return true
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem('healthybe-theme', JSON.stringify(dark ? 'dark' : 'light'))
    } catch {
      /* Storage may be unavailable. */
    }
  }, [dark])

  const value = useMemo(() => ({ dark, setDark: setDarkState }), [dark])
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}
