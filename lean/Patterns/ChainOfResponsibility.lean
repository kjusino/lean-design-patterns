/-
  Chain of Responsibility  →  a list of functions; the first answer wins
  Industry case: payment risk checks, as run by card processors before
  approving a charge. Each check either decides or passes the transaction
  along. Risk teams think in decision tables; engineers ship a pipeline.
  The theorem says the pipeline and the table always agree, so reordering
  or editing checks can't silently change who gets approved.
-/
namespace ChainOfResponsibility

-- ## Domain
inductive Decision where
  | approve
  | review
  | decline
  deriving DecidableEq, Repr

structure Txn where
  amountCents       : Nat
  attemptsLastHour  : Nat
  cardCountry       : String
  ipCountry         : String
  deriving Repr

-- ## Spec
-- The decision table, exactly as the risk team wrote it down.
def decisionTable (t : Txn) : Decision :=
  if 5 < t.attemptsLastHour then .decline
  else if 500000 < t.amountCents then .review
  else if t.cardCountry ≠ t.ipCountry then .review
  else .approve

-- ## Implementation
-- A handler either decides (`some d`) or passes the transaction on (`none`).
def velocityCheck (t : Txn) : Option Decision :=
  if 5 < t.attemptsLastHour then some .decline else none

def largeAmountCheck (t : Txn) : Option Decision :=
  if 500000 < t.amountCents then some .review else none

def geoMismatchCheck (t : Txn) : Option Decision :=
  if t.cardCountry ≠ t.ipCountry then some .review else none

-- Ask each handler in order; the first one that decides wins.
def firstDecision (handlers : List (Txn → Option Decision)) (t : Txn) : Option Decision :=
  match handlers with
  | []        => none
  | h :: rest =>
    match h t with
    | some d => some d
    | none   => firstDecision rest t

-- If nobody objects, approve.
def runChain (handlers : List (Txn → Option Decision)) (t : Txn) : Decision :=
  (firstDecision handlers t).getD .approve

def riskPipeline : List (Txn → Option Decision) :=
  [velocityCheck, largeAmountCheck, geoMismatchCheck]

-- ## Proof
-- The pipeline agrees with the decision table on every transaction.
theorem pipeline_matches_table (t : Txn) :
    runChain riskPipeline t = decisionTable t := by
  unfold runChain riskPipeline decisionTable
  by_cases h1 : 5 < t.attemptsLastHour
  · simp [firstDecision, velocityCheck, h1]
  · by_cases h2 : 500000 < t.amountCents
    · simp [firstDecision, velocityCheck, largeAmountCheck, h1, h2]
    · by_cases h3 : t.cardCountry ≠ t.ipCountry
      · simp [firstDecision, velocityCheck, largeAmountCheck, geoMismatchCheck, h1, h2, h3]
      · simp [firstDecision, velocityCheck, largeAmountCheck, geoMismatchCheck, h1, h2, h3]

-- A general fact about every chain: putting a handler first gives it priority.
theorem first_handler_wins (h : Txn → Option Decision)
    (rest : List (Txn → Option Decision)) (t : Txn) (d : Decision)
    (hd : h t = some d) : runChain (h :: rest) t = d := by
  simp [runChain, firstDecision, hd]

-- ## Try it
#eval runChain riskPipeline { amountCents := 1200, attemptsLastHour := 1, cardCountry := "US", ipCountry := "US" }
#eval runChain riskPipeline { amountCents := 900000, attemptsLastHour := 9, cardCountry := "US", ipCountry := "BR" }

end ChainOfResponsibility
