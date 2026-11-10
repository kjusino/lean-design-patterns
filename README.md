# Lean Design Patterns

The 23 Gang of Four design patterns, translated into Lean 4. Each pattern is grounded in a real industry case and shown as a spec, an implementation and a machine-checked proof.

**Site:** https://kjusino.github.io/lean-design-patterns/

> **Development in progress.** The author has not reviewed this content yet. The Lean proofs compile and are checked on every change, but the explanations and industry cases may contain errors.

## What's here

| Path | What it is |
|---|---|
| `lean/Patterns/*.lean` | One standalone Lean file per pattern. No imports, so any file can be pasted into the [Lean playground](https://live.lean-lang.org/). |
| `src/data/patterns.ts` | Page content: the industry case, the OOP sketch, and what each proof does and does not cover. |
| `src/` | The single-page site (Vite + React + TypeScript). It reads the `.lean` files directly, so the site always shows the code CI checked. |
| `.github/workflows/site.yml` | Runs `lake build --wfail` (any `sorry` or warning fails), then builds and deploys to GitHub Pages. |

Each Lean file is split into sections with comment headers (`-- ## Domain`, `-- ## Spec`, `-- ## Implementation`, `-- ## Proof`, `-- ## Try it`). The site displays those sections separately and puts the spec front and center.

## Verdicts

Not every GoF pattern survives the move to pure functional code:

- **Becomes a language feature (16):** Factory Method, Abstract Factory, Builder, Adapter, Bridge, Composite, Decorator, Facade, Chain of Responsibility, Command, Interpreter, Iterator, State, Strategy, Template Method, Visitor
- **Becomes a different design (4):** Flyweight, Proxy, Mediator, Observer
- **Not needed in Lean (3):** Prototype, Singleton, Memento

## Develop

```sh
# Lean (toolchain pinned in lean/lean-toolchain)
cd lean && lake build --wfail

# Site
npm install
npm run dev
```

## Custom domain

The site is built with a relative base path, so it works under `/lean-design-patterns/` today and at a domain root later. To use a custom domain, add it under **Settings → Pages** and add a `public/CNAME` file containing the domain.

## License

MIT
