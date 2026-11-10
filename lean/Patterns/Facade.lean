/-
  Facade  →  a module that exposes one small function
  Industry case: a checkout SDK. Behind `quote` sit a product catalog, a
  discount service and a tax service. Callers should never have to know
  the order those run in. In Lean a facade is just a function (or a
  namespace) that composes the subsystems; there is little left to verify
  about the facade itself, so the theorems here check the composition.
-/
namespace Facade

-- ## Domain
structure LineItem where
  sku      : String
  quantity : Nat
  deriving Repr

-- Subsystem 1: the catalog (unknown SKUs return `none`).
def unitPrice : String → Option Nat
  | "tshirt" => some 2000
  | "mug"    => some 1200
  | _        => none

-- Subsystem 2: discounts (a whole-number percentage, at most 100).
def discountPercent (code : String) : Nat :=
  if code = "WELCOME10" then 10 else 0

-- Subsystem 3: tax, in basis points (825 = 8.25%).
def taxBasisPoints : Nat := 825

-- ## Implementation
def subtotal : List LineItem → Option Nat
  | []          => some 0
  | item :: rest =>
    match unitPrice item.sku, subtotal rest with
    | some p, some s => some (p * item.quantity + s)
    | _, _           => none

structure Quote where
  subtotal : Nat
  discount : Nat
  tax      : Nat
  total    : Nat
  deriving Repr

-- The facade: one call, one answer.
def quote (cart : List LineItem) (code : String) : Option Quote :=
  match subtotal cart with
  | none     => none
  | some sub =>
    let discount := sub * discountPercent code / 100
    let taxable := sub - discount
    let tax := taxable * taxBasisPoints / 10000
    some { subtotal := sub, discount := discount, tax := tax, total := taxable + tax }

-- ## Spec
-- The quote is internally consistent: the total is what remains after the
-- discount, plus tax, and a discount never exceeds the subtotal.
def WellFormed (q : Quote) : Prop :=
  q.discount ≤ q.subtotal ∧ q.total = q.subtotal - q.discount + q.tax

-- ## Proof
theorem discountPercent_le (code : String) : discountPercent code ≤ 100 := by
  unfold discountPercent
  split <;> decide

theorem quote_wellFormed (cart : List LineItem) (code : String) (q : Quote)
    (h : quote cart code = some q) : WellFormed q := by
  unfold quote at h
  split at h
  · contradiction
  · rename_i sub _
    cases h
    unfold WellFormed
    have hp := discountPercent_le code
    have hd : sub * discountPercent code / 100 ≤ sub := by
      have : sub * discountPercent code ≤ sub * 100 := Nat.mul_le_mul_left sub hp
      omega
    exact ⟨hd, rfl⟩

-- An unknown SKU anywhere in the cart means no quote at all.
theorem unknown_sku_no_quote (item : LineItem) (rest : List LineItem) (code : String)
    (h : unitPrice item.sku = none) : quote (item :: rest) code = none := by
  simp [quote, subtotal, h]

-- ## Try it
#eval quote [⟨"tshirt", 2⟩, ⟨"mug", 1⟩] "WELCOME10"
#eval quote [⟨"tshirt", 2⟩, ⟨"poster", 1⟩] ""

end Facade
