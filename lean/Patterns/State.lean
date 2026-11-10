/-
  State  →  an inductive status plus a transition function
  Industry case: an e-commerce order lifecycle. Classic bugs: shipping an
  unpaid order, or refunding more than the customer paid (for example after
  a duplicated refund request). Each transition is checked once; induction
  covers every possible sequence of events.
-/
namespace State

-- ## Domain
inductive Status where
  | placed
  | paid
  | shipped
  | cancelled
  deriving DecidableEq, Repr

structure Order where
  status        : Status
  paidCents     : Nat
  refundedCents : Nat
  deriving Repr

inductive Event where
  | pay    : Nat → Event
  | ship   : Event
  | refund : Nat → Event
  | cancel : Event
  deriving Repr

-- ## Spec
-- The money invariant: we never refund more than we were paid.
def MoneyOk (order : Order) : Prop :=
  order.refundedCents ≤ order.paidCents

-- ## Implementation
-- `none` means "this event is illegal in this state".
def step (order : Order) : Event → Option Order
  | .pay amount =>
    if order.status = .placed ∧ 0 < amount
    then some { order with status := .paid, paidCents := order.paidCents + amount }
    else none
  | .ship =>
    if order.status = .paid then some { order with status := .shipped } else none
  | .refund amount =>
    if (order.status = .paid ∨ order.status = .shipped)
       ∧ order.refundedCents + amount ≤ order.paidCents
    then some { order with refundedCents := order.refundedCents + amount }
    else none
  | .cancel =>
    if order.status = .placed then some { order with status := .cancelled } else none

-- Run a sequence of events, ignoring illegal ones (a real system would log them).
def run (order : Order) : List Event → Order
  | []          => order
  | e :: events =>
    match step order e with
    | some next => run next events
    | none      => run order events

def newOrder : Order := { status := .placed, paidCents := 0, refundedCents := 0 }

-- ## Proof
-- Every legal step keeps the money invariant.
theorem step_moneyOk (order next : Order) (e : Event)
    (h : MoneyOk order) (hstep : step order e = some next) : MoneyOk next := by
  cases e with
  | pay amount =>
    simp only [step] at hstep
    split at hstep
    · rename_i hc
      cases hstep
      simp only [MoneyOk] at *
      omega
    · contradiction
  | ship =>
    simp only [step] at hstep
    split at hstep
    · cases hstep; exact h
    · contradiction
  | refund amount =>
    simp only [step] at hstep
    split at hstep
    · rename_i hc
      cases hstep
      simp only [MoneyOk]
      exact hc.2
    · contradiction
  | cancel =>
    simp only [step] at hstep
    split at hstep
    · cases hstep; exact h
    · contradiction

-- So no sequence of events can ever over-refund.
theorem run_moneyOk (order : Order) (events : List Event)
    (h : MoneyOk order) : MoneyOk (run order events) := by
  induction events generalizing order with
  | nil => exact h
  | cons e rest ih =>
    simp only [run]
    split
    · rename_i next hstep
      exact ih next (step_moneyOk order next e h hstep)
    · exact ih order h

-- You can only ship an order that was paid.
theorem ship_requires_paid (order next : Order)
    (hstep : step order .ship = some next) : order.status = .paid := by
  simp only [step] at hstep
  split at hstep
  · assumption
  · contradiction

-- ## Try it
-- Pay $50, ship, refund $30, then a duplicated $30 refund is refused.
#eval run newOrder [.pay 5000, .ship, .refund 3000, .refund 3000]

end State
