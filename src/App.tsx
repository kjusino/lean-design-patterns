import { useEffect, useMemo, useRef, useState } from 'react'
import { categories, patterns, verdictLabel } from './data/patterns'
import { metapatternById } from './data/metapatterns'
import { href, useRoute } from './router'
import { VerdictDot } from './components/Bits'
import { Home } from './pages/Home'
import { PatternPage } from './pages/PatternPage'
import { About, Metapatterns } from './pages/Other'
import { NotFound } from './pages/NotFound'

// Everything a reader might search for: the pattern, its Lean form, the case,
// the ideas it uses and what it proves. So "immutability" or "invariant" work.
const searchText = Object.fromEntries(
  patterns.map((p) => [
    p.slug,
    [
      p.oopName,
      p.leanForm,
      p.caseTitle,
      p.caseText,
      p.category,
      verdictLabel[p.verdict],
      ...p.metapatterns.flatMap((id) => [
        metapatternById[id].name,
        metapatternById[id].idea,
        metapatternById[id].keywords,
      ]),
      ...p.proves.map((g) => g.text),
      ...p.limits,
    ]
      .join(' ')
      .toLowerCase(),
  ]),
)

export default function App() {
  const route = useRoute()
  const [path, anchor] = route.split('#')
  const [menuOpen, setMenuOpen] = useState(false)
  const [filter, setFilter] = useState('')
  const menuButton = useRef<HTMLButtonElement>(null)
  const filterInput = useRef<HTMLInputElement>(null)

  // Mobile menu: focus the filter when it opens; Escape closes it and
  // returns focus to the button that opened it.
  useEffect(() => {
    if (!menuOpen) return
    filterInput.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMenuOpen(false)
        menuButton.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [menuOpen])

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
    const words = q.split(/\s+/)
    return patterns.filter((p) => words.every((w) => searchText[p.slug].includes(w)))
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
          ref={menuButton}
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
            ref={filterInput}
            type="search"
            placeholder="Search patterns or ideas"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </label>
        {filter.trim() && visible.length > 0 && (
          <p className="catalog-hits" role="status">
            {visible.length} of {patterns.length} patterns match
          </p>
        )}
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
