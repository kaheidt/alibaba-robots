output "connection_string" {
  description = "The connection string for the RDS instance"
  value       = alicloud_db_instance.roboverse_db.connection_string
}

output "port" {
  description = "The port of the RDS instance"
  value       = alicloud_db_instance.roboverse_db.port
}

output "database_name" {
  description = "The database name"
  value       = alicloud_db_database.roboverse_database.name
}

output "instance_id" {
  description = "The ID of the RDS instance"
  value       = alicloud_db_instance.roboverse_db.id
}