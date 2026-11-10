/-
  Abstract Factory  →  a structure of functions (with laws)
  Industry case: multi-cloud provisioning, in the style of Terraform
  providers. A deployment needs a matching family of resources: a network,
  a VM, a bucket. Mixing families (an AWS VM attached to a GCP network) is a
  real class of deploy-time failure. Here a factory must prove every
  product it makes belongs to its own cloud, so mixed stacks can't happen.
-/
namespace AbstractFactory

-- ## Domain
inductive Cloud where
  | aws
  | gcp
  deriving DecidableEq, Repr

structure Network where
  cloud : Cloud
  id    : String
  deriving Repr

structure VirtualMachine where
  cloud     : Cloud
  id        : String
  networkId : String
  deriving Repr

structure Bucket where
  cloud : Cloud
  name  : String
  deriving Repr

-- ## Spec
-- The family-consistency laws live inside the factory type itself.
structure CloudFactory where
  cloud        : Cloud
  makeNetwork  : String → Network
  makeVm       : String → Network → VirtualMachine
  makeBucket   : String → Bucket
  network_ok   : ∀ (name : String), (makeNetwork name).cloud = cloud
  vm_ok        : ∀ (name : String) (net : Network), (makeVm name net).cloud = cloud
  bucket_ok    : ∀ (name : String), (makeBucket name).cloud = cloud

structure Stack where
  network : Network
  vm      : VirtualMachine
  bucket  : Bucket
  deriving Repr

def Consistent (s : Stack) : Prop :=
  s.vm.cloud = s.network.cloud ∧ s.bucket.cloud = s.network.cloud

-- ## Implementation
def awsFactory : CloudFactory :=
  { cloud := .aws,
    makeNetwork := fun name => { cloud := .aws, id := "vpc-" ++ name },
    makeVm := fun name net => { cloud := .aws, id := "i-" ++ name, networkId := net.id },
    makeBucket := fun name => { cloud := .aws, name := "s3://" ++ name },
    network_ok := by intro name; rfl,
    vm_ok := by intro name net; rfl,
    bucket_ok := by intro name; rfl }

def gcpFactory : CloudFactory :=
  { cloud := .gcp,
    makeNetwork := fun name => { cloud := .gcp, id := "projects/net/" ++ name },
    makeVm := fun name net => { cloud := .gcp, id := "instances/" ++ name, networkId := net.id },
    makeBucket := fun name => { cloud := .gcp, name := "gs://" ++ name },
    network_ok := by intro name; rfl,
    vm_ok := by intro name net; rfl,
    bucket_ok := by intro name; rfl }

-- Deployment code is written once, against the abstract factory.
def deploy (factory : CloudFactory) (app : String) : Stack :=
  let net := factory.makeNetwork app
  { network := net, vm := factory.makeVm app net, bucket := factory.makeBucket app }

-- ## Proof
-- Every stack from every factory is consistent, including factories
-- written next year for clouds that don't exist yet.
theorem deploy_consistent (factory : CloudFactory) (app : String) :
    Consistent (deploy factory app) := by
  unfold Consistent deploy
  simp only
  rw [factory.vm_ok, factory.bucket_ok, factory.network_ok]
  exact ⟨rfl, rfl⟩

-- ## Try it
#eval deploy awsFactory "checkout"
#eval deploy gcpFactory "checkout"

end AbstractFactory
