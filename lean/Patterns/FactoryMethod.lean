/-
  Factory Method  →  a smart constructor
  Industry case: Ariane 5 Flight 501 (1996). Flight software converted a
  64-bit floating-point value (horizontal velocity) into a 16-bit signed
  integer without a range check. The value was larger than any flight of
  Ariane 4 had produced, the conversion failed, and the rocket was lost
  about 37 seconds after launch. A smart constructor is the only way to
  build the 16-bit type, and it cannot produce an out-of-range value.
-/
namespace FactoryMethod

-- ## Spec
-- A value that fits in a signed 16-bit register. The bounds are part of
-- the type: holding an `Int16Reading` IS holding the proof it is in range.
structure Int16Reading where
  value : Int
  low   : -32768 ≤ value
  high  : value ≤ 32767

-- ## Implementation
-- The factory: the only way to build a reading. Out of range → `none`,
-- so the caller is forced to handle the overflow case.
def Int16Reading.ofInt? (x : Int) : Option Int16Reading :=
  if h : -32768 ≤ x ∧ x ≤ 32767 then
    some { value := x, low := h.1, high := h.2 }
  else
    none

-- An alternative factory: saturate at the limits instead of failing.
-- Which policy is right is an engineering decision; both are safe.
def Int16Reading.saturate (x : Int) : Int16Reading :=
  if hlo : x < -32768 then
    { value := -32768, low := by decide, high := by decide }
  else if hhi : 32767 < x then
    { value := 32767, low := by decide, high := by decide }
  else
    { value := x, low := by omega, high := by omega }

-- ## Proof
-- When the checked factory succeeds, it never altered the value.
theorem ofInt?_preserves (x : Int) (r : Int16Reading)
    (h : Int16Reading.ofInt? x = some r) : r.value = x := by
  unfold Int16Reading.ofInt? at h
  split at h
  · cases h; rfl
  · contradiction

-- It fails exactly when the value does not fit.
theorem ofInt?_none_iff (x : Int) :
    Int16Reading.ofInt? x = none ↔ (x < -32768 ∨ 32767 < x) := by
  unfold Int16Reading.ofInt?
  split
  · rename_i h; simp; omega
  · rename_i h; simp; omega

-- Saturation is the identity on in-range values.
theorem saturate_in_range (x : Int) (hlo : -32768 ≤ x) (hhi : x ≤ 32767) :
    (Int16Reading.saturate x).value = x := by
  unfold Int16Reading.saturate
  split
  · omega
  · split
    · omega
    · rfl

-- ## Try it
#eval (Int16Reading.ofInt? 20000).map (fun r => r.value)   -- fits
#eval (Int16Reading.ofInt? 40000).map (fun r => r.value)   -- the Ariane 5 case: rejected
#eval (Int16Reading.saturate 40000).value

end FactoryMethod
