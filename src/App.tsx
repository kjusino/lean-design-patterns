import { useEffect, useMemo, useState } from 'react'
import { categories, patterns } from './data/patterns'
import { href, useRoute } from './router'
import { VerdictDot } from './components/Bits'
import { Home } from './pages/Home'
import { PatternPage } from './pages/PatternPage'
import { About, Metapatterns } from './pages/Other'
import { NotFound } from './pages/NotFound'

export default function App() {
  const route = useRoute()
  const [path, anchor] = route.split('#')
  const [menuOpen, setMenuOpen] = useState(false)
  const [filter, setFilter] = useState('')

  useEffect(() => {
    setMenuOpen(false)
    if (anchor) {
      requestAnimationFrame(() => document.getElementById(anchor)?.scrollIntoView())
    }
    const p = patterns.find((x) => path === `/patterns/${x.slug}`)
    document.title = p ? `${p.oopName} in Lean – Lean Design Patterns` : 'Lean Design Patterns'
  }, [path, anchor])

  const visible = useMemo(() => {
    const q = filter.trim().toLowerCase()
    if (!q) return patterns
    return patterns.filter((p) =>
      [p.oopName, p.leanForm, p.caseTitle].some((s) => s.toLowerCase().includes(q)),
    )
  }, [filter])

  let page
  if (path === '/') page = <Home />
  else if (path.startsWith('/patterns/')) page = <PatternPage slug={path.slice('/patterns/'.length)} />
  else if (path === '/metapatterns') page = <Metapatterns />
  else if (path === '/about') page = <About />
  else page = <NotFound />

  return (
    <div className="shell">
      <a className="skip" href="#main">
        Skip to content
      </a>
      <header className="topbar">
        <a className="brand" href={href('/')}>
          <span className="brand-mark" aria-hidden="true">⊢</span>
          Lean Design Patterns
        </a>
        <button
          type="button"
          className="menu-btn"
          aria-expanded={menuOpen}
          aria-controls="catalog"
          onClick={() => setMenuOpen((o) => !o)}
        >
          {menuOpen ? 'Close' : 'Patterns'}
        </button>
      </header>

      <nav id="catalog" className={`catalog${menuOpen ? ' open' : ''}`} aria-label="Pattern catalog">
        <label className="filter">
          <span className="visually-hidden">Filter patterns</span>
          <input
            type="search"
            placeholder="Filter patterns"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </label>
        {categories.map((cat) => {
          const items = visible.filter((p) => p.category === cat)
          if (items.length === 0) return null
          return (
            <div key={cat} className="catalog-group">
              <h2 className="catalog-cat">{cat}</h2>
              <ul>
                {items.map((p) => {
                  const active = path === `/patterns/${p.slug}`
                  return (
                    <li key={p.slug}>
                      <a
                        href={href(`/patterns/${p.slug}`)}
                        className={active ? 'active' : undefined}
                        aria-current={active ? 'page' : undefined}
                      >
                        <VerdictDot verdict={p.verdict} />
                        {p.oopName}
                      </a>
                    </li>
                  )
                })}
              </ul>
            </div>
          )
        })}
        {visible.length === 0 && <p className="catalog-empty">No pattern matches “{filter}”.</p>}
        <div className="catalog-group catalog-site">
          <ul>
            <li>
              <a href={href('/metapatterns')} className={path === '/metapatterns' ? 'active' : undefined}>
                Metapatterns
              </a>
            </li>
            <li>
              <a href={href('/about')} className={path === '/about' ? 'active' : undefined}>
                About
              </a>
            </li>
            <li>
              <a href="https://github.com/kjusino/lean-design-patterns" target="_blank" rel="noreferrer">
                Source on GitHub
              </a>
            </li>
          </ul>
        </div>
      </nav>

      <main id="main" className="main" tabIndex={-1}>
        {page}
      </main>
    </div>
  )
}
