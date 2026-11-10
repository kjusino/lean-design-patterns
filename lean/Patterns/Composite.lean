/-
  Composite  →  a recursive inductive type and one recursive function
  Industry case: cloud cost rollup. AWS Organizations, GCP folders and
  Azure management groups all nest accounts inside organizational units.
  Finance needs the total for any subtree, and it must equal the sum of
  every account's bill: no account dropped, none counted twice.
-/
namespace Composite

-- ## Domain
-- A node is either a leaf account with a monthly bill (in cents),
-- or an organizational unit that contains other nodes.
inductive CostNode where
  | account : String → Nat → CostNode
  | unit    : String → List CostNode → CostNode
  deriving Repr

-- ## Spec
-- The obviously-correct version: list every account's bill, then add them up.
mutual
  def bills : CostNode → List Nat
    | .account _ cents => [cents]
    | .unit _ children => billsOfList children
  def billsOfList : List CostNode → List Nat
    | []        => []
    | c :: rest => bills c ++ billsOfList rest
end

def sumNat : List Nat → Nat
  | []      => 0
  | x :: xs => x + sumNat xs

def specTotal (node : CostNode) : Nat :=
  sumNat (bills node)

-- ## Implementation
-- The rollup used in production: one pass, no intermediate list.
mutual
  def total : CostNode → Nat
    | .account _ cents => cents
    | .unit _ children => totalOfList children
  def totalOfList : List CostNode → Nat
    | []        => 0
    | c :: rest => total c + totalOfList rest
end

-- ## Proof
theorem sumNat_append (xs ys : List Nat) :
    sumNat (xs ++ ys) = sumNat xs + sumNat ys := by
  induction xs with
  | nil => simp [sumNat]
  | cons x xs ih => simp [sumNat, ih]; omega

-- The one-pass rollup always equals the sum of every account's bill.
mutual
  theorem total_eq_spec : ∀ (node : CostNode), total node = sumNat (bills node)
    | .account _ cents => by simp [total, bills, sumNat]
    | .unit _ children => by
      simp only [total, bills]
      exact totalOfList_eq_spec children
  theorem totalOfList_eq_spec : ∀ (nodes : List CostNode),
      totalOfList nodes = sumNat (billsOfList nodes)
    | [] => by simp [totalOfList, billsOfList, sumNat]
    | c :: rest => by
      simp only [totalOfList, billsOfList, sumNat_append]
      rw [total_eq_spec c, totalOfList_eq_spec rest]
end

theorem total_correct (node : CostNode) : total node = specTotal node :=
  total_eq_spec node

-- ## Try it
def org : CostNode :=
  .unit "acme" [
    .unit "engineering" [.account "prod" 1250000, .account "staging" 310000],
    .unit "data" [.account "warehouse" 870000],
    .account "security-audit" 45000 ]

#eval total org
#eval specTotal org

end Composite
