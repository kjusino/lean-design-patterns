/-
  Decorator  →  a higher-order function that wraps another function
  Industry case: retry middleware around an API client (AWS SDKs, gRPC
  interceptors, HTTP client middleware). Retries are where outages get
  worse: retrying non-retryable errors, or retrying without a cap and
  turning a brownout into a retry storm. The decorator is proved to be
  invisible on success, to stop on non-retryable errors, and to make a
  bounded number of calls.
-/
namespace Decorator

-- ## Domain
inductive ApiError where
  | throttled     -- HTTP 429: safe to retry
  | unavailable   -- HTTP 503: safe to retry
  | badRequest    -- HTTP 400: retrying will never help
  deriving DecidableEq, Repr

def ApiError.isRetryable : ApiError → Bool
  | .throttled   => true
  | .unavailable => true
  | .badRequest  => false

-- A remote call, modeled by what happens on attempt number 0, 1, 2, ...
-- Results are paired with how many calls were made.

-- ## Implementation
def retryLoop {α : Type} (call : Nat → Except ApiError α) (attempt : Nat) :
    Nat → Except ApiError α × Nat
  | 0 => (call attempt, attempt + 1)
  | retriesLeft + 1 =>
    match call attempt with
    | .ok v => (.ok v, attempt + 1)
    | .error e =>
      if e.isRetryable then retryLoop call (attempt + 1) retriesLeft
      else (.error e, attempt + 1)

-- The decorator: same kind of call in, same kind of result out.
def withRetry {α : Type} (maxRetries : Nat) (call : Nat → Except ApiError α) :
    Except ApiError α × Nat :=
  retryLoop call 0 maxRetries

-- ## Spec
-- 1. Invisible on success: if the first call works, nothing changes.
theorem retry_transparent {α : Type} (maxRetries : Nat)
    (call : Nat → Except ApiError α) (v : α) (h : call 0 = .ok v) :
    withRetry maxRetries call = (.ok v, 1) := by
  unfold withRetry
  cases maxRetries with
  | zero => simp [retryLoop, h]
  | succ n => simp [retryLoop, h]

-- 2. A non-retryable error is returned immediately, after one call.
theorem retry_stops_on_bad_request {α : Type} (maxRetries : Nat)
    (call : Nat → Except ApiError α) (h : call 0 = .error .badRequest) :
    withRetry maxRetries call = (.error .badRequest, 1) := by
  unfold withRetry
  cases maxRetries with
  | zero => simp [retryLoop, h]
  | succ n => simp [retryLoop, h, ApiError.isRetryable]

-- ## Proof
-- 3. Bounded: never more than maxRetries + 1 calls in total.
theorem retryLoop_bounded {α : Type} (call : Nat → Except ApiError α)
    (attempt retriesLeft : Nat) :
    (retryLoop call attempt retriesLeft).2 ≤ attempt + retriesLeft + 1 := by
  induction retriesLeft generalizing attempt with
  | zero => simp [retryLoop]
  | succ n ih =>
    simp only [retryLoop]
    split
    · simp only; omega
    · split
      · have := ih (attempt + 1); omega
      · simp only; omega

theorem retry_bounded {α : Type} (maxRetries : Nat) (call : Nat → Except ApiError α) :
    (withRetry maxRetries call).2 ≤ maxRetries + 1 := by
  have h := retryLoop_bounded call 0 maxRetries
  unfold withRetry
  omega

-- ## Try it
-- Throttled twice, then succeeds.
def flaky (attempt : Nat) : Except ApiError String :=
  if attempt < 2 then .error .throttled else .ok "200 OK"

#eval withRetry 5 flaky
#eval withRetry 1 flaky
#eval withRetry 5 (fun _ => (Except.error ApiError.badRequest : Except ApiError String))

end Decorator
