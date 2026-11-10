/-
  Strategy  →  pass the function (and its proof)
  Industry case: sorting a ledger of transaction timestamps.
  In 2015, researchers trying to formally verify TimSort (the default sort
  in Java and Python) found that it could crash on certain large inputs.
  Here a sort strategy can only be plugged in if it comes with a proof.
-/
namespace Strategy

-- ## Spec
-- A list is sorted when every element is ≤ every element after it.
def Sorted (xs : List Nat) : Prop :=
  List.Pairwise (fun a b => a ≤ b) xs

-- A sort strategy is a function PLUS proofs that it meets the contract:
-- the output is sorted, and it is a rearrangement (permutation) of the input.
structure SortStrategy where
  name   : String
  sort   : List Nat → List Nat
  sorted : ∀ (xs : List Nat), Sorted (sort xs)
  perm   : ∀ (xs : List Nat), List.Perm (sort xs) xs

-- ## Implementation
-- Strategy 1: insertion sort, written by hand.
def insert (x : Nat) : List Nat → List Nat
  | []      => [x]
  | y :: ys => if x ≤ y then x :: y :: ys else y :: insert x ys

def insertionSort : List Nat → List Nat
  | []      => []
  | x :: xs => insert x (insertionSort xs)

-- Strategy 2: Lean's built-in merge sort.
def mergeSortNat (xs : List Nat) : List Nat :=
  List.mergeSort xs (fun a b => decide (a ≤ b))

-- ## Proof
-- Inserting x gives a permutation of x :: ys.
theorem insert_perm (x : Nat) (ys : List Nat) :
    List.Perm (insert x ys) (x :: ys) := by
  induction ys with
  | nil => simp [insert]
  | cons y ys ih =>
    unfold insert
    split
    · exact List.Perm.refl _
    · exact List.Perm.trans (List.Perm.cons y ih) (List.Perm.swap x y ys)

-- Inserting into a sorted list keeps it sorted.
theorem insert_sorted (x : Nat) (ys : List Nat) (h : Sorted ys) :
    Sorted (insert x ys) := by
  induction ys with
  | nil => simp [insert, Sorted]
  | cons y ys ih =>
    unfold Sorted at h
    rw [List.pairwise_cons] at h
    unfold insert
    split
    · rename_i hxy
      unfold Sorted
      rw [List.pairwise_cons, List.pairwise_cons]
      refine ⟨?_, h.1, h.2⟩
      intro z hz
      cases hz with
      | head => exact hxy
      | tail _ hz' => exact Nat.le_trans hxy (h.1 z hz')
    · rename_i hxy
      unfold Sorted
      rw [List.pairwise_cons]
      refine ⟨?_, ih h.2⟩
      intro z hz
      have hz' : z ∈ x :: ys := (insert_perm x ys).mem_iff.mp hz
      cases hz' with
      | head => omega
      | tail _ hz'' => exact h.1 z hz''

theorem insertionSort_sorted (xs : List Nat) : Sorted (insertionSort xs) := by
  induction xs with
  | nil => simp [insertionSort, Sorted]
  | cons x xs ih => exact insert_sorted x (insertionSort xs) ih

theorem insertionSort_perm (xs : List Nat) : List.Perm (insertionSort xs) xs := by
  induction xs with
  | nil => simp [insertionSort]
  | cons x xs ih =>
    exact List.Perm.trans (insert_perm x (insertionSort xs)) (List.Perm.cons x ih)

-- Merge sort's proofs come from Lean's standard library.
theorem mergeSortNat_sorted (xs : List Nat) : Sorted (mergeSortNat xs) := by
  have h := List.pairwise_mergeSort (le := fun a b => decide (a ≤ b))
    (by intro a b c hab hbc; simp at *; omega)
    (by intro a b; simp; omega) xs
  unfold Sorted mergeSortNat
  exact List.Pairwise.imp (fun hab => by simpa using hab) h

theorem mergeSortNat_perm (xs : List Nat) : List.Perm (mergeSortNat xs) xs :=
  List.mergeSort_perm xs _

-- Both strategies are packaged with their proofs. A strategy without
-- proofs simply does not type-check as a `SortStrategy`.
def insertionStrategy : SortStrategy :=
  { name := "insertion", sort := insertionSort,
    sorted := insertionSort_sorted, perm := insertionSort_perm }

def mergeStrategy : SortStrategy :=
  { name := "merge", sort := mergeSortNat,
    sorted := mergeSortNat_sorted, perm := mergeSortNat_perm }

-- The ledger code depends only on the contract, never on which sort it got.
def sortLedger (strategy : SortStrategy) (timestamps : List Nat) : List Nat :=
  strategy.sort timestamps

theorem sortLedger_correct (strategy : SortStrategy) (timestamps : List Nat) :
    Sorted (sortLedger strategy timestamps) ∧
    List.Perm (sortLedger strategy timestamps) timestamps :=
  ⟨strategy.sorted timestamps, strategy.perm timestamps⟩

-- ## Try it
#eval sortLedger insertionStrategy [1700000300, 1700000100, 1700000200]
#eval sortLedger mergeStrategy     [1700000300, 1700000100, 1700000200]

end Strategy
