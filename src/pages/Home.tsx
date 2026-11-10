import { metapatterns } from '../data/metapatterns'
import { categories, patterns, verdictBlurb, verdictLabel, type Verdict } from '../data/patterns'
import { href } from '../router'
import { Turnstile, VerdictDot } from '../components/Bits'

const verdicts: Verdict[] = ['feature', 'different', 'dissolves']

export function Home() {
  return (
    <div className="home">
      <header className="hero">
        <h1 className="hero-title">
          <Turnstile /> Lean Design Patterns
        </h1>
        <p className="hero-lede">
          The 23 Gang of Four patterns, translated into Lean 4. Each page starts from a real
          production system or incident, shows what the pattern becomes in functional code,
          and proves the property that matters, with a spec short enough to review in a minute.
        </p>
      </header>

      <section className="matrix" aria-labelledby="matrix-title">
        <h2 id="matrix-title" className="visually-hidden">All 23 patterns</h2>
        <div className="matrix-legend">
          {verdicts.map((v) => (
            <p key={v} className="legend-item">
              <VerdictDot verdict={v} />
              <span>
                <strong>{verdictLabel[v]}</strong>{' '}
                <span className="legend-count">({patterns.filter((p) => p.verdict === v).length})</span>
                <br />
                <span className="legend-blurb">{verdictBlurb[v]}</span>
              </span>
            </p>
          ))}
        </div>
        <div className="matrix-grid">
          {categories.map((cat) => (
            <div key={cat} className="matrix-col">
              <h3 className="matrix-cat">{cat}</h3>
              <ol className="matrix-list">
                {patterns
                  .filter((p) => p.category === cat)
                  .map((p) => (
                    <li key={p.slug}>
                      <a className={`matrix-row row-${p.verdict}`} href={href(`/patterns/${p.slug}`)}>
                        <span className="row-oop">{p.oopName}</span>
                        <span className="row-lean">{p.leanForm}</span>
                        <span className="row-case">{p.caseTitle}</span>
                      </a>
                    </li>
                  ))}
              </ol>
            </div>
          ))}
        </div>
      </section>

      <section className="home-meta" aria-labelledby="meta-title">
        <h2 id="meta-title">Seven ideas underneath all 23</h2>
        <p className="section-lede">
          The GoF catalog collapses into a handful of moves. Learn these and you will start seeing
          them in code that never mentions a pattern.
        </p>
        <dl className="meta-list">
          {metapatterns.map((m) => (
            <div key={m.id} className="meta-item">
              <dt>
                <a href={href(`/metapatterns#${m.id}`)}>{m.name}</a>
              </dt>
              <dd>{m.idea}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="home-how" aria-labelledby="how-title">
        <h2 id="how-title">How to read a pattern page</h2>
        <dl className="how-list">
          <div>
            <dt>The case</dt>
            <dd>One paragraph on the real system or incident, with a link to the source.</dd>
          </div>
          <div>
            <dt>In OOP</dt>
            <dd>A short sketch of the version you already know.</dd>
          </div>
          <div>
            <dt>The spec</dt>
            <dd>
              The few lines of Lean a person should review. If the spec says the right thing,
              the proof guarantees the code does too.
            </dd>
          </div>
          <div>
            <dt>What it covers, and what it doesn’t</dt>
            <dd>The trust boundary, in plain English. A proof is only as good as its spec.</dd>
          </div>
          <div>
            <dt>Implementation and proof</dt>
            <dd>
              Real Lean, compiled in CI on every commit. One button opens it in the public Lean
              playground.
            </dd>
          </div>
        </dl>
      </section>
    </div>
  )
}
