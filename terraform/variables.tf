variable "region" {
  description = "The Alibaba Cloud region to deploy resources"
  type        = string
  default     = "us-west-1"  # Updated to match your bucket's region
}

variable "access_key" {
  description = "Alibaba Cloud Access Key ID"
  type        = string
  sensitive   = true
}

variable "secret_key" {
  description = "Alibaba Cloud Access Key Secret"
  type        = string
  sensitive   = true
}

variable "project_name" {
  description = "Project name used for naming resources"
  type        = string
  default     = "roboverse"
}

variable "oss_bucket_name" {
  description = "Name of the existing OSS bucket"
  type        = string
}

variable "oss_bucket_endpoint" {
  description = "Name of the existing OSS bucket"
  type        = string
}

variable "db_account_name" {
  description = "Username for the ApsaraDB instance"
  type        = string
  default     = "roboverse_admin"
}

variable "db_account_password" {
  description = "Password for the ApsaraDB instance"
  type        = string
  sensitive   = true
}

variable "ecs_image_id" {
  description = "The ID of the ECS image to use"
  type        = string
  default     = "ubuntu_22_04_x64_20G_alibase_20231221.vhd"  # Ubuntu 22.04 with Docker pre-installed
}

variable "ecs_instance_type" {
  description = "The type of ECS instance to launch"
  type        = string
  default     = "ecs.t6-c1m1.large"  # 2 vCPU, 2 GB memory
}

variable "min_instance_count" {
  description = "Minimum number of instances in the auto-scaling group"
  type        = number
  default     = 1
}

variable "max_instance_count" {
  description = "Maximum number of instances in the auto-scaling group"
  type        = number
  default     = 3
}

variable "cdn_domain_suffix" {
  description = "Domain suffix for the CDN domain name"
  type        = string
  default     = "alicdn.com"  # Default Alibaba CDN domain suffix
}

variable "custom_domain" {
  description = "Custom domain for CDN (must be one you own or can validate)"
  type        = string
  default     = "cdn-assets.yourdomain.com"  # Replace this with your actual domain
}

variable "cdn_domain_prefix" {
  description = "Prefix for the CDN domain name used with Alibaba's free domain"
  type        = string
  default     = "roboverse-cdn"  # Will create roboverse-cdn.us-west-1.alicdn.com
}