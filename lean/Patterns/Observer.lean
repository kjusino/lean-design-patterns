/-
  Observer  →  a different design: fan events out into per-subscriber outboxes
  Industry case: webhook delivery, as in Stripe, GitHub or Shopify. Each
  subscriber registers for some event types. In OOP the subject mutates and
  calls `notify()`; in pure code the dispatcher turns a stream of events into
  one outbox per subscriber. The guarantee customers care about: you get
  every event you subscribed to, exactly once, in the order it happened.
-/
namespace Observer

-- ## Domain
structure Event where
  id   : Nat
  kind : String
  deriving Repr

structure Subscriber where
  url   : String
  wants : String → Bool

-- An outbox: a subscriber plus the events queued for it.
structure Outbox where
  subscriber : Subscriber
  queued     : List Event

-- ## Spec
-- What each subscriber should receive: the events it wants, in order.
def expectedFor (events : List Event) (s : Subscriber) : List Event :=
  events.filter (fun e => s.wants e.kind)

-- ## Implementation
-- The dispatcher processes events one at a time (event-major), the way a
-- real queue consumer does, appending to every interested outbox.
def deliverOne (outboxes : List Outbox) (e : Event) : List Outbox :=
  outboxes.map (fun o =>
    { o with queued := if o.subscriber.wants e.kind then o.queued ++ [e] else o.queued })

def dispatch (subscribers : List Subscriber) (events : List Event) : List Outbox :=
  events.foldl deliverOne (subscribers.map (fun s => { subscriber := s, queued := [] }))

-- ## Proof
-- Starting from any outboxes, dispatching appends exactly the wanted events.
theorem foldl_deliver (outboxes : List Outbox) (events : List Event) :
    events.foldl deliverOne outboxes =
      outboxes.map (fun o => { o with queued := o.queued ++ expectedFor events o.subscriber }) := by
  induction events generalizing outboxes with
  | nil => simp [expectedFor]
  | cons e rest ih =>
    simp only [List.foldl_cons, ih, deliverOne, List.map_map]
    apply List.map_congr_left
    intro o _
    by_cases hw : o.subscriber.wants e.kind
    · simp [hw, expectedFor]
    · simp [hw, expectedFor]

-- Every subscriber's outbox holds exactly its subscribed events, in order.
theorem dispatch_correct (subscribers : List Subscriber) (events : List Event) :
    (dispatch subscribers events).map (fun o => o.queued) =
      subscribers.map (fun s => expectedFor events s) := by
  simp [dispatch, foldl_deliver, Function.comp_def]

-- ## Try it
def billing : Subscriber := { url := "https://billing.example/hooks", wants := fun k => k == "invoice.paid" }
def audit   : Subscriber := { url := "https://audit.example/hooks",   wants := fun _ => true }

def stream : List Event := [⟨1, "invoice.paid"⟩, ⟨2, "customer.created"⟩, ⟨3, "invoice.paid"⟩]

#eval (dispatch [billing, audit] stream).map (fun o => (o.subscriber.url, o.queued.map (fun e => e.id)))

end Observer
