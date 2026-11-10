// Loads the compiled .lean sources (the same files CI builds with `lake build`)
// and splits them into the named sections each page displays.

const files = import.meta.glob('../lean/Patterns/*.lean', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

export function leanSource(fileName: string): string {
  const key = Object.keys(files).find((k) => k.endsWith(`/${fileName}.lean`))
  if (!key) throw new Error(`Missing Lean file for ${fileName}`)
  return files[key]
}

export type SectionName = 'Domain' | 'Spec' | 'Implementation' | 'Proof' | 'Try it'

// Sections are marked in the Lean files with comment headers: `-- ## Spec`.
export function leanSections(fileName: string): Partial<Record<SectionName, string>> {
  const source = leanSource(fileName)
  const out: Partial<Record<SectionName, string>> = {}
  let current: SectionName | null = null
  let buffer: string[] = []
  const flush = () => {
    if (current) {
      const text = buffer.join('\n').replace(/^\n+|\n+$/g, '')
      out[current] = out[current] ? `${out[current]}\n\n${text}` : text
    }
    buffer = []
  }
  for (const line of source.split('\n')) {
    const m = line.match(/^-- ## (.+)$/)
    if (m) {
      flush()
      current = m[1].trim() as SectionName
      continue
    }
    if (/^end \w+\s*$/.test(line)) {
      flush()
      current = null
      continue
    }
    if (current) buffer.push(line)
  }
  flush()
  return out
}

// The statement of a theorem: everything from `theorem name` up to `:=`,
// i.e. what is proved, without how.
export function theoremStatement(fileName: string, name: string): string | null {
  const lines = leanSource(fileName).split('\n')
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const start = lines.findIndex((l) => new RegExp(`^\\s*theorem ${escaped}(\\s|$)`).test(l))
  if (start < 0) return null
  const taken: string[] = []
  for (let i = start; i < lines.length; i++) {
    const line = lines[i]
    const cut = line.indexOf(':=')
    if (cut >= 0) {
      taken.push(line.slice(0, cut).trimEnd())
      break
    }
    taken.push(line)
  }
  const indent = Math.min(...taken.filter((l) => l.trim()).map((l) => l.match(/^\s*/)![0].length))
  return taken.map((l) => l.slice(indent)).join('\n').trimEnd()
}

export function lineCount(fileName: string): number {
  return leanSource(fileName).trimEnd().split('\n').length
}

// The public Lean playground accepts plain code in the URL hash.
export const PLAYGROUND = 'https://live.lean-lang.org/'

export function playgroundUrl(code: string): string {
  return `${PLAYGROUND}#code=${encodeURIComponent(code)}`
}
