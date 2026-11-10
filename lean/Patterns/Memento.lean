/-
  Memento  →  not needed: keep the old immutable value
  Industry case: undo in a document editor (Google Docs, Figma, VS Code).
  Memento exists so an object can export a snapshot of its private state
  without breaking encapsulation. With immutable values, the old document
  IS the snapshot: undo is a stack of previous values.
-/
namespace Memento

-- ## Domain
structure Doc where
  title : String
  body  : String
  deriving Repr, DecidableEq

structure Editor where
  current : Doc
  history : List Doc    -- previous versions, most recent first
  deriving Repr

-- ## Implementation
def edit (e : Editor) (newDoc : Doc) : Editor :=
  { current := newDoc, history := e.current :: e.history }

def undo (e : Editor) : Editor :=
  match e.history with
  | []            => e
  | prev :: older => { current := prev, history := older }

-- ## Spec
-- Undo after edit returns to exactly the previous editor state.
-- The proof is `rfl`: it holds by definition.
theorem undo_edit (e : Editor) (newDoc : Doc) : undo (edit e newDoc) = e := rfl

-- Undo on a fresh editor is harmless.
theorem undo_empty (d : Doc) : undo { current := d, history := [] } = { current := d, history := [] } := rfl

-- ## Try it
def start : Editor := { current := { title := "Q3 plan", body := "draft" }, history := [] }

#eval (undo (edit (edit start { title := "Q3 plan", body := "v2" }) { title := "Q3 plan", body := "v3" })).current

end Memento
