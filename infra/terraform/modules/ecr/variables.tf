variable "prefix" {
  description = "Repository namespace, e.g. job-tracker -> job-tracker/api"
  type        = string
}

variable "repositories" {
  description = "Repository names under the prefix"
  type        = list(string)
}

variable "keep_images" {
  description = "Number of images kept per repository"
  type        = number
  default     = 20
}

variable "force_delete" {
  description = "Allow destroying repositories that still contain images"
  type        = bool
  default     = false
}
