variable "region" {
  description = "AWS region of the state bucket"
  type        = string
  default     = "eu-central-1"
}

variable "project" {
  description = "Project name, used in the bucket name and tags"
  type        = string
  default     = "job-tracker"
}

variable "bucket_name" {
  description = "State bucket name. Defaults to <project>-tfstate-<account id>, which is globally unique"
  type        = string
  default     = null
}
