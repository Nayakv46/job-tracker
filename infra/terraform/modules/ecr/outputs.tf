output "repository_urls" {
  description = "Repository URL per name"
  value       = { for name, repo in aws_ecr_repository.this : name => repo.repository_url }
}

output "repository_arns" {
  value = [for repo in aws_ecr_repository.this : repo.arn]
}

output "registry" {
  description = "Registry host (<account>.dkr.ecr.<region>.amazonaws.com)"
  value       = try(split("/", values(aws_ecr_repository.this)[0].repository_url)[0], null)
}
