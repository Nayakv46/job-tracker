variable "role_name" {
  type = string
}

variable "repository" {
  description = "GitHub repository as it appears in the OIDC subject: owner/name, or owner@ID/name@ID when the tokens carry immutable IDs"
  type        = string

  validation {
    condition     = can(regex("^[A-Za-z0-9-]+(@[0-9]+)?/[A-Za-z0-9._-]+(@[0-9]+)?$", var.repository))
    error_message = "repository must look like owner/name or owner@123/name@456."
  }
}

variable "allowed_subjects" {
  description = "OIDC subject suffixes allowed to assume the role (after repo:<repository>:)"
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
