/-
  Template Method  →  a higher-order function whose hooks are arguments
  Industry case: ETL jobs (Airflow, dbt, Spark pipelines). Every job has
  the same skeleton: extract records, transform each one, load the good
  ones, report the rest. Teams plug in their own hooks. The silent failure
  everyone fears is records that vanish: neither loaded nor reported. The
  skeleton is proved to account for every record, for every possible hook.
-/
namespace TemplateMethod

-- ## Domain
-- The hooks a team fills in. `Raw` is the source record, `Row` the clean one.
structure EtlHooks (Raw : Type) (Row : Type) where
  extract   : Unit → List Raw
  transform : Raw → Option Row   -- `none` = the record failed validation

structure Report (Row : Type) where
  loaded   : List Row
  rejected : Nat
  extracted : Nat

-- ## Spec
-- Bookkeeping must balance: every extracted record is loaded or rejected.
def Balanced {Row : Type} (r : Report Row) : Prop :=
  r.loaded.length + r.rejected = r.extracted

-- ## Implementation
-- The fixed skeleton (the "template method"). Teams cannot reorder it.
def runJob {Raw Row : Type} (hooks : EtlHooks Raw Row) : Report Row :=
  let raws := hooks.extract ()
  let rows := raws.filterMap hooks.transform
  { loaded := rows, rejected := raws.length - rows.length, extracted := raws.length }

-- ## Proof
-- No record is ever silently lost, whatever the hooks do.
theorem runJob_balanced {Raw Row : Type} (hooks : EtlHooks Raw Row) :
    Balanced (runJob hooks) := by
  unfold Balanced runJob
  have h := List.length_filterMap_le hooks.transform (hooks.extract ())
  simp only
  omega

-- ## Try it
-- A CSV-ish job: parse "name,cents" lines; malformed lines are rejected.
def parseLine (line : String) : Option (String × Nat) :=
  match line.splitOn "," with
  | [name, cents] =>
    match cents.toNat? with
    | some n => some (name, n)
    | none   => none
  | _ => none

def invoices : EtlHooks String (String × Nat) :=
  { extract := fun _ => ["acme,1200", "globex,oops", "initech,800", "bad line"],
    transform := parseLine }

#eval (runJob invoices).loaded
#eval (runJob invoices).rejected

end TemplateMethod
