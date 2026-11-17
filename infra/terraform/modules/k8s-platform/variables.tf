variable "cluster_name" {
  type = string
}

variable "region" {
  type = string
}

variable "vpc_id" {
  type = string
}

variable "app_namespace" {
  description = "Namespace the app is deployed into"
  type        = string
}

variable "deployers_group" {
  description = "Kubernetes group that gets the edit role in the app namespace"
  type        = string
}

variable "secrets_manager_arns" {
  description = "Secrets the External Secrets Operator may read"
  type        = list(string)
}

variable "lbc_chart_version" {
  type    = string
  default = "3.6.3"
}

variable "eso_chart_version" {
  type    = string
  default = "2.15.0"
}
