/-
  Command  →  commands are data, and one function applies them
  Industry case: the 2017 AWS S3 outage in us-east-1. An operator ran a
  playbook command to remove a few servers; a mistyped input removed far
  more, including servers a core subsystem needed. AWS then changed the
  tool to remove capacity more slowly and to refuse removals that would
  take a subsystem below its minimum. Here that guard is a theorem.
-/
namespace Command

-- ## Domain
structure Fleet where
  servers : Nat
  deriving Repr

-- Operations are values, so they can be validated, logged, replayed and undone.
inductive Cmd where
  | addServers    : Nat → Cmd
  | removeServers : Nat → Cmd
  deriving Repr

-- ## Spec
-- The safety property: the fleet never drops below its minimum capacity.
def Safe (minServers : Nat) (fleet : Fleet) : Prop :=
  minServers ≤ fleet.servers

-- ## Implementation
def apply (fleet : Fleet) : Cmd → Fleet
  | .addServers n    => { servers := fleet.servers + n }
  | .removeServers n => { servers := fleet.servers - n }

-- The guard: reject any command that would break the minimum.
def isAllowed (minServers : Nat) (fleet : Fleet) : Cmd → Bool
  | .addServers _    => true
  | .removeServers n => decide (n + minServers ≤ fleet.servers)

-- Run a command only if the guard allows it; otherwise leave the fleet alone.
def runChecked (minServers : Nat) (fleet : Fleet) (cmd : Cmd) : Fleet :=
  if isAllowed minServers fleet cmd then apply fleet cmd else fleet

-- Replay a whole operations log.
def replay (minServers : Nat) (fleet : Fleet) (log : List Cmd) : Fleet :=
  log.foldl (runChecked minServers) fleet

-- Undo: every command has an inverse.
def inverse : Cmd → Cmd
  | .addServers n    => .removeServers n
  | .removeServers n => .addServers n

-- ## Proof
-- One checked step keeps the fleet safe.
theorem runChecked_safe (minServers : Nat) (fleet : Fleet) (cmd : Cmd)
    (h : Safe minServers fleet) : Safe minServers (runChecked minServers fleet cmd) := by
  unfold runChecked
  split
  · rename_i hok
    cases cmd with
    | addServers n => simp [Safe, apply] at *; omega
    | removeServers n => simp [Safe, apply, isAllowed] at *; omega
  · exact h

-- Therefore ANY log of commands, of any length, keeps the fleet safe.
theorem replay_safe (minServers : Nat) (fleet : Fleet) (log : List Cmd)
    (h : Safe minServers fleet) : Safe minServers (replay minServers fleet log) := by
  induction log generalizing fleet with
  | nil => exact h
  | cons cmd rest ih =>
    simp only [replay, List.foldl_cons]
    exact ih (runChecked minServers fleet cmd) (runChecked_safe minServers fleet cmd h)

-- Undo really undoes an allowed command.
theorem undo_restores (minServers : Nat) (fleet : Fleet) (cmd : Cmd)
    (hok : isAllowed minServers fleet cmd = true) :
    apply (apply fleet cmd) (inverse cmd) = fleet := by
  cases cmd with
  | addServers n => simp [apply, inverse]
  | removeServers n =>
    cases fleet with
    | mk servers =>
      simp [isAllowed] at hok
      simp [apply, inverse]
      omega

-- ## Try it
-- Minimum of 40 servers. The typo "remove 400" is refused; "remove 4" runs.
#eval replay 40 { servers := 100 } [.removeServers 400, .removeServers 4]

end Command
