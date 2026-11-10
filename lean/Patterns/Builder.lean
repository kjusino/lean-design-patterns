/-
  Builder  →  a fold over build steps, ending in a smart constructor
  Industry case: payment API requests (Stripe's PaymentIntent is the
  familiar example). A request needs an amount, a currency and an
  idempotency key; the key is what stops a retried request from charging
  a customer twice. Builders make it easy to forget one field. Here the
  final `build` step cannot produce a request that is missing one.
-/
namespace Builder

-- ## Spec
-- The finished request. Its fields cannot be empty or zero.
structure PaymentRequest where
  amountCents    : Nat
  currency       : String
  idempotencyKey : String
  amount_pos     : 0 < amountCents
  key_nonempty   : idempotencyKey ≠ ""

-- ## Implementation
-- A draft in progress: every field may still be missing.
structure Draft where
  amountCents    : Option Nat := none
  currency       : Option String := none
  idempotencyKey : Option String := none
  description    : String := ""

-- The builder's steps, as data.
inductive Step where
  | amount      : Nat → Step
  | currency    : String → Step
  | key         : String → Step
  | description : String → Step

def applyStep (d : Draft) : Step → Draft
  | .amount n      => { d with amountCents := some n }
  | .currency c    => { d with currency := some c }
  | .key k         => { d with idempotencyKey := some k }
  | .description s => { d with description := s }

-- `build` is the only way out, and it checks everything.
def build (d : Draft) : Option PaymentRequest :=
  match d.amountCents, d.currency, d.idempotencyKey with
  | some n, some c, some k =>
    if h : 0 < n ∧ k ≠ "" then
      some { amountCents := n, currency := c, idempotencyKey := k,
             amount_pos := h.1, key_nonempty := h.2 }
    else none
  | _, _, _ => none

def buildFrom (steps : List Step) : Option PaymentRequest :=
  build (steps.foldl applyStep {})

-- ## Proof
def isKeyStep : Step → Bool
  | .key _ => true
  | _      => false

-- Steps that don't set the key leave the key exactly as it was.
theorem foldl_keeps_key (d : Draft) (steps : List Step)
    (h : steps.all (fun s => !isKeyStep s) = true) :
    (steps.foldl applyStep d).idempotencyKey = d.idempotencyKey := by
  induction steps generalizing d with
  | nil => rfl
  | cons s rest ih =>
    simp only [List.all_cons, Bool.and_eq_true] at h
    simp only [List.foldl_cons]
    rw [ih (applyStep d s) h.2]
    cases s <;> simp_all [applyStep, isKeyStep]

-- Forget the idempotency key and the build always fails.
theorem no_key_no_request (steps : List Step)
    (h : steps.all (fun s => !isKeyStep s) = true) :
    buildFrom steps = none := by
  unfold buildFrom build
  have hk := foldl_keeps_key {} steps h
  split
  · rename_i n c k _ _ hkey
    rw [hk] at hkey
    contradiction
  · rfl

-- Any request that does come out carries a non-empty key (by its type).
theorem built_has_key (steps : List Step) (r : PaymentRequest)
    (_ : buildFrom steps = some r) : r.idempotencyKey ≠ "" :=
  r.key_nonempty

-- ## Try it
#eval (buildFrom [.amount 2500, .currency "usd", .key "order-8812"]).map (fun r => r.amountCents)
#eval (buildFrom [.amount 2500, .currency "usd", .description "forgot the key"]).isSome

end Builder
