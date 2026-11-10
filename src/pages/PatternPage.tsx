import { patterns, patternBySlug } from '../data/patterns'
import { leanSections, leanSource, lineCount, theoremStatement } from '../lean'
import { href } from '../router'
import { Code } from '../components/Code'
import { MetaChips, Turnstile, VerdictBadge } from '../components/Bits'
import { TryInPlayground } from '../components/TryInPlayground'
import { NotFound } from './NotFound'

export function PatternPage({ slug }: { slug: string }) {
  const p = patternBySlug[slug]
  if (!p) return <NotFound />

  const sections = leanSections(p.file)
  const source = leanSource(p.file)
  const index = patterns.findIndex((x) => x.slug === slug)
  const prev = patterns[index - 1]
  const next = patterns[index + 1]
  const dissolves = p.verdict === 'dissolves'

  return (
    <article className="pattern">
      <header className="pattern-head">
        <p className="pattern-cat">
          <a href={href(`/#cat-${p.category.toLowerCase()}`)}>{p.category}</a> pattern,{' '}
          {index + 1} of {patterns.length}
        </p>
        <h1 className="pattern-title">{p.oopName}</h1>
        <p className="pattern-lean">
          In Lean: <strong>{p.leanForm}</strong>
        </p>
        <div className="pattern-tags">
          <VerdictBadge verdict={p.verdict} />
          <MetaChips ids={p.metapatterns} />
        </div>
      </header>

      <section className="case" aria-labelledby="case-title">
        <h2 id="case-title">{p.caseTitle}</h2>
        <p className="case-text">{p.caseText}</p>
        <p className="sources">
          Source{p.sources.length > 1 ? 's' : ''}:{' '}
          {p.sources.map((s, i) => (
            <span key={s.url}>
              {i > 0 && ', '}
              <a href={s.url} target="_blank" rel="noreferrer">
                {s.label}
              </a>
            </span>
          ))}
        </p>
      </section>

      <section aria-labelledby="oop-title">
        <h2 id="oop-title">The version you know</h2>
        <Code code={p.oopSketch} lang="java" label={`${p.oopName} in Java`} />
      </section>

      {sections.Domain && (
        <section aria-labelledby="domain-title">
          <h2 id="domain-title">The domain, in Lean</h2>
          <Code code={sections.Domain} label="Domain types" />
        </section>
      )}

      {sections.Spec && (
        <section className="spec" aria-labelledby="spec-title">
          <h2 id="spec-title">
            <Turnstile /> {dissolves ? 'Why there is nothing to prove' : 'The spec'}
          </h2>
          <p className="spec-note">
            {dissolves
              ? 'These facts hold by definition. That is the point: the problem the pattern solved does not exist here.'
              : 'This is the part a person reviews, so it comes before the code. If the spec says the right thing, Lean guarantees the implementation below does too.'}
          </p>
          <Code code={sections.Spec} label="Specification" />
        </section>
      )}

      <section className="guarantees" aria-labelledby="proves-title">
        <h2 id="proves-title">What Lean proves</h2>
        <ul className="proves">
          {p.proves.map((g) => {
            const statement = g.theorem ? theoremStatement(p.file, g.theorem) : null
            return (
              <li key={g.text}>
                <p className="proves-text">{g.text}</p>
                {statement ? (
                  <Code code={statement} label={`Theorem ${g.theorem}`} />
                ) : (
                  <p className="proves-by-type">
                    {dissolves ? 'Holds by definition.' : 'Enforced by a type definition, so no separate theorem is needed.'}
                  </p>
                )}
              </li>
            )
          })}
        </ul>
        <div className="limits">
          <h2>What it does not cover</h2>
          <p className="limits-note">A proof covers the model and the spec, not the whole production system.</p>
          <ul>
            {p.limits.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
        </div>
      </section>

      {sections.Implementation && (
        <section aria-labelledby="impl-title">
          <h2 id="impl-title">Implementation</h2>
          <Code code={sections.Implementation} label="Implementation" />
        </section>
      )}

      {sections.Proof && (
        <section aria-labelledby="proof-title">
          <h2 id="proof-title">Proof</h2>
          <details className="proof">
            <summary>Show the proof ({sections.Proof.split('\n').length} lines)</summary>
            <Code code={sections.Proof} label="Proof" />
          </details>
        </section>
      )}

      <section className="run" aria-labelledby="run-title">
        <h2 id="run-title">Run it yourself</h2>
        <p>
          The complete file is {lineCount(p.file)} lines of Lean 4 with no dependencies. It compiles
          with no <code>sorry</code> on every commit.
        </p>
        <TryInPlayground code={source} fileName={p.file} />
        {sections['Try it'] && <Code code={sections['Try it']} label="Try it" />}
        <details className="full-file">
          <summary>Show the full {p.file}.lean</summary>
          <Code code={source} label={`${p.file}.lean`} />
        </details>
      </section>

      <nav className="related" aria-label="Related patterns">
        <h2>Related</h2>
        <ul>
          {p.related.map((r) => (
            <li key={r}>
              <a href={href(`/patterns/${r}`)}>{patternBySlug[r].oopName}</a>
              <span className="related-lean">{patternBySlug[r].leanForm}</span>
            </li>
          ))}
        </ul>
      </nav>

      <nav className="pager" aria-label="Previous and next pattern">
        {prev ? (
          <a href={href(`/patterns/${prev.slug}`)} rel="prev">
            <span className="pager-dir">Previous</span>
            {prev.oopName}
          </a>
        ) : (
          <span />
        )}
        {next && (
          <a href={href(`/patterns/${next.slug}`)} rel="next" className="pager-next">
            <span className="pager-dir">Next</span>
            {next.oopName}
          </a>
        )}
      </nav>
    </article>
  )
}
