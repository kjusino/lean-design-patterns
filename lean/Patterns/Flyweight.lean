/-
  Flyweight  →  a different design: a shared, precomputed lookup table
  Industry case: sales-tax rates at checkout. Rates depend on the
  shipping jurisdiction, and computing one from the rule set is slow, so
  services build a table once and share it across every request. The
  GoF intent (sharing memory) is already free in Lean: immutable values
  are shared by reference. What is worth proving is the cache: it must
  never return a rate the rules would not.
-/
namespace Flyweight

-- ## Spec
-- The slow, authoritative computation (stands in for a large rule engine).
-- Rates are in basis points: 625 = 6.25%.
def ruleRate (zip : String) : Nat :=
  if zip.startsWith "02" then 625          -- Massachusetts
  else if zip.startsWith "10" then 888     -- New York City
  else if zip.startsWith "97" then 0       -- Oregon
  else 500

-- ## Implementation
-- Build the shared table once, for the postal codes we actually ship to.
def buildTable (zips : List String) : List (String × Nat) :=
  zips.map (fun z => (z, ruleRate z))

def lookup (table : List (String × Nat)) (zip : String) : Option Nat :=
  match table with
  | []              => none
  | (z, r) :: rest  => if z = zip then some r else lookup rest zip

-- Checkout: use the table, fall back to the rules on a miss.
def checkoutRate (table : List (String × Nat)) (zip : String) : Nat :=
  match lookup table zip with
  | some r => r
  | none   => ruleRate zip

-- ## Proof
-- Anything the table returns is exactly what the rules say.
theorem lookup_sound (zips : List String) (zip : String) (r : Nat)
    (h : lookup (buildTable zips) zip = some r) : r = ruleRate zip := by
  induction zips with
  | nil => simp [buildTable, lookup] at h
  | cons z rest ih =>
    simp only [buildTable, List.map_cons, lookup] at h
    split at h
    · rename_i heq
      cases h
      rw [heq]
    · exact ih h

-- Every code we built the table for is a hit.
theorem lookup_complete (zips : List String) (zip : String) (hmem : zip ∈ zips) :
    lookup (buildTable zips) zip = some (ruleRate zip) := by
  induction zips with
  | nil => contradiction
  | cons z rest ih =>
    simp only [buildTable, List.map_cons, lookup]
    split
    · rename_i heq
      rw [heq]
    · rename_i hne
      cases hmem with
      | head => contradiction
      | tail _ hrest => exact ih hrest

-- So checkout always charges the authoritative rate, hit or miss.
theorem checkoutRate_correct (zips : List String) (zip : String) :
    checkoutRate (buildTable zips) zip = ruleRate zip := by
  unfold checkoutRate
  split
  · rename_i r h
    exact lookup_sound zips zip r h
  · rfl

-- ## Try it
def sharedTable : List (String × Nat) := buildTable ["02139", "10001", "97201"]

#eval checkoutRate sharedTable "02139"
#eval checkoutRate sharedTable "60601"   -- miss: falls back to the rules

end Flyweight
