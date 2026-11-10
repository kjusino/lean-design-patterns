/-
  Visitor  →  pattern matching, or one generic fold
  Industry case: lint and analysis passes over a SQL WHERE clause, as in
  query planners and SQL linters. Each pass ("which columns are read?",
  "how big is this expression?") would be a Visitor class in Java. In Lean
  each pass is either a direct recursive function or a record of handlers
  given to one shared fold, and the two can be proved equal.
-/
namespace Visitor

-- ## Domain
inductive SqlExpr where
  | column : String → SqlExpr
  | number : Nat → SqlExpr
  | add    : SqlExpr → SqlExpr → SqlExpr
  | eq     : SqlExpr → SqlExpr → SqlExpr
  | and    : SqlExpr → SqlExpr → SqlExpr
  deriving Repr

-- ## Spec
-- Each pass written the plain way: direct recursion.
def columnsUsed : SqlExpr → List String
  | .column name => [name]
  | .number _    => []
  | .add a b     => columnsUsed a ++ columnsUsed b
  | .eq a b      => columnsUsed a ++ columnsUsed b
  | .and a b     => columnsUsed a ++ columnsUsed b

def nodeCount : SqlExpr → Nat
  | .column _ => 1
  | .number _ => 1
  | .add a b  => nodeCount a + nodeCount b + 1
  | .eq a b   => nodeCount a + nodeCount b + 1
  | .and a b  => nodeCount a + nodeCount b + 1

-- ## Implementation
-- The "Visitor": one handler per node kind, producing a result of type R.
structure SqlVisitor (R : Type) where
  onColumn : String → R
  onNumber : Nat → R
  onAdd    : R → R → R
  onEq     : R → R → R
  onAnd    : R → R → R

-- One traversal, written once, shared by every pass.
def fold {R : Type} (v : SqlVisitor R) : SqlExpr → R
  | .column name => v.onColumn name
  | .number n    => v.onNumber n
  | .add a b     => v.onAdd (fold v a) (fold v b)
  | .eq a b      => v.onEq (fold v a) (fold v b)
  | .and a b     => v.onAnd (fold v a) (fold v b)

def columnsVisitor : SqlVisitor (List String) :=
  { onColumn := fun name => [name], onNumber := fun _ => [],
    onAdd := fun a b => a ++ b, onEq := fun a b => a ++ b, onAnd := fun a b => a ++ b }

def countVisitor : SqlVisitor Nat :=
  { onColumn := fun _ => 1, onNumber := fun _ => 1,
    onAdd := fun a b => a + b + 1, onEq := fun a b => a + b + 1, onAnd := fun a b => a + b + 1 }

-- ## Proof
-- Each visitor computes exactly what the direct recursive pass computes.
theorem columnsVisitor_correct (e : SqlExpr) :
    fold columnsVisitor e = columnsUsed e := by
  induction e with
  | column name => rfl
  | number n => rfl
  | add a b iha ihb => simp [fold, columnsVisitor, columnsUsed] at *; rw [iha, ihb]
  | eq a b iha ihb => simp [fold, columnsVisitor, columnsUsed] at *; rw [iha, ihb]
  | and a b iha ihb => simp [fold, columnsVisitor, columnsUsed] at *; rw [iha, ihb]

theorem countVisitor_correct (e : SqlExpr) :
    fold countVisitor e = nodeCount e := by
  induction e with
  | column name => rfl
  | number n => rfl
  | add a b iha ihb => simp [fold, countVisitor, nodeCount] at *; rw [iha, ihb]
  | eq a b iha ihb => simp [fold, countVisitor, nodeCount] at *; rw [iha, ihb]
  | and a b iha ihb => simp [fold, countVisitor, nodeCount] at *; rw [iha, ihb]

-- ## Try it
-- WHERE status = 1 AND total + tax = 100
def whereClause : SqlExpr :=
  .and (.eq (.column "status") (.number 1))
       (.eq (.add (.column "total") (.column "tax")) (.number 100))

#eval fold columnsVisitor whereClause
#eval fold countVisitor whereClause

end Visitor
