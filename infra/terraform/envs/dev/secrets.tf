# The API's secrets live in one Secrets Manager secret (JSON with DATABASE_URL,
# JWT_SECRET and REFRESH_SECRET). External Secrets copies it into the `api-secrets`
# Kubernetes Secret.
#
# The passwords are ephemeral values passed to write-only arguments, so they appear
# neither in the plan nor in the state. Terraform can't read them back to detect
# changes, so they are only (re)written when `secrets_version` changes: increase it to
# rotate everything (this also logs all users out, since the JWT secrets change).

ephemeral "random_password" "db" {
  length  = 32
  special = false # used in a URL
}

ephemeral "random_password" "jwt" {
  length  = 64
  special = false
}

ephemeral "random_password" "refresh" {
  length  = 64
  special = false
}

resource "aws_secretsmanager_secret" "api" {
  name        = "${local.name}/api"
  description = "Job Tracker API secrets (${var.environment})"

  # Dev: delete immediately so the name can be reused after a destroy
  recovery_window_in_days = 0
}

resource "aws_secretsmanager_secret_version" "api" {
  secret_id = aws_secretsmanager_secret.api.id

  secret_string_wo = jsonencode({
    # RDS enforces TLS (rds.force_ssl = 1)
    DATABASE_URL   = "postgresql://${module.rds.username}:${ephemeral.random_password.db.result}@${module.rds.address}:${module.rds.port}/${module.rds.db_name}?schema=public&sslmode=require"
    JWT_SECRET     = ephemeral.random_password.jwt.result
    REFRESH_SECRET = ephemeral.random_password.refresh.result
  })
  secret_string_wo_version = var.secrets_version
}
