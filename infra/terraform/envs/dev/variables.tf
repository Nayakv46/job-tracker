variable "region" {
  type    = string
  default = "eu-central-1"
}

variable "project" {
  type    = string
  default = "job-tracker"
}

variable "environment" {
  type    = string
  default = "dev"
}

variable "vpc_cidr" {
  type    = string
  default = "10.0.0.0/16"
}

variable "kubernetes_version" {
  description = "EKS Kubernetes version (`aws eks describe-cluster-versions --default-only`)"
  type        = string
  default     = "1.35"
}

variable "cluster_endpoint_public_access_cidrs" {
  description = "Who can reach the Kubernetes API, e.g. [\"203.0.113.10/32\"]. GitHub-hosted runners need 0.0.0.0/0"
  type        = list(string)
  default     = ["0.0.0.0/0"]
}

variable "cluster_admin_arns" {
  description = "Extra IAM principals (users/roles) that get cluster admin, besides the identity running Terraform"
  type        = list(string)
  default     = []
}

variable "node_instance_types" {
  description = "Accounts on the AWS free plan can only launch Free Tier eligible types, e.g. [\"c7i-flex.large\"]"
  type        = list(string)
  default     = ["t3.medium"]
}

variable "node_capacity_type" {
  description = "ON_DEMAND or SPOT (cheaper, can be interrupted)"
  type        = string
  default     = "ON_DEMAND"
}

variable "db_instance_class" {
  type    = string
  default = "db.t4g.micro"
}

variable "github_repository" {
  description = "GitHub repository whose workflows may deploy, as it appears in the OIDC subject: owner/name, or owner@ID/name@ID for repositories whose tokens carry immutable IDs"
  type        = string

  validation {
    condition     = can(regex("^[A-Za-z0-9-]+(@[0-9]+)?/[A-Za-z0-9._-]+(@[0-9]+)?$", var.github_repository))
    error_message = "github_repository must look like owner/name or owner@123/name@456."
  }
}

variable "create_github_oidc_provider" {
  description = "Set to false if the AWS account already has the GitHub OIDC provider"
  type        = bool
  default     = true
}

variable "secrets_version" {
  description = "Increase to generate and write new database and JWT secrets"
  type        = number
  default     = 1
}
