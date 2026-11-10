import type { ReactNode } from 'react'

// A small, dependency-free highlighter for the subset of Lean (and Java-ish
// pseudocode) used on this site.

const LEAN_KEYWORDS = new Set([
  'def', 'theorem', 'structure', 'inductive', 'namespace', 'end', 'where', 'match',
  'with', 'fun', 'if', 'then', 'else', 'let', 'by', 'deriving', 'mutual', 'example',
  'instance', 'abbrev', 'open', 'import', 'termination_by', 'do', 'return',
])
const LEAN_TACTICS = new Set([
  'simp', 'simp_all', 'omega', 'induction', 'cases', 'rfl', 'exact', 'intro', 'unfold',
  'split', 'rw', 'apply', 'have', 'show', 'contradiction', 'decide', 'rename_i', 'refine',
  'generalize', 'by_cases', 'left', 'right', 'constructor', 'assumption', 'generalizing',
  'at', 'only',
])
const TYPES = new Set([
  'Nat', 'Int', 'String', 'Bool', 'List', 'Option', 'Prop', 'Type', 'Except', 'Unit',
  'true', 'false', 'none', 'some',
])
const JAVA_KEYWORDS = new Set([
  'class', 'interface', 'abstract', 'extends', 'implements', 'public', 'private',
  'protected', 'static', 'final', 'return', 'new', 'if', 'for', 'try', 'catch', 'throw',
  'void', 'boolean', 'long', 'int', 'double', 'short', 'null', 'this',
])

type Lang = 'lean' | 'java'

const TOKEN =
  /(\/-[\s\S]*?-\/|--[^\n]*|\/\/[^\n]*|"(?:[^"\\]|\\.)*"|#eval|[A-Za-z_][A-Za-z0-9_'.!?]*|\d+|[⊢∀∃→↔∧∨¬≤≥≠×←⟨⟩]|\s+|.)/g

function classify(tok: string, lang: Lang): string | null {
  if (tok.startsWith('/-') || tok.startsWith('--') || tok.startsWith('//')) return 'tk-comment'
  if (tok.startsWith('"')) return 'tk-string'
  if (/^\d+$/.test(tok)) return 'tk-number'
  if (tok === '#eval') return 'tk-keyword'
  if (lang === 'lean') {
    if (LEAN_KEYWORDS.has(tok)) return 'tk-keyword'
    if (LEAN_TACTICS.has(tok)) return 'tk-tactic'
    if (TYPES.has(tok)) return 'tk-type'
    if (/^[⊢∀∃→↔∧∨¬≤≥≠×←]$/.test(tok)) return 'tk-symbol'
  } else {
    if (JAVA_KEYWORDS.has(tok)) return 'tk-keyword'
    if (/^[A-Z]/.test(tok)) return 'tk-type'
  }
  return null
}

export function highlight(code: string, lang: Lang): ReactNode[] {
  const out: ReactNode[] = []
  let i = 0
  for (const m of code.matchAll(TOKEN)) {
    const tok = m[0]
    const cls = classify(tok, lang)
    out.push(cls ? <span key={i++} className={cls}>{tok}</span> : tok)
  }
  return out
}

export function Code({ code, lang = 'lean', label }: { code: string; lang?: Lang; label?: string }) {
  return (
    <pre className={`code code-${lang}`} aria-label={label} tabIndex={0}>
      <code>{highlight(code, lang)}</code>
    </pre>
  )
}
