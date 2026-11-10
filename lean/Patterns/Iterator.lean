/-
  Iterator  →  a fold, or a cursor function the caller loops over
  Industry case: cursor-based pagination, used by Stripe, GitHub and Slack
  APIs. The client asks for a page, gets a cursor, and asks again. The
  classic bugs are off-by-one cursors that skip or repeat records at page
  boundaries. The theorem: concatenating every page gives back the full
  dataset, in order, with nothing skipped or duplicated.
-/
namespace Iterator

-- ## Domain
structure Page where
  items      : List String
  nextCursor : Option Nat
  deriving Repr

-- ## Spec
-- What the client should end up with: every record from `cursor` onward.
def expected (records : List String) (cursor : Nat) : List String :=
  records.drop cursor

-- ## Implementation
-- Server side: return one page starting at `cursor`.
def fetchPage (records : List String) (pageSize : Nat) (cursor : Nat) : Page :=
  { items := (records.drop cursor).take pageSize,
    nextCursor := if cursor + pageSize < records.length then some (cursor + pageSize) else none }

-- Client side: keep following the cursor until there is no next page.
-- `fuel` bounds the number of requests (a real client also has a limit).
def fetchAll (records : List String) (pageSize : Nat) : Nat → Nat → List String
  | 0,        _      => []
  | fuel + 1, cursor =>
    let page := fetchPage records pageSize cursor
    match page.nextCursor with
    | none      => page.items
    | some next => page.items ++ fetchAll records pageSize fuel next

-- ## Proof
-- One request, unfolded: take a page, then continue only if there is more.
theorem fetchAll_step (records : List String) (pageSize fuel cursor : Nat) :
    fetchAll records pageSize (fuel + 1) cursor =
      (if cursor + pageSize < records.length
       then (records.drop cursor).take pageSize ++ fetchAll records pageSize fuel (cursor + pageSize)
       else (records.drop cursor).take pageSize) := by
  by_cases h : cursor + pageSize < records.length
  · simp [fetchAll, fetchPage, h]
  · simp [fetchAll, fetchPage, h]

-- If enough requests are allowed, following cursors returns exactly the
-- remaining records: no gaps, no duplicates, original order.
theorem fetchAll_correct (records : List String) (pageSize fuel cursor : Nat)
    (hfuel : records.length ≤ cursor + fuel * pageSize + pageSize) :
    fetchAll records pageSize (fuel + 1) cursor = expected records cursor := by
  induction fuel generalizing cursor with
  | zero =>
    rw [fetchAll_step]
    simp only [Nat.zero_mul, Nat.add_zero] at hfuel
    by_cases h : cursor + pageSize < records.length
    · omega
    · simp only [h, ite_false, expected]
      apply List.take_of_length_le
      simp
      omega
  | succ fuel ih =>
    rw [fetchAll_step]
    by_cases h : cursor + pageSize < records.length
    · simp only [h, ite_true]
      rw [ih (cursor + pageSize) (by rw [Nat.succ_mul] at hfuel; omega)]
      simp only [expected]
      rw [← List.drop_drop]
      exact List.take_append_drop pageSize (records.drop cursor)
    · simp only [h, ite_false, expected]
      apply List.take_of_length_le
      simp
      omega

-- ## Try it
def customers : List String := ["ana", "ben", "cai", "dee", "eli", "fay", "gus"]

#eval fetchPage customers 3 0
#eval fetchAll customers 3 10 0

end Iterator
