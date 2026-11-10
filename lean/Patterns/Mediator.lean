/-
  Mediator  →  a different design: one reducer owns all the coordination
  Industry case: checkout during a flash sale. Cart, inventory and payment
  must coordinate, and the expensive bug is overselling: confirming more
  units than exist. Instead of components calling each other through a
  mediator object, every message goes through one pure reducer
  (`Msg → Store → Store`, as in Redux or the Elm architecture), and the
  reducer is proved to never oversell, whatever order messages arrive in.
-/
namespace Mediator

-- ## Domain
structure Store where
  stock    : Nat   -- units that exist for this sale
  reserved : Nat   -- held in carts, payment pending
  sold     : Nat   -- payment captured
  deriving Repr

inductive Msg where
  | addToCart       : Nat → Msg   -- cart asks inventory to hold units
  | paymentCaptured : Nat → Msg   -- payment confirms held units
  | cartExpired     : Nat → Msg   -- held units go back on sale
  deriving Repr

-- ## Spec
-- Never promise or sell more than exists.
def NoOversell (s : Store) : Prop :=
  s.reserved + s.sold ≤ s.stock

-- ## Implementation
-- The single reducer: the only place where components' rules meet.
def reduce (s : Store) : Msg → Store
  | .addToCart n =>
    if s.reserved + s.sold + n ≤ s.stock then { s with reserved := s.reserved + n } else s
  | .paymentCaptured n =>
    if n ≤ s.reserved then { s with reserved := s.reserved - n, sold := s.sold + n } else s
  | .cartExpired n =>
    if n ≤ s.reserved then { s with reserved := s.reserved - n } else s

def processAll (s : Store) (msgs : List Msg) : Store :=
  msgs.foldl reduce s

-- ## Proof
theorem reduce_noOversell (s : Store) (m : Msg) (h : NoOversell s) :
    NoOversell (reduce s m) := by
  unfold NoOversell at *
  cases m with
  | addToCart n =>
    simp only [reduce]
    split <;> simp_all <;> omega
  | paymentCaptured n =>
    simp only [reduce]
    split <;> simp_all <;> omega
  | cartExpired n =>
    simp only [reduce]
    split <;> simp_all <;> omega

-- Any interleaving of any number of messages keeps the guarantee.
theorem processAll_noOversell (s : Store) (msgs : List Msg) (h : NoOversell s) :
    NoOversell (processAll s msgs) := by
  induction msgs generalizing s with
  | nil => exact h
  | cons m rest ih =>
    simp only [processAll, List.foldl_cons]
    exact ih (reduce s m) (reduce_noOversell s m h)

-- ## Try it
-- 10 units; three shoppers race for 4 each. The third cart is refused.
#eval processAll { stock := 10, reserved := 0, sold := 0 }
  [.addToCart 4, .addToCart 4, .addToCart 4, .paymentCaptured 4, .cartExpired 4, .addToCart 4]

end Mediator
