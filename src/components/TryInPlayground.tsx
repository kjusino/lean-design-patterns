import { useState } from 'react'
import { playgroundUrl } from '../lean'

type Status = 'idle' | 'opened-copied' | 'opened-not-copied' | 'copied' | 'copy-failed'

const messages: Record<Status, string> = {
  idle: '',
  'opened-copied':
    'Opened the playground in a new tab with the code filled in. It is also on your clipboard if you need to paste it.',
  'opened-not-copied':
    'Opened the playground in a new tab with the code filled in. Copying to your clipboard was blocked, so if the playground opens empty, copy the code from the full file below.',
  copied: 'Copied to your clipboard.',
  'copy-failed':
    'Your browser blocked clipboard access. Copy the code from the full file below instead.',
}

async function copy(text: string): Promise<boolean> {
  try {
    if (!navigator.clipboard) return false
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}

// Opens the public Lean playground with the code pre-filled, and also puts
// the code on the clipboard in case the playground does not pick it up.
export function TryInPlayground({ code, fileName }: { code: string; fileName: string }) {
  const [status, setStatus] = useState<Status>('idle')

  const open = async () => {
    // Open first, synchronously inside the click, so pop-up blockers allow it.
    window.open(playgroundUrl(code), '_blank', 'noopener')
    setStatus((await copy(code)) ? 'opened-copied' : 'opened-not-copied')
  }

  const copyOnly = async () => {
    setStatus((await copy(code)) ? 'copied' : 'copy-failed')
  }

  return (
    <div className="try">
      <button type="button" className="btn-primary" onClick={open}>
        Open in the Lean playground
      </button>
      <button type="button" className="btn-quiet" onClick={copyOnly}>
        Copy {fileName}.lean
      </button>
      <p className={`try-status${status === 'copy-failed' ? ' try-error' : ''}`} role="status" aria-live="polite">
        {messages[status]}
      </p>
    </div>
  )
}
