/-
  Bridge  →  two independent parameters: what to send, and how to send it
  Industry case: telemetry exporters, as in OpenTelemetry. The
  "abstraction" decides which metrics to send (everything, or only error
  metrics); the "implementation" is the backend wire format (Prometheus
  text lines, OTLP records). The two vary independently. The theorem: for
  every pairing, the backend receives exactly the metrics the abstraction
  selected, in order, with nothing lost in encoding.
-/
namespace Bridge

-- ## Domain
structure Metric where
  name  : String
  value : Nat
  deriving Repr, DecidableEq

-- The implementation side: a backend with its own wire type.
-- Every backend must prove its decoder undoes its encoder.
structure Exporter (Wire : Type) where
  encode    : Metric → Wire
  decode    : Wire → Option Metric
  roundTrip : ∀ (m : Metric), decode (encode m) = some m

-- The abstraction side: which metrics to send.
structure Pipeline where
  keep : Metric → Bool

-- ## Implementation
-- The bridge: any pipeline works with any exporter.
def sendTo {Wire : Type} (p : Pipeline) (ex : Exporter Wire) (metrics : List Metric) : List Wire :=
  (metrics.filter p.keep).map ex.encode

-- Two backends with different wire formats.
def prometheus : Exporter (String × Nat) :=
  { encode := fun m => (m.name, m.value),
    decode := fun w => some { name := w.1, value := w.2 },
    roundTrip := by intro m; rfl }

structure OtlpPoint where
  metricName : String
  intValue   : Nat
  unit       : String
  deriving Repr

def otlp : Exporter OtlpPoint :=
  { encode := fun m => { metricName := m.name, intValue := m.value, unit := "1" },
    decode := fun w => some { name := w.metricName, value := w.intValue },
    roundTrip := by intro m; rfl }

-- Two pipelines.
def everything : Pipeline := { keep := fun _ => true }
def errorsOnly : Pipeline := { keep := fun m => m.name.startsWith "error." }

-- ## Spec
-- Whatever the backend, decoding what it received gives back exactly the
-- metrics the pipeline selected.
theorem sendTo_faithful {Wire : Type} (p : Pipeline) (ex : Exporter Wire)
    (metrics : List Metric) :
    (sendTo p ex metrics).filterMap ex.decode = metrics.filter p.keep := by
  unfold sendTo
  generalize metrics.filter p.keep = selected
  induction selected with
  | nil => rfl
  | cons m rest ih => simp [ex.roundTrip, ih]

-- ## Try it
def sample : List Metric :=
  [⟨"error.timeout", 3⟩, ⟨"latency.p99", 420⟩, ⟨"error.5xx", 1⟩]

#eval sendTo errorsOnly prometheus sample
#eval sendTo everything otlp sample

end Bridge
