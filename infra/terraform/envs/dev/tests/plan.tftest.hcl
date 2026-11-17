# Offline plan of the whole environment with mocked providers: checks that the modules
# wire together and that the key settings hold, without AWS credentials.
#   terraform init -backend=false && terraform test

mock_provider "aws" {
  mock_data "aws_availability_zones" {
    defaults = {
      names = ["eu-central-1a", "eu-central-1b", "eu-central-1c"]
    }
  }

  mock_data "aws_caller_identity" {
    defaults = {
      account_id = "123456789012"
      arn        = "arn:aws:iam::123456789012:user/terraform"
    }
  }

  mock_data "aws_iam_session_context" {
    defaults = {
      issuer_arn = "arn:aws:iam::123456789012:user/terraform"
    }
  }

  mock_data "aws_partition" {
    defaults = {
      partition  = "aws"
      dns_suffix = "amazonaws.com"
    }
  }

  mock_data "aws_iam_policy_document" {
    defaults = {
      json = "{\"Version\":\"2012-10-17\",\"Statement\":[]}"
    }
  }

  mock_resource "aws_iam_role" {
    defaults = {
      arn = "arn:aws:iam::123456789012:role/mock"
    }
  }

  mock_resource "aws_eks_cluster" {
    defaults = {
      arn      = "arn:aws:eks:eu-central-1:123456789012:cluster/job-tracker-dev"
      endpoint = "https://mock.eks.amazonaws.com"
      certificate_authority = [{
        data = "bW9jaw=="
      }]
    }
  }

  mock_resource "aws_secretsmanager_secret" {
    defaults = {
      arn = "arn:aws:secretsmanager:eu-central-1:123456789012:secret:job-tracker-dev/api-AbCdEf"
    }
  }

  mock_resource "aws_ecr_repository" {
    defaults = {
      arn            = "arn:aws:ecr:eu-central-1:123456789012:repository/mock"
      repository_url = "123456789012.dkr.ecr.eu-central-1.amazonaws.com/mock"
    }
  }
}

mock_provider "helm" {}
mock_provider "kubernetes" {}

variables {
  github_repository = "example/job-tracker"
}

run "plan" {
  command = plan

  assert {
    condition     = module.rds.username == "job_tracker"
    error_message = "Unexpected database user"
  }

  assert {
    condition     = length(module.vpc.private_subnet_ids) == 2
    error_message = "Expected private subnets in two availability zones"
  }

  assert {
    condition     = aws_secretsmanager_secret_version.api.secret_string_wo_version == 1
    error_message = "The API secret must be written by version"
  }

  assert {
    condition     = output.configure_kubectl == "aws eks update-kubeconfig --name job-tracker-dev --region eu-central-1"
    error_message = "Unexpected cluster name or region"
  }
}

run "rejects_invalid_repository" {
  command = plan

  variables {
    github_repository = "not-a-repo"
  }

  expect_failures = [var.github_repository]
}
