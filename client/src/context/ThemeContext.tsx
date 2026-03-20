import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { getTheme, setTheme as setThemePersist, applyTheme } from '@/lib/theme'

type Theme = 'light' | 'dark' | 'system'

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
  isDark: boolean
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(getTheme)
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    applyTheme(theme)
    setIsDark(document.documentElement.classList.contains('dark'))
  }, [theme])

  useEffect(() => {
    // Watch for system preference changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => {
      if (theme === 'system') {
        applyTheme('system')
        setIsDark(mediaQuery.matches)
      }
    }
    mediaQuery.addEventListener('change', handler)
    return () => mediaQuery.removeEventListener('change', handler)
  }, [theme])

  const handleSetTheme = (newTheme: Theme) => {
    setThemePersist(newTheme)
    setThemeState(newTheme)
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme: handleSetTheme, isDark }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) throw new Error('useTheme must be used within ThemeProvider')
  return context
}
