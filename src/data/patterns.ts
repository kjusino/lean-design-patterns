import type { MetapatternId } from './metapatterns'

export type Category = 'Creational' | 'Structural' | 'Behavioral'
export type Verdict = 'feature' | 'different' | 'dissolves'

export const verdictLabel: Record<Verdict, string> = {
  feature: 'Becomes a language feature',
  different: 'Becomes a different design',
  dissolves: 'Not needed in Lean',
}

export const verdictBlurb: Record<Verdict, string> = {
  feature: 'The intent survives. The solution is a function, an inductive type or a structure.',
  different: 'The intent survives, but the pure-functional answer is a different design with different tradeoffs.',
  dissolves: 'The problem only exists with mutable shared objects. Immutable values remove it.',
}

export interface Source {
  label: string
  url: string
}

export interface Pattern {
  slug: string
  oopName: string
  category: Category
  leanForm: string
  verdict: Verdict
  metapatterns: MetapatternId[]
  caseTitle: string
  caseText: string
  sources: Source[]
  oopSketch: string
  proves: string[]
  limits: string[]
  related: string[]
  file: string
}

export const patterns: Pattern[] = [
  // ───────────────────────── Creational ─────────────────────────
  {
    slug: 'factory-method',
    oopName: 'Factory Method',
    category: 'Creational',
    leanForm: 'Smart constructor',
    verdict: 'feature',
    metapatterns: ['unbuildable'],
    caseTitle: 'Ariane 5 Flight 501',
    caseText:
      'In 1996, Ariane 5 broke apart about 37 seconds after launch. Flight software reused from Ariane 4 converted a 64-bit floating-point velocity value into a 16-bit signed integer without checking the range. Ariane 5 flew faster than Ariane 4 ever had, the value no longer fit, the conversion raised an error, and both inertial reference units shut down. The Lean version makes the 16-bit type impossible to build except through a factory that either checks the range or saturates, so an unchecked conversion cannot be written at all.',
    sources: [
      { label: 'Ariane 5 Flight 501 inquiry board report', url: 'http://sunnyday.mit.edu/accidents/Ariane5accidentreport.html' },
    ],
    oopSketch: `abstract class ReadingFactory {
  abstract Int16Reading create(double value);
}
class CheckedFactory extends ReadingFactory {
  Int16Reading create(double v) {
    if (v < -32768 || v > 32767) throw new OverflowException();
    return new Int16Reading((short) v);
  }
}
// ...but nothing stops anyone writing: new Int16Reading((short) v)`,
    proves: [
      'Every Int16Reading in the program holds a value between −32768 and 32767. The bound is part of the type.',
      'When the checked factory succeeds, the stored value equals the input exactly.',
      'The checked factory fails if and only if the input is out of range.',
      'Saturation leaves in-range values untouched.',
    ],
    limits: [
      'It does not decide whether to fail or to saturate. That choice is engineering judgment, and both are shown.',
      'The model uses integers, not 64-bit floats. Float-to-integer rounding is out of scope.',
      'It would not have caught Ariane’s deeper error: reusing Ariane 4 assumptions about the flight profile.',
    ],
    related: ['builder', 'adapter', 'abstract-factory'],
    file: 'FactoryMethod',
  },
  {
    slug: 'abstract-factory',
    oopName: 'Abstract Factory',
    category: 'Creational',
    leanForm: 'Structure of functions with laws',
    verdict: 'feature',
    metapatterns: ['pass-the-function', 'unbuildable'],
    caseTitle: 'Multi-cloud provisioning',
    caseText:
      'Infrastructure tools such as Terraform use a provider per cloud, and every deployment needs a matching family of resources: a network, virtual machines attached to it, storage buckets. Mixing families, such as an AWS instance attached to a GCP network, is a real class of deploy-time failure that often only surfaces after a long apply. Here a factory is a record of constructor functions plus proofs that each product belongs to the factory’s own cloud. Deployment code is written once against that record, and a single theorem covers every factory, including ones written next year.',
    sources: [{ label: 'Terraform: providers', url: 'https://developer.hashicorp.com/terraform/language/providers' }],
    oopSketch: `interface CloudFactory {
  Network makeNetwork(String name);
  VM makeVm(String name, Network net);
  Bucket makeBucket(String name);
}
class AwsFactory implements CloudFactory { ... }
class GcpFactory implements CloudFactory { ... }

Stack deploy(CloudFactory f, String app) { ... }`,
    proves: [
      'Every stack built by deploy has its VM and bucket on the same cloud as its network.',
      'This holds for every factory that type-checks. A factory without the consistency proofs is rejected by the compiler.',
    ],
    limits: [
      'It checks family consistency only. It says nothing about quotas, IAM permissions or whether the cloud API call succeeds.',
    ],
    related: ['factory-method', 'bridge', 'strategy'],
    file: 'AbstractFactory',
  },
  {
    slug: 'builder',
    oopName: 'Builder',
    category: 'Creational',
    leanForm: 'Fold over build steps + smart constructor',
    verdict: 'feature',
    metapatterns: ['unbuildable', 'behavior-as-data'],
    caseTitle: 'Payment requests with idempotency keys',
    caseText:
      'Payment APIs such as Stripe accept an idempotency key with each request so that a retry after a network timeout does not charge the customer twice. A builder makes it easy to set the amount and currency and forget the key, and the code still works until the first retry. Here the builder’s steps are plain data folded into a draft, and the only way out is a build function whose result type requires a positive amount and a non-empty key.',
    sources: [{ label: 'Stripe API: idempotent requests', url: 'https://docs.stripe.com/api/idempotent_requests' }],
    oopSketch: `PaymentRequest req = new PaymentRequest.Builder()
    .amount(2500)
    .currency("usd")
    // .idempotencyKey("order-8812")   <- easy to forget
    .build();   // runtime check, if anyone wrote one`,
    proves: [
      'Any sequence of builder steps that never sets the idempotency key fails to build.',
      'Every PaymentRequest that exists has a positive amount and a non-empty key, by its type.',
    ],
    limits: [
      'It does not prove keys are unique per logical payment. That depends on how callers generate them.',
    ],
    related: ['factory-method', 'command', 'prototype'],
    file: 'Builder',
  },
  {
    slug: 'prototype',
    oopName: 'Prototype',
    category: 'Creational',
    leanForm: 'Copy with { x with … }',
    verdict: 'dissolves',
    metapatterns: ['immutability'],
    caseTitle: 'Per-environment service config',
    caseText:
      'Teams commonly define a base service configuration and clone it for staging and production, as Kustomize overlays do for Kubernetes. In languages with mutable objects, a shallow clone shares nested objects, so a change meant for staging can quietly change production. Prototype exists to manage that cloning. With immutable values, a copy and its original cannot affect each other, so there is nothing to manage.',
    sources: [{ label: 'Kubernetes: Kustomize overlays', url: 'https://kubernetes.io/docs/tasks/manage-kubernetes-objects/kustomization/' }],
    oopSketch: `ServiceConfig staging = base.clone();
staging.limits.maxConnections = 10;
// shallow clone: base.limits was shared, so base changed too`,
    proves: [
      'The examples hold by definition (rfl). There is nothing left to prove, which is why the pattern disappears.',
    ],
    limits: [
      'Copying is semantic, not physical. Lean may share memory under the hood, which is safe because nothing can mutate it.',
    ],
    related: ['memento', 'singleton', 'builder'],
    file: 'Prototype',
  },
  {
    slug: 'singleton',
    oopName: 'Singleton',
    category: 'Creational',
    leanForm: 'Pass the value',
    verdict: 'dissolves',
    metapatterns: ['immutability', 'pass-the-function'],
    caseTitle: 'App-wide config and connection pools',
    caseText:
      'Singletons usually hold configuration or a shared connection pool. They are global state with a friendlier name: tests leak state into each other, and a function’s signature no longer tells you what it depends on. The twelve-factor approach already pushes config to the edge of the program. In Lean, values have no identity, so “exactly one instance” has no meaning. You build the config once and pass it to the code that needs it.',
    sources: [{ label: 'The Twelve-Factor App: config', url: 'https://12factor.net/config' }],
    oopSketch: `class AppConfig {
  private static AppConfig instance;
  static AppConfig get() {
    if (instance == null) instance = load();
    return instance;
  }
}
// any code anywhere can call AppConfig.get()`,
    proves: [
      'Behavior depends only on the config you pass in. It holds by definition: no hidden global can change it.',
    ],
    limits: [
      'Real connection pools are effectful resources. They live in the program’s outer IO layer, not in the pure core shown here.',
    ],
    related: ['prototype', 'facade', 'abstract-factory'],
    file: 'Singleton',
  },

  // ───────────────────────── Structural ─────────────────────────
  {
    slug: 'adapter',
    oopName: 'Adapter',
    category: 'Structural',
    leanForm: 'Conversion function between types',
    verdict: 'feature',
    metapatterns: ['unbuildable', 'slow-spec'],
    caseTitle: 'Mars Climate Orbiter',
    caseText:
      'In 1999, NASA lost the Mars Climate Orbiter. Ground software built by one team reported thruster impulse in pound-force seconds, while the navigation software expected newton-seconds. Both were plain numbers, so nothing flagged the mismatch, and small trajectory errors accumulated over months. Here each unit is its own type, so passing one where the other is expected is a compile error, and the only bridge is an adapter that is proved to respect how navigation combines burns.',
    sources: [{ label: 'Mars Climate Orbiter (Wikipedia)', url: 'https://en.wikipedia.org/wiki/Mars_Climate_Orbiter' }],
    oopSketch: `class ImpulseAdapter implements NewtonImpulseSource {
  private final LbfImpulseSource legacy;
  public double newtonSeconds() {
    return legacy.poundForceSeconds() * 4.448222;
  }
}
// but nav code still accepts any double`,
    proves: [
      'Navigation functions only accept newton-seconds. Pound-force seconds are rejected by the compiler.',
      'Converting each burn and then summing equals summing first and then converting, for any list of burns.',
      'The adapter never maps two different readings to the same value.',
    ],
    limits: [
      'The conversion factor is a definition you must review. A wrong constant would be proved “correct”.',
      'Values use exact integer sub-units. Floating-point rounding is out of scope.',
    ],
    related: ['factory-method', 'facade', 'bridge'],
    file: 'Adapter',
  },
  {
    slug: 'bridge',
    oopName: 'Bridge',
    category: 'Structural',
    leanForm: 'Two independent parameters',
    verdict: 'feature',
    metapatterns: ['pass-the-function'],
    caseTitle: 'Telemetry exporters',
    caseText:
      'OpenTelemetry separates what you measure from where it is sent: the same metrics can be exported as Prometheus text lines or as OTLP records. That is the Bridge pattern, with a sampling policy on one side and a wire format on the other, each varying independently. Here each exporter must prove its decoder undoes its encoder, and one theorem shows that every pairing of policy and backend delivers exactly the selected metrics.',
    sources: [{ label: 'OpenTelemetry: MetricExporter', url: 'https://opentelemetry.io/docs/specs/otel/metrics/sdk/#metricexporter' }],
    oopSketch: `abstract class Pipeline {
  protected Exporter exporter;      // the bridge
  abstract boolean keep(Metric m);
  void flush(List<Metric> ms) { ... exporter.encode(m) ... }
}
class ErrorsOnly extends Pipeline { ... }
class PrometheusExporter implements Exporter { ... }`,
    proves: [
      'For any pipeline and any exporter, decoding what the backend received gives exactly the metrics the pipeline selected, in order.',
    ],
    limits: [
      'Delivery over the network (batching, retries, drops) is not modeled.',
    ],
    related: ['strategy', 'adapter', 'abstract-factory'],
    file: 'Bridge',
  },
  {
    slug: 'composite',
    oopName: 'Composite',
    category: 'Structural',
    leanForm: 'Recursive inductive type',
    verdict: 'feature',
    metapatterns: ['fold', 'slow-spec'],
    caseTitle: 'Cloud cost rollup',
    caseText:
      'AWS Organizations nests accounts inside organizational units, and GCP and Azure have similar hierarchies. Finance wants the monthly total for any subtree, and it must equal the sum of every account’s bill, with no account dropped or counted twice. The tree is one inductive type. The spec flattens it to a list of bills and adds them up. The fast rollup does one pass, and a proof shows both always agree.',
    sources: [{ label: 'AWS Organizations: organizational units', url: 'https://docs.aws.amazon.com/organizations/latest/userguide/orgs_manage_ous.html' }],
    oopSketch: `interface CostNode { long total(); }
class Account implements CostNode { long total() { return cents; } }
class Unit implements CostNode {
  List<CostNode> children;
  long total() { return children.stream().mapToLong(CostNode::total).sum(); }
}`,
    proves: [
      'The one-pass rollup equals the sum of all leaf bills, for every possible tree.',
    ],
    limits: [
      'It assumes the hierarchy is a tree. If an account could appear under two units, the model must change.',
    ],
    related: ['visitor', 'iterator', 'interpreter'],
    file: 'Composite',
  },
  {
    slug: 'decorator',
    oopName: 'Decorator',
    category: 'Structural',
    leanForm: 'Higher-order wrapper',
    verdict: 'feature',
    metapatterns: ['pass-the-function', 'prove-the-step'],
    caseTitle: 'Retry middleware',
    caseText:
      'Every cloud SDK wraps calls in retry logic, and retries are where small failures become outages: retrying a 400 that will never succeed, or retrying without a cap and turning a brownout into a retry storm. AWS’s guidance on timeouts and retries discusses exactly this. Here the decorator is a function that takes a call and returns a call, with three properties proved: invisible on success, immediate stop on non-retryable errors, and a hard bound on attempts.',
    sources: [{ label: 'Amazon Builders’ Library: timeouts, retries and backoff', url: 'https://aws.amazon.com/builders-library/timeouts-retries-and-backoff-with-jitter/' }],
    oopSketch: `class RetryingClient implements ApiClient {
  private final ApiClient inner;
  public Response call(Request r) {
    for (int i = 0; ; i++) {
      try { return inner.call(r); }
      catch (ApiException e) { if (i >= max) throw e; }   // retries a 400?
    }
  }
}`,
    proves: [
      'If the first attempt succeeds, the decorated call returns the same result after exactly one call.',
      'A non-retryable error is returned immediately, after one call.',
      'The decorated call never makes more than maxRetries + 1 calls.',
    ],
    limits: [
      'Backoff timing and jitter are not modeled. They need a model of time.',
      'It does not prove the wrapped operation is idempotent. That is a property of the server.',
    ],
    related: ['proxy', 'chain-of-responsibility', 'template-method'],
    file: 'Decorator',
  },
  {
    slug: 'facade',
    oopName: 'Facade',
    category: 'Structural',
    leanForm: 'One function over a module',
    verdict: 'feature',
    metapatterns: ['pass-the-function'],
    caseTitle: 'A checkout SDK',
    caseText:
      'Hosted checkout products such as Stripe Checkout hide a catalog, discounts and tax behind one call. In Lean, a facade is just a function that composes the subsystems, so the pattern itself has little to verify. What is worth proving is that the composed answer is internally consistent: the discount never exceeds the subtotal, the total is subtotal minus discount plus tax, and an unknown item means no quote at all.',
    sources: [{ label: 'Stripe Checkout', url: 'https://docs.stripe.com/payments/checkout' }],
    oopSketch: `class CheckoutFacade {
  private Catalog catalog; private Discounts discounts; private Tax tax;
  Quote quote(Cart cart, String code) {
    long sub = catalog.subtotal(cart);
    long disc = discounts.apply(sub, code);
    return new Quote(sub, disc, tax.on(sub - disc));
  }
}`,
    proves: [
      'Every quote has discount ≤ subtotal and total = subtotal − discount + tax.',
      'A cart with an unknown SKU never produces a quote.',
    ],
    limits: [
      'The tax and discount rules are toy stand-ins. Real tax rules are their own verification project.',
    ],
    related: ['adapter', 'singleton', 'mediator'],
    file: 'Facade',
  },
  {
    slug: 'flyweight',
    oopName: 'Flyweight',
    category: 'Structural',
    leanForm: 'Shared lookup table',
    verdict: 'different',
    metapatterns: ['slow-spec', 'immutability'],
    caseTitle: 'Sales-tax rates at checkout',
    caseText:
      'Sales-tax rates depend on the shipping jurisdiction, and computing one from the full rule set is slow, so checkout services build a rate table once and share it across every request. The original GoF intent of saving memory by sharing objects is already free in Lean, since immutable values are shared by reference. The part that can go wrong is the cache: here the table is proved never to return a rate the rules would not, on a hit or a miss.',
    sources: [{ label: 'Stripe Tax', url: 'https://docs.stripe.com/tax' }],
    oopSketch: `class TaxRateFactory {
  private static final Map<String, TaxRate> pool = new HashMap<>();
  static TaxRate get(String zip) {
    return pool.computeIfAbsent(zip, z -> RuleEngine.rate(z));
  }
}`,
    proves: [
      'Any rate the table returns equals the rule engine’s rate.',
      'Every postal code the table was built from is a hit.',
      'Checkout always charges the rule engine’s rate, whether the table hits or misses.',
    ],
    limits: [
      'Rules are assumed fixed. When tax law changes, the table must be rebuilt, and staleness is out of scope.',
    ],
    related: ['proxy', 'singleton', 'prototype'],
    file: 'Flyweight',
  },
  {
    slug: 'proxy',
    oopName: 'Proxy',
    category: 'Structural',
    leanForm: 'Same-type wrapper with state',
    verdict: 'different',
    metapatterns: ['prove-the-step', 'slow-spec'],
    caseTitle: 'Read-through cache',
    caseText:
      'Most web stacks put a cache such as Redis or Memcached in front of a slower service, and callers should never be able to tell whether a price came from the cache or the backend. The caching proxy translates directly, and its cache is threaded through each call as a value. Remote and protection proxies are really about effects and identity, which the pure core does not have. Here the proof follows the cache as it changes across a stream of reads.',
    sources: [{ label: 'AWS: caching best practices', url: 'https://aws.amazon.com/caching/best-practices/' }],
    oopSketch: `class CachingPriceService implements PriceService {
  private final PriceService backend;
  private final Map<String, Long> cache = new HashMap<>();
  public long price(String sku) {
    return cache.computeIfAbsent(sku, backend::price);
  }
}`,
    proves: [
      'Every entry in the cache always agrees with the backend.',
      'Through the proxy, any stream of reads returns exactly what direct backend calls would.',
    ],
    limits: [
      'The backend is treated as unchanging. Cache invalidation is not modeled, and it is the hard part in real systems.',
    ],
    related: ['flyweight', 'decorator', 'facade'],
    file: 'Proxy',
  },

  // ───────────────────────── Behavioral ─────────────────────────
  {
    slug: 'chain-of-responsibility',
    oopName: 'Chain of Responsibility',
    category: 'Behavioral',
    leanForm: 'List of handlers; first answer wins',
    verdict: 'feature',
    metapatterns: ['behavior-as-data', 'slow-spec'],
    caseTitle: 'Payment risk checks',
    caseText:
      'Card processors run a chain of risk checks before approving a charge (Stripe Radar rules are one example): too many attempts, an unusually large amount, a card country that does not match the IP. Risk teams think in decision tables, but engineers ship a pipeline of handlers. The theorem says the pipeline and the table agree on every possible transaction, so reordering or editing handlers cannot silently change who gets approved without breaking the proof.',
    sources: [{ label: 'Stripe Radar: rules', url: 'https://docs.stripe.com/radar/rules' }],
    oopSketch: `abstract class RiskHandler {
  protected RiskHandler next;
  Decision handle(Txn t) {
    return next == null ? Decision.APPROVE : next.handle(t);
  }
}
class VelocityCheck extends RiskHandler { ... }`,
    proves: [
      'The handler pipeline returns the same decision as the written decision table, for every transaction.',
      'In any chain, a handler placed first that decides takes priority.',
    ],
    limits: [
      'The decision table is the spec. If the thresholds are wrong for your business, the proof will not tell you.',
    ],
    related: ['decorator', 'command', 'strategy'],
    file: 'ChainOfResponsibility',
  },
  {
    slug: 'command',
    oopName: 'Command',
    category: 'Behavioral',
    leanForm: 'Command data type + apply',
    verdict: 'feature',
    metapatterns: ['behavior-as-data', 'prove-the-step'],
    caseTitle: 'The 2017 AWS S3 outage',
    caseText:
      'In February 2017, an engineer debugging S3 in us-east-1 ran a playbook command to remove a small number of servers, entered one input incorrectly, and removed a much larger set, including servers that core S3 subsystems needed. AWS’s summary says they changed the tool to remove capacity more slowly and to block any removal that would take a subsystem below its minimum. Here commands are values, the guard is part of running them, and a theorem shows that no log of commands, of any length, can take the fleet below its minimum.',
    sources: [{ label: 'AWS: summary of the Amazon S3 service disruption', url: 'https://aws.amazon.com/message/41926/' }],
    oopSketch: `interface Command { void execute(); void undo(); }
class RemoveServers implements Command {
  int n;
  public void execute() { fleet.remove(n); }   // no minimum check
  public void undo()    { fleet.add(n); }
}`,
    proves: [
      'A checked command never takes the fleet below its minimum capacity.',
      'Replaying any log of commands keeps the fleet at or above the minimum.',
      'Undoing an allowed command restores the fleet exactly.',
    ],
    limits: [
      'One fleet with one minimum is modeled. The real incident involved several dependent subsystems.',
      'It proves the guard works. It cannot prove the minimum value itself was set correctly.',
    ],
    related: ['memento', 'state', 'interpreter'],
    file: 'Command',
  },
  {
    slug: 'interpreter',
    oopName: 'Interpreter',
    category: 'Behavioral',
    leanForm: 'Inductive AST + eval',
    verdict: 'feature',
    metapatterns: ['behavior-as-data', 'fold', 'slow-spec'],
    caseTitle: 'Authorization policies (modeled on Cedar)',
    caseText:
      'Cedar is the authorization policy language used by Amazon Verified Permissions, and its reference specification is written in Lean. Policies are syntax trees that are evaluated against a request, with deny by default and forbid overriding permit. Engines simplify policies before evaluating them, and an optimizer bug there could silently turn a deny into an allow. Here the optimizer is proved to preserve the meaning of every condition, and therefore every authorization decision.',
    sources: [
      { label: 'Cedar policy language', url: 'https://www.cedarpolicy.com/' },
      { label: 'cedar-spec: the Lean specification', url: 'https://github.com/cedar-policy/cedar-spec' },
    ],
    oopSketch: `interface Cond { boolean eval(Request r); }
class And implements Cond {
  Cond left, right;
  public boolean eval(Request r) { return left.eval(r) && right.eval(r); }
}
class Optimizer { Cond simplify(Cond c) { ... } }   // trusted by hope`,
    proves: [
      'Optimizing a condition never changes what it evaluates to, for every request.',
      'Optimizing every policy never flips an authorization decision.',
      'With no permit policies, every request is denied.',
    ],
    limits: [
      'This is a small fragment of the language. The real Cedar specification covers far more.',
    ],
    related: ['composite', 'visitor', 'command'],
    file: 'Interpreter',
  },
  {
    slug: 'iterator',
    oopName: 'Iterator',
    category: 'Behavioral',
    leanForm: 'Cursor function + fold',
    verdict: 'feature',
    metapatterns: ['fold', 'slow-spec'],
    caseTitle: 'Cursor-based API pagination',
    caseText:
      'Stripe, GitHub and Slack all page through large result sets with a cursor: ask for a page, receive a cursor, ask again. Off-by-one cursors are a classic bug that skips or repeats a record at every page boundary, and they rarely show up in tests that fit on one page. Here the server returns pages from a cursor, the client follows cursors until there are none, and a theorem shows the concatenated pages equal the full dataset.',
    sources: [{ label: 'Stripe API: pagination', url: 'https://docs.stripe.com/api/pagination' }],
    oopSketch: `class PageIterator implements Iterator<Customer> {
  String cursor = null;
  public boolean hasNext() { ... }
  public Customer next() {
    // fetch page at cursor, advance cursor ... by how much?
  }
}`,
    proves: [
      'Following cursors returns exactly the remaining records, in order, with nothing skipped or repeated, given enough requests.',
    ],
    limits: [
      'The dataset is assumed not to change between requests. Inserts during pagination are out of scope.',
      'The request budget must cover the dataset. That bound is part of the theorem.',
    ],
    related: ['composite', 'visitor', 'observer'],
    file: 'Iterator',
  },
  {
    slug: 'mediator',
    oopName: 'Mediator',
    category: 'Behavioral',
    leanForm: 'Central reducer',
    verdict: 'different',
    metapatterns: ['prove-the-step', 'behavior-as-data'],
    caseTitle: 'Flash-sale checkout',
    caseText:
      'During a flash sale, cart, inventory and payment have to coordinate, and the expensive bug is overselling: confirming more units than exist. A Mediator object routes calls between components. The functional answer is a different design: every message passes through one pure reducer from message and state to new state, as in Redux or the Elm architecture. Proving one step keeps the no-oversell invariant then covers every interleaving of messages.',
    sources: [{ label: 'Redux: reducers', url: 'https://redux.js.org/tutorials/fundamentals/part-3-state-actions-reducers' }],
    oopSketch: `class CheckoutMediator {
  Cart cart; Inventory inv; Payments pay;
  void notify(Component sender, String event) {
    if (event.equals("addToCart")) inv.reserve(...);
    if (event.equals("paid")) inv.confirm(...);
  }
}`,
    proves: [
      'Every message keeps reserved + sold ≤ stock.',
      'Any sequence of messages, in any order, keeps the guarantee.',
    ],
    limits: [
      'A single reducer processes messages one at a time. Distributed inventory across regions needs a different model.',
    ],
    related: ['state', 'observer', 'command'],
    file: 'Mediator',
  },
  {
    slug: 'memento',
    oopName: 'Memento',
    category: 'Behavioral',
    leanForm: 'Keep the old value',
    verdict: 'dissolves',
    metapatterns: ['immutability'],
    caseTitle: 'Undo in an editor',
    caseText:
      'Every editor needs undo. Memento exists so an object can hand out a snapshot of its private state without exposing its internals. With immutable values the previous document already is the snapshot, so undo becomes a stack of earlier values and the encapsulation problem never arises. Collaborative editors such as Figma have much harder undo problems, but those come from multiple users, not from snapshotting.',
    sources: [{ label: 'Figma: how multiplayer technology works', url: 'https://www.figma.com/blog/how-figmas-multiplayer-technology-works/' }],
    oopSketch: `class Editor {
  private Doc doc;
  Memento save()          { return new Memento(doc.deepCopy()); }
  void restore(Memento m) { doc = m.state(); }
}`,
    proves: [
      'Undo after edit returns exactly the previous editor. The proof is rfl: it holds by definition.',
    ],
    limits: [
      'Single-user undo only. Multi-user undo is a different problem.',
    ],
    related: ['command', 'prototype', 'state'],
    file: 'Memento',
  },
  {
    slug: 'observer',
    oopName: 'Observer',
    category: 'Behavioral',
    leanForm: 'Per-subscriber outboxes',
    verdict: 'different',
    metapatterns: ['fold', 'prove-the-step'],
    caseTitle: 'Webhook delivery',
    caseText:
      'Stripe, GitHub and Shopify notify subscribers through webhooks, and each subscriber registers for some event types. In OOP, the subject mutates and calls notify on each observer. In pure code there is nothing to mutate, so the design changes: a dispatcher turns a stream of events into one outbox per subscriber. The guarantee subscribers care about is that they receive every event they subscribed to, exactly once, in the order it happened.',
    sources: [{ label: 'Stripe: webhooks', url: 'https://docs.stripe.com/webhooks' }],
    oopSketch: `class EventBus {
  List<Subscriber> subs = new ArrayList<>();
  void publish(Event e) {
    for (Subscriber s : subs) if (s.wants(e.kind)) s.onEvent(e);
  }
}`,
    proves: [
      'Each subscriber’s outbox holds exactly the events it wants, in the original order, each exactly once.',
    ],
    limits: [
      'Network delivery, retries and acknowledgements are not modeled. Real webhook systems deliver at least once.',
    ],
    related: ['mediator', 'iterator', 'chain-of-responsibility'],
    file: 'Observer',
  },
  {
    slug: 'state',
    oopName: 'State',
    category: 'Behavioral',
    leanForm: 'Status type + transition function',
    verdict: 'feature',
    metapatterns: ['prove-the-step', 'unbuildable'],
    caseTitle: 'Order lifecycle',
    caseText:
      'An e-commerce order moves from placed to paid to shipped, with refunds and cancellations along the way, as in Shopify’s order model. The expensive bugs are illegal transitions: shipping an unpaid order, or refunding twice when a refund request is retried. Here each transition is a case of one function that returns none for illegal moves, and one proof that each step keeps the refund total within the amount paid covers every possible sequence of events.',
    sources: [{ label: 'Shopify Admin API: Order', url: 'https://shopify.dev/docs/api/admin-rest/latest/resources/order' }],
    oopSketch: `interface OrderState { OrderState ship(Order o); OrderState refund(Order o, long c); }
class Paid implements OrderState {
  public OrderState refund(Order o, long c) {
    o.refunded += c;      // no check against o.paid
    return this;
  }
}`,
    proves: [
      'Every legal transition keeps refunded ≤ paid.',
      'No sequence of events, of any length, can over-refund an order.',
      'An order can only be shipped from the paid state.',
    ],
    limits: [
      'Illegal events are ignored here. A real system should log or reject them visibly.',
    ],
    related: ['command', 'mediator', 'memento'],
    file: 'State',
  },
  {
    slug: 'strategy',
    oopName: 'Strategy',
    category: 'Behavioral',
    leanForm: 'Function parameter + its proof',
    verdict: 'feature',
    metapatterns: ['pass-the-function', 'unbuildable', 'slow-spec'],
    caseTitle: 'TimSort, found broken by formal verification',
    caseText:
      'TimSort is the default sort for objects in Java and the sort behind Python. In 2015, researchers attempting to formally verify Java’s implementation with the KeY tool found that one of its internal invariants did not always hold, and that Java’s version could crash with an exception on certain large inputs. Here a sort strategy is a function packaged with proofs that its output is sorted and a permutation of its input, so a strategy without those proofs cannot be plugged in at all.',
    sources: [{ label: 'Timsort: formal verification (Wikipedia)', url: 'https://en.wikipedia.org/wiki/Timsort#Formal_verification' }],
    oopSketch: `interface SortStrategy { List<Long> sort(List<Long> xs); }
class InsertionSort implements SortStrategy { ... }
class MergeSort implements SortStrategy { ... }

List<Long> sortLedger(SortStrategy s, List<Long> ts) { return s.sort(ts); }`,
    proves: [
      'Every SortStrategy returns a sorted list.',
      'Every SortStrategy returns a permutation of its input: nothing added, dropped or duplicated.',
      'Code using a strategy inherits both guarantees without knowing which strategy it got.',
    ],
    limits: [
      'Running time is not part of the spec. A correct but slow strategy satisfies it.',
    ],
    related: ['template-method', 'bridge', 'decorator'],
    file: 'Strategy',
  },
  {
    slug: 'template-method',
    oopName: 'Template Method',
    category: 'Behavioral',
    leanForm: 'Higher-order function with hooks',
    verdict: 'feature',
    metapatterns: ['pass-the-function'],
    caseTitle: 'ETL job skeletons',
    caseText:
      'Data platforms such as Airflow give every job the same skeleton: extract records, transform each one, load the good ones and report the rest, with teams supplying their own hooks. The failure everyone fears is records that silently vanish, neither loaded nor reported as rejected. Here the skeleton is a function whose hooks are arguments, and one theorem shows its bookkeeping balances for every possible pair of hooks.',
    sources: [{ label: 'Apache Airflow: DAGs', url: 'https://airflow.apache.org/docs/apache-airflow/stable/core-concepts/dags.html' }],
    oopSketch: `abstract class EtlJob<Raw, Row> {
  abstract List<Raw> extract();
  abstract Optional<Row> transform(Raw r);
  final Report run() { ... }   // the template method
}`,
    proves: [
      'For any hooks, loaded + rejected = extracted. No record is silently lost.',
    ],
    limits: [
      'Whether a rejected record should have been accepted depends on the hook. That is the team’s spec, not the skeleton’s.',
    ],
    related: ['strategy', 'decorator', 'iterator'],
    file: 'TemplateMethod',
  },
  {
    slug: 'visitor',
    oopName: 'Visitor',
    category: 'Behavioral',
    leanForm: 'Pattern match / generic fold',
    verdict: 'feature',
    metapatterns: ['fold', 'slow-spec'],
    caseTitle: 'SQL lint and analysis passes',
    caseText:
      'SQL linters such as SQLFluff and query planners run many passes over the same syntax tree: which columns are read, how large an expression is, whether a rule is broken. In Java each pass becomes a Visitor class with double dispatch. In Lean each pass is either a direct recursive function or a record of handlers given to one shared fold, and the two forms are proved equal for every query.',
    sources: [{ label: 'SQLFluff', url: 'https://docs.sqlfluff.com/' }],
    oopSketch: `interface SqlVisitor<R> {
  R visitColumn(Column c); R visitNumber(Num n);
  R visitAdd(Add a); R visitEq(Eq e); R visitAnd(And a);
}
abstract class SqlExpr { abstract <R> R accept(SqlVisitor<R> v); }`,
    proves: [
      'The column-collecting visitor equals the direct recursive pass on every expression.',
      'The node-counting visitor equals the direct recursive pass on every expression.',
    ],
    limits: [
      'Adding a node type means updating every pass. Lean’s exhaustiveness check makes that a compile error rather than a runtime surprise.',
    ],
    related: ['composite', 'interpreter', 'iterator'],
    file: 'Visitor',
  },
]

export const patternBySlug = Object.fromEntries(patterns.map((p) => [p.slug, p])) as Record<string, Pattern>

export const categories: Category[] = ['Creational', 'Structural', 'Behavioral']
