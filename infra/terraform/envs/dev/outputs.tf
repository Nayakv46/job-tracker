output "region" {
  value = var.region
}

output "cluster_name" {
  value = module.eks.cluster_name
}

output "configure_kubectl" {
  description = "Adds the cluster to your kubeconfig"
  value       = "aws eks update-kubeconfig --name ${module.eks.cluster_name} --region ${var.region}"
}

output "ecr_registry" {
  value = module.ecr.registry
}

output "ecr_repository_urls" {
  value = module.ecr.repository_urls
}

output "github_actions_role_arn" {
  value = module.github_oidc.role_arn
}

output "api_secret_name" {
  description = "Secrets Manager secret read by the External Secrets Operator"
  value       = aws_secretsmanager_secret.api.name
}

output "rds_address" {
  value = module.rds.address
}

output "app_namespace" {
  value = module.k8s_platform.app_namespace
}
