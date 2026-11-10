/-
  Adapter  →  a conversion function between two types
  Industry case: the Mars Climate Orbiter (1999). Ground software from one
  team reported thruster impulse in pound-force seconds; the navigation
  software expected newton-seconds. Both were plain numbers, so nothing
  noticed, and the spacecraft was lost. Here each unit is its own type, the
  only bridge between them is an adapter, and the adapter is proved to
  respect how navigation uses the data (adding burns together).
-/
namespace Adapter

-- ## Domain
-- Units as distinct types. Both wrap a whole number of small units so that
-- arithmetic stays exact (no floating point).
structure LbfSeconds where
  milli : Nat          -- thousandths of a pound-force second
  deriving Repr, DecidableEq

structure NewtonSeconds where
  nano : Nat           -- billionths of a newton second
  deriving Repr, DecidableEq

-- 1 lbf·s = 4.448222 N·s, so 1 milli-lbf·s = 4,448,222 nano-N·s.
def nanoNsPerMilliLbfs : Nat := 4448222

-- Navigation only accepts newton-seconds. Passing pound-force seconds
-- here is a type error, not a lost spacecraft.
def totalImpulse : List NewtonSeconds → NewtonSeconds
  | []      => { nano := 0 }
  | b :: bs => { nano := b.nano + (totalImpulse bs).nano }

def totalLbf : List LbfSeconds → LbfSeconds
  | []      => { milli := 0 }
  | b :: bs => { milli := b.milli + (totalLbf bs).milli }

-- ## Implementation
-- The adapter: the one place the conversion factor appears.
def toNewton (x : LbfSeconds) : NewtonSeconds :=
  { nano := x.milli * nanoNsPerMilliLbfs }

-- ## Spec
-- It does not matter where in the pipeline you convert: converting each
-- burn then summing equals summing then converting.
theorem adapter_respects_sum (burns : List LbfSeconds) :
    totalImpulse (burns.map toNewton) = toNewton (totalLbf burns) := by
  induction burns with
  | nil => rfl
  | cons b bs ih =>
    simp only [List.map_cons, totalImpulse, totalLbf, toNewton]
    rw [ih]
    simp only [toNewton, NewtonSeconds.mk.injEq]
    rw [Nat.add_mul]

-- ## Proof
-- The adapter never merges two different readings into one.
theorem toNewton_injective (x y : LbfSeconds) (h : toNewton x = toNewton y) : x = y := by
  cases x with
  | mk a =>
    cases y with
    | mk b =>
      simp only [toNewton, NewtonSeconds.mk.injEq, nanoNsPerMilliLbfs] at h
      simp only [LbfSeconds.mk.injEq]
      omega

-- ## Try it
def burns : List LbfSeconds := [{ milli := 1500 }, { milli := 2250 }]

#eval totalImpulse (burns.map toNewton)
-- #eval totalImpulse burns   -- uncomment: a type error, which is the point

end Adapter
