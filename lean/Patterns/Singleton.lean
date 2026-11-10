/-
  Singleton  →  not needed: pass the value in
  Industry case: an application-wide config object or connection pool.
  Singletons are global mutable state with a polite name: they make tests
  share hidden state and hide which code depends on what. In Lean, values
  have no identity, so "exactly one instance" has no meaning. You build the
  config once and pass it to whatever needs it.
-/
namespace Singleton

-- ## Domain
structure AppConfig where
  databaseUrl : String
  poolSize    : Nat
  featureFlag : Bool
  deriving Repr

-- ## Implementation
-- Code declares what it depends on, in its type signature.
def handleRequest (config : AppConfig) (path : String) : String :=
  if config.featureFlag then "new handler for " ++ path
  else "old handler for " ++ path

-- Production builds the value once at startup...
def productionConfig : AppConfig :=
  { databaseUrl := "postgres://prod-db/app", poolSize := 50, featureFlag := false }

-- ...and a test simply passes a different one. No global to reset.
def testConfig : AppConfig :=
  { productionConfig with featureFlag := true }

-- ## Spec
-- The behavior depends only on the config you pass. This is true by
-- definition, which is the point: no hidden global can change it.
example : handleRequest testConfig "/checkout" = "new handler for /checkout" := rfl

-- ## Try it
#eval handleRequest productionConfig "/checkout"
#eval handleRequest testConfig "/checkout"

end Singleton
