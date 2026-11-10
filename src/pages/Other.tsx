import { metapatterns } from '../data/metapatterns'
import { patterns } from '../data/patterns'
import { href } from '../router'

export function Metapatterns() {
  return (
    <article className="prose-page">
      <h1>Metapatterns</h1>
      <p className="section-lede">
        Twenty-three patterns are a lot to remember. Seven ideas are not. Every pattern page is
        tagged with the ideas it uses, so the same few moves show up again and again.
      </p>
      {metapatterns.map((m) => {
        const users = patterns.filter((p) => p.metapatterns.includes(m.id))
        return (
          <section key={m.id} id={m.id} className="meta-section">
            <h2>{m.name}</h2>
            <p>{m.idea}</p>
            <p className="meta-why">{m.why}</p>
            <p className="meta-used">
              Used by{' '}
              {users.map((p, i) => (
                <span key={p.slug}>
                  {i > 0 && (i === users.length - 1 ? ' and ' : ', ')}
                  <a href={href(`/patterns/${p.slug}`)}>{p.oopName}</a>
                </span>
              ))}
              .
            </p>
          </section>
        )
      })}
    </article>
  )
}

export function About() {
  return (
    <article className="prose-page">
      <h1>About</h1>
      <p>
        More and more production code will be written by AI systems. The part people still have to
        own is the specification: what the code must do, stated precisely enough that a machine can
        check the code against it. This site teaches that skill through the patterns working
        engineers already know, using Lean 4 as both the programming language and the proof
        checker.
      </p>

      <h2>How the code is checked</h2>
      <p>
        Every page’s code lives in the <code>lean/</code> folder of the repository as a standalone
        file with no imports. Continuous integration runs <code>lake build</code> on every commit,
        and the build fails if any proof is incomplete. The website reads those same files, so what
        you see is what was checked.
      </p>

      <h2>Honest scope</h2>
      <p>
        The code is a faithful miniature of each industry case, not the production system itself.
        Each page lists what the proof covers and what it does not. Not every GoF pattern survives
        the move to functional code: three are not needed at all, and four become different
        designs. Those pages explain why instead of inventing a proof.
      </p>

      <h2>Prior work</h2>
      <ul>
        <li>
          Peter Norvig,{' '}
          <a href="https://norvig.com/design-patterns/" target="_blank" rel="noreferrer">
            Design Patterns in Dynamic Programming
          </a>{' '}
          (1996), found that 16 of the 23 patterns become invisible or simpler in Lisp and Dylan.
        </li>
        <li>
          Will Crichton,{' '}
          <a href="https://arxiv.org/abs/2307.07069" target="_blank" rel="noreferrer">
            Typed Design Patterns for the Functional Era
          </a>{' '}
          (2023), argues functional patterns should map domain concepts to language features.
        </li>
        <li>
          <a href="https://github.com/functional-patterns/gof" target="_blank" rel="noreferrer">
            functional-patterns/gof
          </a>
          , which rates how naturally each GoF pattern fits pure functional programming.
        </li>
        <li>
          David Thrane Christiansen,{' '}
          <a href="https://lean-lang.org/functional_programming_in_lean/" target="_blank" rel="noreferrer">
            Functional Programming in Lean
          </a>
          , the best place to learn the language itself.
        </li>
        <li>
          The visual structure of each page owes a debt to{' '}
          <a href="https://refactoring.guru/design-patterns" target="_blank" rel="noreferrer">
            refactoring.guru
          </a>
          .
        </li>
      </ul>

      <h2>Contribute</h2>
      <p>
        Corrections, better industry cases and new proofs are welcome on{' '}
        <a href="https://github.com/kjusino/lean-design-patterns" target="_blank" rel="noreferrer">
          GitHub
        </a>
        . Created by{' '}
        <a href="https://kennethjusino.com" target="_blank" rel="noreferrer">
          Kenneth Jusino
        </a>
        .
      </p>
    </article>
  )
}
