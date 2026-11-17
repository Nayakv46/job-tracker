variable "role_name" {
  type = string
}

variable "repository" {
  description = "GitHub repository as owner/name"
  type        = string

  validation {
    condition     = can(regex("^[^/]+/[^/]+$", var.repository))
    error_message = "repository must look like owner/name."
  }
}

variable "allowed_subjects" {
  description = "OIDC subject suffixes allowed to assume the role (after repo:<owner>/<name>:)"
  type        = list(string)
  default     = ["ref:refs/heads/main"]
}

variable "create_oidc_provider" {
  description = "Create the GitHub OIDC provider; set to false if the account already has one"
  type        = bool
  default     = true
}

variable "ecr_repository_arns" {
  type = list(string)
}

variable "eks_cluster_arn" {
  type = string
}
