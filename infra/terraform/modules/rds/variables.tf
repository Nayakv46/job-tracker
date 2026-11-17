variable "identifier" {
  description = "RDS instance identifier"
  type        = string
}

variable "vpc_id" {
  type = string
}

variable "db_subnet_group_name" {
  type = string
}

variable "allowed_security_groups" {
  description = "Security groups allowed to connect on 5432, keyed by a static name (e.g. { eks_nodes = sg-... })"
  type        = map(string)
}

variable "engine_version" {
  description = "PostgreSQL version; a major version (\"16\") gets the latest minor"
  type        = string
  default     = "16"
}

variable "instance_class" {
  type    = string
  default = "db.t4g.micro"
}

variable "allocated_storage" {
  description = "Initial storage in GiB"
  type        = number
  default     = 20
}

variable "max_allocated_storage" {
  description = "Storage autoscaling limit in GiB"
  type        = number
  default     = 50
}

variable "db_name" {
  type    = string
  default = "job_tracker"
}

variable "username" {
  type    = string
  default = "job_tracker"
}

variable "password" {
  description = "Master password (write-only, never stored in state)"
  type        = string
  sensitive   = true
  ephemeral   = true
}

variable "password_version" {
  description = "Increase to send a new password to RDS"
  type        = number
}

variable "multi_az" {
  type    = bool
  default = false
}

variable "backup_retention_period" {
  description = "Days of automated backups (0 disables them)"
  type        = number
  default     = 1
}

variable "deletion_protection" {
  type    = bool
  default = true
}

variable "skip_final_snapshot" {
  type    = bool
  default = false
}
