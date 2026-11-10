/-
  Interpreter  →  an inductive AST plus an `eval` function
  Industry case: an authorization policy language, modeled on AWS Cedar
  (whose real specification is written in Lean). Policies are ASTs; an
  optimizer simplifies them before evaluation. The danger: an optimizer bug
  that silently flips a request from "deny" to "allow".
-/
namespace Interpreter

-- ## Domain
inductive Action where
  | read
  | write
  | delete
  deriving DecidableEq, Repr

structure Request where
  isAdmin : Bool
  isOwner : Bool
  action  : Action
  deriving Repr

-- The policy condition language.
inductive Cond where
  | lit      : Bool → Cond
  | isAdmin  : Cond
  | isOwner  : Cond
  | actionIs : Action → Cond
  | and      : Cond → Cond → Cond
  | or       : Cond → Cond → Cond
  | not      : Cond → Cond
  deriving Repr

inductive Effect where
  | permit
  | forbid
  deriving DecidableEq, Repr

structure Policy where
  effect    : Effect
  condition : Cond

-- ## Spec
-- The meaning of a condition, read directly off the AST.
def eval : Cond → Request → Bool
  | .lit b,      _ => b
  | .isAdmin,    r => r.isAdmin
  | .isOwner,    r => r.isOwner
  | .actionIs a, r => decide (r.action = a)
  | .and c d,    r => eval c r && eval d r
  | .or c d,     r => eval c r || eval d r
  | .not c,      r => !(eval c r)

-- Cedar-style decision: deny by default, and any matching forbid wins.
def authorize (policies : List Policy) (r : Request) : Bool :=
  let applies : Effect → Bool := fun eff =>
    policies.any (fun p => decide (p.effect = eff) && eval p.condition r)
  applies .permit && !(applies .forbid)

-- ## Implementation
-- Smart constructors that fold away constants.
def mkAnd : Cond → Cond → Cond
  | .lit true,  d => d
  | .lit false, _ => .lit false
  | c, .lit true  => c
  | c, d          => .and c d

def mkOr : Cond → Cond → Cond
  | .lit true,  _ => .lit true
  | .lit false, d => d
  | c, .lit false => c
  | c, d          => .or c d

def mkNot : Cond → Cond
  | .lit b => .lit (!b)
  | c      => .not c

-- The optimizer rebuilds the tree bottom-up with the smart constructors.
def optimize : Cond → Cond
  | .and c d => mkAnd (optimize c) (optimize d)
  | .or c d  => mkOr (optimize c) (optimize d)
  | .not c   => mkNot (optimize c)
  | c        => c

def optimizePolicy (p : Policy) : Policy :=
  { p with condition := optimize p.condition }

-- ## Proof
theorem eval_mkAnd (c d : Cond) (r : Request) :
    eval (mkAnd c d) r = (eval c r && eval d r) := by
  unfold mkAnd
  split <;> simp_all [eval]

theorem eval_mkOr (c d : Cond) (r : Request) :
    eval (mkOr c d) r = (eval c r || eval d r) := by
  unfold mkOr
  split <;> simp_all [eval]

theorem eval_mkNot (c : Cond) (r : Request) :
    eval (mkNot c) r = !(eval c r) := by
  unfold mkNot
  split <;> simp [eval]

-- The optimizer never changes what a condition means.
theorem eval_optimize (c : Cond) (r : Request) :
    eval (optimize c) r = eval c r := by
  induction c with
  | and c d ihc ihd => simp [optimize, eval_mkAnd, ihc, ihd, eval]
  | or c d ihc ihd  => simp [optimize, eval_mkOr, ihc, ihd, eval]
  | not c ih        => simp [optimize, eval_mkNot, ih, eval]
  | _               => rfl

-- So optimizing every policy never flips an authorization decision.
theorem authorize_optimize (policies : List Policy) (r : Request) :
    authorize (policies.map optimizePolicy) r = authorize policies r := by
  unfold authorize
  simp only [List.any_map, Function.comp_def, optimizePolicy, eval_optimize]
  rfl

-- Deny by default: with no permit policies, nothing is allowed.
theorem no_permit_denies (policies : List Policy) (r : Request)
    (h : ∀ p, p ∈ policies → p.effect = .forbid) :
    authorize policies r = false := by
  simp only [authorize, Bool.and_eq_false_iff]
  left
  simp only [List.any_eq_false]
  intro p hp
  simp [h p hp]

-- ## Try it
def ownersMayRead : Policy :=
  { effect := .permit, condition := .and (.lit true) (.and .isOwner (.actionIs .read)) }

def nobodyDeletes : Policy :=
  { effect := .forbid, condition := .and (.actionIs .delete) (.not (.lit false)) }

#eval optimize ownersMayRead.condition
#eval authorize [ownersMayRead, nobodyDeletes] { isAdmin := false, isOwner := true, action := .read }
#eval authorize [ownersMayRead, nobodyDeletes] { isAdmin := true,  isOwner := true, action := .delete }

end Interpreter
