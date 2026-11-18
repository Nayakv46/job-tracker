# EKS cluster with one managed node group in the private subnets.
# Workload AWS access uses EKS Pod Identity (the eks-pod-identity-agent addon),
# so no OIDC provider for IRSA is needed.

module "eks" {
  source  = "terraform-aws-modules/eks/aws"
  version = "~> 21.30"

  name               = var.name
  kubernetes_version = var.kubernetes_version

  vpc_id     = var.vpc_id
  subnet_ids = var.subnet_ids

  # kubectl from outside the VPC (laptop, GitHub Actions); restrict with endpoint_public_access_cidrs
  endpoint_public_access       = true
  endpoint_public_access_cidrs = var.endpoint_public_access_cidrs

  enable_irsa = false

  # The identity running Terraform gets cluster admin through an access entry
  enable_cluster_creator_admin_permissions = true
  access_entries                           = var.access_entries

  addons = {
    # Networking and Pod Identity must exist before nodes join
    vpc-cni = {
      before_compute = true
    }
    eks-pod-identity-agent = {
      before_compute = true
    }
    kube-proxy     = {}
    coredns        = {}
    metrics-server = {} # for the HPAs
  }

  eks_managed_node_groups = {
    default = {
      ami_type       = "AL2023_x86_64_STANDARD"
      instance_types = var.node_instance_types
      capacity_type  = var.node_capacity_type

      min_size     = var.node_min_size
      max_size     = var.node_max_size
      desired_size = var.node_desired_size
    }
  }
}
