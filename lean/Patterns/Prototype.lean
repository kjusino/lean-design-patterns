/-
  Prototype  →  not needed: copy an immutable value with `{ x with ... }`
  Industry case: per-environment service configuration. Teams start from a
  base config and clone it for staging and production. In mutable
  languages a shallow clone shares nested objects, so editing staging can
  quietly edit production. With immutable values a "copy" and the original
  cannot affect each other, so there is no cloning problem to solve.
-/
namespace Prototype

-- ## Domain
structure Limits where
  maxConnections : Nat
  timeoutMs      : Nat
  deriving Repr

structure ServiceConfig where
  region   : String
  replicas : Nat
  limits   : Limits
  deriving Repr

-- ## Implementation
def baseConfig : ServiceConfig :=
  { region := "us-east-1", replicas := 2, limits := { maxConnections := 100, timeoutMs := 3000 } }

-- "Cloning" is just building a new value from an old one.
def staging : ServiceConfig := { baseConfig with replicas := 1 }

def production : ServiceConfig :=
  { baseConfig with replicas := 6,
                    limits := { baseConfig.limits with maxConnections := 1000 } }

-- ## Spec
-- These hold by definition (`rfl`): there is nothing left to prove, which
-- is exactly why the pattern disappears.
example : staging.limits = baseConfig.limits := rfl
example : production.limits.timeoutMs = baseConfig.limits.timeoutMs := rfl
example : baseConfig.limits.maxConnections = 100 := rfl   -- prod's edit did not leak back

-- ## Try it
#eval staging
#eval production

end Prototype
