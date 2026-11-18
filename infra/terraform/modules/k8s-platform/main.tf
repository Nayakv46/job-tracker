# Cluster-level pieces the app's Kustomize overlay relies on:
# - AWS Load Balancer Controller: turns the Ingress into an ALB
# - External Secrets Operator: copies the app secret from Secrets Manager into a Secret
# - the app namespace (restricted Pod Security Standard) and RBAC for the deploy role
# Both controllers get AWS permissions through EKS Pod Identity.

locals {
  lbc_service_account = "aws-load-balancer-controller"
  eso_namespace       = "external-secrets"
  eso_service_account = "external-secrets"
}

################################################################################
# AWS Load Balancer Controller
################################################################################

module "lbc_pod_identity" {
  source  = "terraform-aws-modules/eks-pod-identity/aws"
  version = "~> 2.11"

  name = "${var.cluster_name}-aws-lbc"

  attach_aws_lb_controller_policy = true

  associations = {
    this = {
      cluster_name    = var.cluster_name
      namespace       = "kube-system"
      service_account = local.lbc_service_account
    }
  }
}

resource "helm_release" "lbc" {
  name       = "aws-load-balancer-controller"
  repository = "https://aws.github.io/eks-charts"
  chart      = "aws-load-balancer-controller"
  version    = var.lbc_chart_version
  namespace  = "kube-system"

  values = [yamlencode({
    clusterName = var.cluster_name
    region      = var.region
    vpcId       = var.vpc_id
    serviceAccount = {
      name = local.lbc_service_account
    }
  })]

  depends_on = [module.lbc_pod_identity]
}

################################################################################
# External Secrets Operator
################################################################################

module "eso_pod_identity" {
  source  = "terraform-aws-modules/eks-pod-identity/aws"
  version = "~> 2.11"

  name = "${var.cluster_name}-external-secrets"

  # Read-only access to the listed secrets
  attach_external_secrets_policy        = true
  external_secrets_secrets_manager_arns = var.secrets_manager_arns

  associations = {
    this = {
      cluster_name    = var.cluster_name
      namespace       = local.eso_namespace
      service_account = local.eso_service_account
    }
  }
}

resource "helm_release" "eso" {
  name             = "external-secrets"
  repository       = "https://charts.external-secrets.io"
  chart            = "external-secrets"
  version          = var.eso_chart_version
  namespace        = local.eso_namespace
  create_namespace = true

  values = [yamlencode({
    serviceAccount = {
      name = local.eso_service_account
    }
  })]

  depends_on = [module.eso_pod_identity]
}

################################################################################
# App namespace and deploy permissions
################################################################################

resource "kubernetes_namespace_v1" "app" {
  metadata {
    name = var.app_namespace
    labels = {
      "pod-security.kubernetes.io/enforce" = "restricted"
      "pod-security.kubernetes.io/warn"    = "restricted"
    }
  }
}

# Members of the deployers group (mapped from IAM through an EKS access entry) get the
# built-in `edit` role in the app namespace only. External Secrets aggregates its
# ExternalSecret/SecretStore permissions into `edit`.
resource "kubernetes_role_binding_v1" "deployers" {
  metadata {
    name      = "deployers-edit"
    namespace = kubernetes_namespace_v1.app.metadata[0].name
  }

  role_ref {
    api_group = "rbac.authorization.k8s.io"
    kind      = "ClusterRole"
    name      = "edit"
  }

  subject {
    api_group = "rbac.authorization.k8s.io"
    kind      = "Group"
    name      = var.deployers_group
  }
}
