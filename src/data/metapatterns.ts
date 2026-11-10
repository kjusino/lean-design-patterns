export type MetapatternId =
  | 'slow-spec'
  | 'unbuildable'
  | 'behavior-as-data'
  | 'pass-the-function'
  | 'fold'
  | 'prove-the-step'
  | 'immutability'

export interface Metapattern {
  id: MetapatternId
  name: string
  idea: string
  why: string
  // Extra words readers might search for.
  keywords: string
}

export const metapatterns: Metapattern[] = [
  {
    id: 'slow-spec',
    name: 'Slow spec, fast code',
    idea: 'Write the obviously correct version first. Then prove the efficient version gives the same answers.',
    why: 'Reviewers only need to read the simple version. The proof carries the trust over to the code that ships.',
    keywords: 'specification reference implementation equivalence optimization refinement correctness',
  },
  {
    id: 'unbuildable',
    name: 'Make bad states unbuildable',
    idea: 'Put the rule into the type, so an invalid value can never be constructed in the first place.',
    why: 'A check that runs once at construction replaces a check that every caller must remember.',
    keywords: 'types type safety validation invariant smart constructor dependent types subtype',
  },
  {
    id: 'behavior-as-data',
    name: 'Behavior as data',
    idea: 'Represent actions, rules or requests as plain values, then write one function that interprets them.',
    why: 'Values can be validated, logged, replayed and reasoned about. Method calls cannot.',
    keywords: 'data ast syntax tree log replay event sourcing undo dsl',
  },
  {
    id: 'pass-the-function',
    name: 'Pass the function',
    idea: 'Whatever varies becomes a parameter. Whatever repeats becomes a composition of small functions.',
    why: 'Most class hierarchies in GoF exist to pass a function around. In Lean you just pass it, along with its proof.',
    keywords: 'higher-order functions parameter composition callback lambda dependency injection',
  },
  {
    id: 'fold',
    name: 'Fold the structure',
    idea: 'One recursive function over a data type replaces a class hierarchy plus double dispatch.',
    why: 'Recursion over data is exactly what induction proofs are built for.',
    keywords: 'recursion recursive tree trees induction traversal inductive types',
  },
  {
    id: 'prove-the-step',
    name: 'Prove the step, trust the run',
    idea: 'Show that a single transition preserves an invariant. Induction then covers every possible sequence.',
    why: 'You never enumerate scenarios. One small proof covers a billion orderings of events.',
    keywords: 'invariant induction state machine transition reducer safety',
  },
  {
    id: 'immutability',
    name: 'Immutability dissolves it',
    idea: 'Some patterns only exist to manage shared mutable objects. Without mutation, the problem is gone.',
    why: 'Knowing which patterns to delete is as useful as knowing which to apply.',
    keywords: 'immutable mutation mutable copy clone shared state global',
  },
]

export const metapatternById = Object.fromEntries(
  metapatterns.map((m) => [m.id, m]),
) as Record<MetapatternId, Metapattern>
