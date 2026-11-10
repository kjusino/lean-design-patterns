import { metapatternById, type MetapatternId } from '../data/metapatterns'
import { verdictLabel, type Verdict } from '../data/patterns'
import { href } from '../router'

export function VerdictBadge({ verdict }: { verdict: Verdict }) {
  return (
    <span className={`verdict verdict-${verdict}`}>
      <span className="verdict-dot" aria-hidden="true" />
      {verdictLabel[verdict]}
    </span>
  )
}

export function VerdictDot({ verdict }: { verdict: Verdict }) {
  return <span className={`dot dot-${verdict}`} title={verdictLabel[verdict]} aria-label={verdictLabel[verdict]} />
}

export function MetaChips({ ids }: { ids: MetapatternId[] }) {
  return (
    <ul className="chips" aria-label="Metapatterns">
      {ids.map((id) => (
        <li key={id}>
          <a className="chip" href={href(`/metapatterns#${id}`)}>
            {metapatternById[id].name}
          </a>
        </li>
      ))}
    </ul>
  )
}

export function Turnstile() {
  return (
    <span className="turnstile" aria-hidden="true">
      ⊢
    </span>
  )
}
