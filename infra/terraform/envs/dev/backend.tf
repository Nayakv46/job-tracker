# Remote state in the bucket created by ../../bootstrap, with S3 native locking.
# The bucket name is account-specific, so it comes from backend.hcl:
#   terraform init -backend-config=backend.hcl
terraform {
  backend "s3" {
    key          = "envs/dev/terraform.tfstate"
    encrypt      = true
    use_lockfile = true
  }
}
