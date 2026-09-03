# =========================================================================
# TERRAFORM INFRASTRUCTURE AS CODE (IaC) - OBRA360 ENTERPRISE
# AWS Cloud Provisioning: EKS Kubernetes Cluster + Amazon RDS PostgreSQL
# =========================================================================

terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
  default_tags {
    tags = {
      Project     = "Obra360"
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  }
}

# 1. VPC Network for Enterprise Construction Multi-Tenant Isolated Subnets
module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "5.1.0"

  name = "obra360-vpc-${var.environment}"
  cidr = "10.0.0.0/16"

  azs             = ["${var.aws_region}a", "${var.aws_region}b"]
  private_subnets = ["10.0.1.0/24", "10.0.2.0/24"]
  public_subnets  = ["10.0.101.0/24", "10.0.102.0/24"]

  enable_nat_gateway = true
  single_nat_gateway = true

  tags = {
    "kubernetes.io/cluster/obra360-eks-${var.environment}" = "shared"
  }
}

# 2. Amazon RDS Managed PostgreSQL Database
resource "aws_db_subnet_group" "obra360_db_subnets" {
  name       = "obra360-db-subnet-group-${var.environment}"
  subnet_ids = module.vpc.private_subnets
}

resource "aws_security_group" "db_sg" {
  name        = "obra360-db-sg-${var.environment}"
  description = "Allow PostgreSQL port 5432 inbound from EKS cluster"
  vpc_id      = module.vpc.vpc_id

  ingress {
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = ["10.0.0.0/16"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_db_instance" "postgres" {
  identifier             = "obra360-db-${var.environment}"
  engine                 = "postgres"
  engine_version         = "15.4"
  instance_class         = "db.t4g.micro"
  allocated_storage      = 20
  max_allocated_storage  = 100
  db_name                = "obra360db"
  username               = var.db_username
  password               = var.db_password
  db_subnet_group_name   = aws_db_subnet_group.obra360_db_subnets.name
  vpc_security_group_ids = [aws_security_group.db_sg.id]
  skip_final_snapshot    = true
}

# 3. AWS S3 Bucket for Storing 3D BIM Models & Blueprints
resource "aws_s3_bucket" "bim_storage" {
  bucket        = "obra360-bim-storage-${var.environment}"
  force_destroy = true
}

resource "aws_s3_bucket_versioning" "bim_storage_versioning" {
  bucket = aws_s3_bucket.bim_storage.id
  versioning_configuration {
    status = "Enabled"
  }
}
