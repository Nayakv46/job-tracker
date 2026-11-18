# VPC with public subnets (ALB, NAT), private subnets (EKS nodes) and isolated
# database subnets (RDS, no route to the internet).

data "aws_availability_zones" "available" {
  state = "available"

  filter {
    name   = "opt-in-status"
    values = ["opt-in-not-required"]
  }
}

locals {
  azs = slice(data.aws_availability_zones.available.names, 0, var.az_count)
}

module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "~> 6.8"

  name = var.name
  cidr = var.cidr
  azs  = local.azs

  # /20 per AZ for nodes (VPC CNI gives every pod a VPC IP), /24 for the rest
  private_subnets  = [for i in range(var.az_count) : cidrsubnet(var.cidr, 4, i)]
  public_subnets   = [for i in range(var.az_count) : cidrsubnet(var.cidr, 8, 48 + i)]
  database_subnets = [for i in range(var.az_count) : cidrsubnet(var.cidr, 8, 64 + i)]

  create_database_subnet_group = true

  enable_nat_gateway = true
  # One NAT gateway is cheaper; one per AZ survives an AZ outage
  single_nat_gateway     = var.single_nat_gateway
  one_nat_gateway_per_az = !var.single_nat_gateway

  enable_dns_hostnames = true
  enable_dns_support   = true

  # Subnet discovery for the AWS Load Balancer Controller
  public_subnet_tags = {
    "kubernetes.io/role/elb" = "1"
  }
  private_subnet_tags = {
    "kubernetes.io/role/internal-elb" = "1"
  }
}
