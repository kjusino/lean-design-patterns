import { useState } from 'react'
import { PLAYGROUND, playgroundUrl } from '../lean'

// Opens the public Lean playground with the code pre-filled, and also puts
// the code on the clipboard in case the playground does not pick it up.
export function TryInPlayground({ code, fileName }: { code: string; fileName: string }) {
  const [status, setStatus] = useState<'idle' | 'copied' | 'opened'>('idle')

  const onClick = () => {
    window.open(playgroundUrl(code), '_blank', 'noopener')
    if (navigator.clipboard) {
      navigator.clipboard.writeText(code).then(
        () => setStatus('copied'),
        () => setStatus('opened'),
      )
    } else {
      setStatus('opened')
    }
  }

  const copyOnly = () => {
    navigator.clipboard?.writeText(code).then(() => setStatus('copied'))
  }

  return (
    <div className="try">
      <button type="button" className="btn-primary" onClick={onClick}>
        Open in the Lean playground
      </button>
      <button type="button" className="btn-quiet" onClick={copyOnly}>
        Copy {fileName}.lean
      </button>
      <p className="try-status" role="status" aria-live="polite">
        {status === 'copied' &&
          'Copied to your clipboard. If the playground opens empty, paste it in.'}
        {status === 'opened' && (
          <>Opened {new URL(PLAYGROUND).host}. Copy the code below if it opens empty.</>
        )}
      </p>
    </div>
  )
}
