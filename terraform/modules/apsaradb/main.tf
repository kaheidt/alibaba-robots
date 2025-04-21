resource "alicloud_db_instance" "roboverse_db" {
  engine                = var.rds_engine
  engine_version        = var.rds_engine_version
  instance_type         = var.rds_instance_type
  instance_storage      = var.rds_storage_size
  instance_name         = var.rds_instance_name
  instance_charge_type  = "Postpaid"  # Pay-as-you-go
  vswitch_id            = var.vswitch_id
  security_ips          = ["0.0.0.0/0"]  # In production, limit this to specific IPs
}

resource "alicloud_db_database" "roboverse_database" {
  instance_id = alicloud_db_instance.roboverse_db.id
  name        = var.db_name
  character_set = "utf8mb4"
}

resource "alicloud_db_account" "roboverse_db_account" {
  db_instance_id    = alicloud_db_instance.roboverse_db.id  # Changed from instance_id
  account_name      = var.account_name  # Changed from name
  account_password  = var.account_password  # Changed from password
  account_type      = "Normal"  # Changed from type
}

# Keep the privilege resource but update it to use DMLOnly
resource "alicloud_db_account_privilege" "roboverse_account_privilege" {
  instance_id   = alicloud_db_instance.roboverse_db.id
  account_name  = alicloud_db_account.roboverse_db_account.account_name
  privilege     = "DMLOnly"  # Changed from ReadWrite to DMLOnly which is supported
  db_names      = [alicloud_db_database.roboverse_database.name]
}

# Database initialization is now handled by the application on first run
# This empty resource is kept as a placeholder for future initialization needs
resource "null_resource" "init_database" {
  depends_on = [alicloud_db_account_privilege.roboverse_account_privilege]
}