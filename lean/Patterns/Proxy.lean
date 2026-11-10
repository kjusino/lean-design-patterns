/-
  Proxy  →  a wrapper with the same type as the thing it wraps
  Industry case: a read-through cache in front of a pricing service (the
  role Redis or Memcached plays in most web stacks). Callers can't tell
  whether a price came from the cache or the backend, and they must never
  be able to. The proof follows the cache as it changes across many reads.
-/
namespace Proxy

-- ## Domain
-- The backend: the source of truth for prices (in cents) by SKU.
def backendPrice (sku : String) : Nat :=
  if sku = "tshirt" then 2000 else if sku = "mug" then 1200 else 999

-- The cache: (sku, price) pairs.
def cacheGet (cache : List (String × Nat)) (sku : String) : Option Nat :=
  match cache with
  | []              => none
  | (k, v) :: rest  => if k = sku then some v else cacheGet rest sku

-- ## Spec
-- The cache invariant: every entry agrees with the backend.
def CacheValid (cache : List (String × Nat)) : Prop :=
  ∀ (sku : String) (v : Nat), cacheGet cache sku = some v → v = backendPrice sku

-- ## Implementation
-- The proxy: same answer as `backendPrice`, plus an updated cache.
def getPrice (cache : List (String × Nat)) (sku : String) : Nat × List (String × Nat) :=
  match cacheGet cache sku with
  | some v => (v, cache)
  | none   =>
    let v := backendPrice sku
    (v, (sku, v) :: cache)

-- Serve a whole stream of requests, threading the cache through.
def serveAll (cache : List (String × Nat)) : List String → List Nat
  | []          => []
  | sku :: rest =>
    let (v, cache') := getPrice cache sku
    v :: serveAll cache' rest

-- ## Proof
theorem getPrice_value (cache : List (String × Nat)) (sku : String) (h : CacheValid cache) :
    (getPrice cache sku).1 = backendPrice sku := by
  unfold getPrice
  split
  · rename_i v hv
    exact h sku v hv
  · rfl

theorem getPrice_valid (cache : List (String × Nat)) (sku : String) (h : CacheValid cache) :
    CacheValid (getPrice cache sku).2 := by
  unfold getPrice
  split
  · exact h
  · intro s v hv
    simp only [cacheGet] at hv
    split at hv
    · rename_i heq
      cases hv
      rw [heq]
    · exact h s v hv

-- Through the proxy, a stream of reads returns exactly what the backend would.
theorem serveAll_correct (cache : List (String × Nat)) (skus : List String) (h : CacheValid cache) :
    serveAll cache skus = skus.map backendPrice := by
  induction skus generalizing cache with
  | nil => rfl
  | cons sku rest ih =>
    simp only [serveAll, List.map_cons]
    rw [getPrice_value cache sku h, ih (getPrice cache sku).2 (getPrice_valid cache sku h)]

-- An empty cache is trivially valid.
theorem empty_valid : CacheValid [] := by
  intro sku v h
  simp [cacheGet] at h

-- ## Try it
#eval serveAll [] ["mug", "tshirt", "mug", "mug"]

end Proxy
