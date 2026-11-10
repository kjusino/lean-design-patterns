import { useEffect, useState } from 'react'

// Hash routing: works on GitHub Pages (and any static host) with no server config.
export function useRoute(): string {
  const read = () => window.location.hash.replace(/^#/, '') || '/'
  const [route, setRoute] = useState(read)
  useEffect(() => {
    const onChange = () => {
      setRoute(read())
      window.scrollTo(0, 0)
    }
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])
  return route
}

export const href = (path: string) => `#${path}`
