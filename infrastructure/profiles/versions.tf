terraform {
  required_version = ">= 1.6.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
  }
}

provider "aws" {
  # Fixed: the app's AWS clients and deploy.yml use us-east-1 too.
  region = "us-east-1"
  default_tags {
    tags = { Project = "FindMyStudents", ManagedBy = "Terraform", Component = "profiles" }
  }
}
