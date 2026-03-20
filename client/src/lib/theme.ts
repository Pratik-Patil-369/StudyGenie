type Theme = 'light' | 'dark' | 'system'

export function getTheme(): Theme {
  return (localStorage.getItem('studygenie-theme') as Theme) || 'system'
}

export function setTheme(theme: Theme) {
  localStorage.setItem('studygenie-theme', theme)
  applyTheme(theme)
}

export function applyTheme(theme: Theme) {
  const root = document.documentElement

  if (theme === 'system') {
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    root.classList.toggle('dark', systemDark)
  } else {
    root.classList.toggle('dark', theme === 'dark')
  }
}

// Initialize theme on page load
export function initTheme() {
  const theme = getTheme()
  applyTheme(theme)

  // Listen for system theme changes
  if (theme === 'system') {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (getTheme() === 'system') {
        document.documentElement.classList.toggle('dark', e.matches)
      }
    })
  }
}
