variable "rds_instance_name" {
  description = "Name for the RDS instance"
  type        = string
}

variable "rds_engine" {
  description = "Database engine type (MySQL, PostgreSQL, etc.)"
  type        = string
  default     = "MySQL"
}

variable "rds_engine_version" {
  description = "Database engine version"
  type        = string
  default     = "8.0"
}

variable "rds_instance_type" {
  description = "RDS instance type"
  type        = string
}

variable "rds_storage_size" {
  description = "Storage size in GB"
  type        = number
  default     = 20
}

variable "db_name" {
  description = "Name of the database to create"
  type        = string
}

variable "account_name" {
  description = "Database account username"
  type        = string
}

variable "account_password" {
  description = "Database account password"
  type        = string
  sensitive   = true
}

variable "vpc_id" {
  description = "VPC ID where the database will be deployed"
  type        = string
}

variable "vswitch_id" {
  description = "VSwitch ID where the database will be deployed"
  type        = string
}