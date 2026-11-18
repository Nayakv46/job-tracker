data "aws_caller_identity" "current" {}
data "aws_partition" "current" {}

locals {
  name            = "${var.project}-${var.environment}" # job-tracker-dev
  app_namespace   = var.project
  deployers_group = "${var.project}-deployers"

  # Built from the name instead of module.eks.cluster_arn: the GitHub role needs the
  # ARN and the cluster needs the role's access entry, which would be a cycle
  cluster_arn = "arn:${data.aws_partition.current.partition}:eks:${var.region}:${data.aws_caller_identity.current.account_id}:cluster/${local.name}"
}

module "vpc" {
  source = "../../modules/vpc"

  name               = local.name
  cidr               = var.vpc_cidr
  az_count           = 2
  single_nat_gateway = true
}

module "eks" {
  source = "../../modules/eks"

  name                         = local.name
  kubernetes_version           = var.kubernetes_version
  vpc_id                       = module.vpc.vpc_id
  subnet_ids                   = module.vpc.private_subnet_ids
  endpoint_public_access_cidrs = var.cluster_endpoint_public_access_cidrs

  node_instance_types = var.node_instance_types
  node_capacity_type  = var.node_capacity_type

  access_entries = merge(
    {
      # GitHub Actions: no access policy, only the RBAC group bound in the app namespace
      github-actions = {
        principal_arn     = module.github_oidc.role_arn
        kubernetes_groups = [local.deployers_group]
      }
    },
    {
      for arn in var.cluster_admin_arns : arn => {
        principal_arn = arn
        policy_associations = {
          admin = {
            policy_arn   = "arn:${data.aws_partition.current.partition}:eks::aws:cluster-access-policy/AmazonEKSClusterAdminPolicy"
            access_scope = { type = "cluster" }
          }
        }
      }
    },
  )
}

module "rds" {
  source = "../../modules/rds"

  identifier              = local.name
  vpc_id                  = module.vpc.vpc_id
  db_subnet_group_name    = module.vpc.database_subnet_group_name
  allowed_security_groups = { eks_nodes = module.eks.node_security_group_id }
  instance_class          = var.db_instance_class

  password         = ephemeral.random_password.db.result
  password_version = var.secrets_version

  # Dev: easy to tear down. Turn these around for anything long-lived.
  deletion_protection = false
  skip_final_snapshot = true
}

module "ecr" {
  source = "../../modules/ecr"

  prefix       = var.project
  repositories = ["api", "api-migrate", "web"]
  force_delete = true # dev: `terraform destroy` also removes the images
}

module "github_oidc" {
  source = "../../modules/github-oidc"

  role_name            = "${local.name}-github-actions"
  repository           = var.github_repository
  create_oidc_provider = var.create_github_oidc_provider
  ecr_repository_arns  = module.ecr.repository_arns
  eks_cluster_arn      = local.cluster_arn
}

module "k8s_platform" {
  source = "../../modules/k8s-platform"

  cluster_name         = module.eks.cluster_name
  region               = var.region
  vpc_id               = module.vpc.vpc_id
  app_namespace        = local.app_namespace
  deployers_group      = local.deployers_group
  secrets_manager_arns = [aws_secretsmanager_secret.api.arn]
}
