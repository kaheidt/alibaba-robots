provider "alicloud" {
  region = var.region
  access_key = var.access_key
  secret_key = var.secret_key
}

# Import existing OSS bucket
# Note: You need to run 'terraform import alicloud_oss_bucket.game_bucket <bucket-name>' 
# to import the existing bucket
resource "alicloud_oss_bucket" "game_bucket" {
  bucket = var.oss_bucket_name
  
  # Remove deprecated acl attribute and ignore policy changes
  lifecycle {
    prevent_destroy = true
    ignore_changes = [
      policy
    ]
  }
  
  cors_rule {
    allowed_origins = ["*"]
    allowed_methods = ["GET", "PUT", "DELETE", "POST", "HEAD"]
    allowed_headers = ["*"]
    expose_headers  = ["ETag", "x-oss-request-id"]
    max_age_seconds = 3600
  }
}

# Add separate ACL resource
resource "alicloud_oss_bucket_acl" "game_bucket_acl" {
  bucket = alicloud_oss_bucket.game_bucket.bucket
  acl    = "private"
}

# Create Container Registry namespace
resource "alicloud_cr_namespace" "roboverse" {
  name               = var.project_name
  auto_create        = true
  default_visibility = "PUBLIC"
}

# Create Container Registry repository
resource "alicloud_cr_repo" "app" {
  namespace = alicloud_cr_namespace.roboverse.name
  name      = "app"
  summary   = "Roboverse application container repository"
  repo_type = "PUBLIC"
  depends_on = [alicloud_cr_namespace.roboverse]
}

# Create ECS launch template
resource "alicloud_ecs_launch_template" "app" {
  launch_template_name = "${var.project_name}-template"
  image_id            = var.ecs_image_id
  instance_type       = var.ecs_instance_type
  security_group_ids  = [alicloud_security_group.app_security_group.id]
  vswitch_id         = alicloud_vswitch.roboverse_vswitch.id
  
  user_data = base64encode(<<-EOF
              #!/bin/bash
              # Install Docker
              apt-get update
              apt-get install -y docker.io
              systemctl start docker
              systemctl enable docker

              # Login to container registry and run application
              echo "${var.secret_key}" | docker login ${alicloud_cr_repo.app.domain_list["public"]} -u ${var.access_key} --password-stdin
              docker pull ${alicloud_cr_repo.app.domain_list["public"]}/${var.project_name}/app:latest
              docker run -d \
                --name roboverse \
                -p 80:80 \
                --restart always \
                -e DB_HOST=${module.apsaradb.connection_string} \
                -e DB_USER=${var.db_account_name} \
                -e DB_PASSWORD=${var.db_account_password} \
                -e DB_NAME=${module.apsaradb.database_name} \
                -e ALIBABA_OSS_REGION=${var.region} \
                -e ALIBABA_OSS_BUCKET=${var.oss_bucket_name} \
                -e ALIBABA_ACCESS_KEY_ID=${var.access_key} \
                -e ALIBABA_ACCESS_KEY_SECRET=${var.secret_key} \
                ${alicloud_cr_repo.app.domain_list["public"]}/${var.project_name}/app:latest
              EOF
  )
}

# Create application security group
resource "alicloud_security_group" "app_security_group" {
  security_group_name = "${var.project_name}-app-sg"  # Changed from name
  vpc_id      = alicloud_vpc.roboverse_vpc.id
  description = "Security group for application servers"
}

# Allow inbound HTTP traffic
resource "alicloud_security_group_rule" "allow_http" {
  security_group_id = alicloud_security_group.app_security_group.id
  type              = "ingress"
  ip_protocol       = "tcp"
  policy            = "accept"
  port_range        = "80/80"
  cidr_ip           = "0.0.0.0/0"
}

# Create SLB instance
resource "alicloud_slb_load_balancer" "app" {
  load_balancer_name = "${var.project_name}-slb"
  address_type       = "internet"
  load_balancer_spec = "slb.s1.small"
  vswitch_id         = alicloud_vswitch.roboverse_vswitch.id
}

# Create SLB listener
resource "alicloud_slb_listener" "http" {
  load_balancer_id          = alicloud_slb_load_balancer.app.id
  frontend_port             = 80
  backend_port             = 80
  protocol                 = "http"
  bandwidth                = 10
  scheduler               = "wrr"
  
  health_check             = "on"
  health_check_type       = "http"
  health_check_uri        = "/"
  healthy_threshold       = 3
  unhealthy_threshold     = 3
  health_check_timeout    = 5
  health_check_interval   = 10
  health_check_http_code  = "http_2xx"
}

# Create Auto Scaling group
resource "alicloud_ess_scaling_group" "app" {
  scaling_group_name = "${var.project_name}-asg"
  min_size          = var.min_instance_count
  max_size          = var.max_instance_count
  desired_capacity = 1
  vswitch_ids       = [alicloud_vswitch.roboverse_vswitch.id]
  loadbalancer_ids  = [alicloud_slb_load_balancer.app.id]
}

# Create scaling configuration
resource "alicloud_ess_scaling_configuration" "app" {
  scaling_group_id  = alicloud_ess_scaling_group.app.id
  instance_type     = var.ecs_instance_type
  security_group_id = alicloud_security_group.app_security_group.id
  image_id         = var.ecs_image_id
  
  instance_name    = "${var.project_name}-instance"
  system_disk_category = "cloud_efficiency"
  system_disk_size    = 40
  
  active           = true
  
  user_data = alicloud_ecs_launch_template.app.user_data
}

# Create scaling rule
resource "alicloud_ess_scaling_rule" "app" {
  scaling_group_id = alicloud_ess_scaling_group.app.id
  adjustment_type  = "TotalCapacity"
  adjustment_value = 1
  cooldown        = 300
}

# Create ApsaraDB RDS instance for storing leaderboard data
module "apsaradb" {
  source = "./modules/apsaradb"
  
  rds_instance_name = "${var.project_name}-db"
  rds_engine        = "MySQL"
  rds_engine_version = "8.0"
  rds_instance_type = "rds.mysql.t1.small"
  rds_storage_size  = 20
  db_name           = "roboverse"
  account_name      = var.db_account_name
  account_password  = var.db_account_password
  vpc_id            = alicloud_vpc.roboverse_vpc.id
  vswitch_id        = alicloud_vswitch.roboverse_vswitch.id
}

# Create VPC for network isolation
resource "alicloud_vpc" "roboverse_vpc" {
  vpc_name   = "${var.project_name}-vpc"
  cidr_block = "172.16.0.0/16"
}

# Create VSwitch
resource "alicloud_vswitch" "roboverse_vswitch" {
  vpc_id     = alicloud_vpc.roboverse_vpc.id
  cidr_block = "172.16.0.0/24"
  zone_id    = data.alicloud_zones.available.zones[0].id
}

# Get available zones
data "alicloud_zones" "available" {
  available_resource_creation = "VSwitch"
}

# Create Security Group to allow application to connect to RDS
resource "alicloud_security_group" "db_security_group" {
  security_group_name = "${var.project_name}-db-sg"  # Changed from name
  vpc_id      = alicloud_vpc.roboverse_vpc.id
  description = "Security group for DB access"
}

# Allow inbound access to MySQL port
resource "alicloud_security_group_rule" "allow_mysql" {
  security_group_id = alicloud_security_group.db_security_group.id
  type              = "ingress"
  ip_protocol       = "tcp"
  policy            = "accept"
  port_range        = "3306/3306"
  cidr_ip           = "0.0.0.0/0"  # In production, restrict this to your application IPs
}

# Create Security Group to allow RDS access
resource "alicloud_security_group_rule" "allow_rds_access" {
  security_group_id = alicloud_security_group.db_security_group.id
  type              = "ingress"
  ip_protocol       = "tcp"
  policy            = "accept"
  port_range        = "3306/3306"
  source_security_group_id = alicloud_security_group.app_security_group.id
}

# Create RAM user for database access
resource "alicloud_ram_user" "db_user" {
  name = "${var.project_name}-db-user"
}

resource "alicloud_ram_access_key" "db_access_key" {
  user_name = alicloud_ram_user.db_user.name
}

# Export secrets to a local file (for development only)
resource "local_file" "db_credentials" {
  content  = <<-EOT
    # API Server Config
    PORT=3001

    # Frontend Config (client-side only)
    VITE_API_URL=http://localhost:3001/api
    VITE_CDN_URL=https://${alicloud_cdn_domain_new.roboverse_cdn.domain_name}

    # Database Config (server-side only)
    DB_HOST=${module.apsaradb.connection_string}
    DB_PORT=3306
    DB_NAME=${var.project_name}
    DB_USER=${var.db_account_name}
    DB_PASSWORD=${var.db_account_password}

    # Alibaba Cloud Config (server-side only)
    ALIBABA_OSS_REGION=${var.region}
    ALIBABA_OSS_BUCKET=${var.oss_bucket_name}
    ALIBABA_ACCESS_KEY_ID=${var.access_key}
    ALIBABA_ACCESS_KEY_SECRET=${var.secret_key}
  EOT
  filename = "${path.module}/.env.terraform"
}

output "db_connection_string" {
  value = module.apsaradb.connection_string
  sensitive = true
}

output "db_account_name" {
  value = var.db_account_name
}

# Create CDN domain pointing to OSS bucket
resource "alicloud_cdn_domain_new" "roboverse_cdn" {
  #domain_name = "${var.cdn_domain_prefix}-${var.region}.alicdn.com"
  domain_name = var.custom_domain
  cdn_type    = "web"
  scope       = "overseas"
  sources {
    content  = "${var.oss_bucket_name}.${var.oss_bucket_endpoint}"
    type     = "oss"
    port     = 80
    priority = 20
    weight   = 15
  }
}

# Configure CDN domain settings
resource "alicloud_cdn_domain_config" "cdn_https" {
  domain_name   = alicloud_cdn_domain_new.roboverse_cdn.domain_name
  function_name = "https_option"
  function_args {
    arg_name  = "http2"
    arg_value = "on"
  }
}

# Configure cache behavior for different file types
resource "alicloud_cdn_domain_config" "cache_ttl" {
  domain_name   = alicloud_cdn_domain_new.roboverse_cdn.domain_name
  function_name = "filetype_based_ttl_set"
  
  # Cache for textures
  function_args {
    arg_name  = "file_type"
    arg_value = "jpg,jpeg,png,webp,gif"
  }
  function_args {
    arg_name  = "ttl"
    arg_value = "2592000"  # 30 days in seconds
  }
  function_args {
    arg_name  = "weight"
    arg_value = "1"
  }
}

# Cache for 3D models and other assets
resource "alicloud_cdn_domain_config" "model_cache_ttl" {
  domain_name   = alicloud_cdn_domain_new.roboverse_cdn.domain_name
  function_name = "filetype_based_ttl_set"
  
  function_args {
    arg_name  = "file_type"
    arg_value = "glb,gltf,obj,mtl,fbx,bin"
  }
  function_args {
    arg_name  = "ttl"
    arg_value = "2592000"  # 30 days in seconds
  }
  function_args {
    arg_name  = "weight"
    arg_value = "1"
  }
}

# Cache for static JavaScript and CSS files
resource "alicloud_cdn_domain_config" "js_css_cache_ttl" {
  domain_name   = alicloud_cdn_domain_new.roboverse_cdn.domain_name
  function_name = "filetype_based_ttl_set"
  
  function_args {
    arg_name  = "file_type"
    arg_value = "js,css"
  }
  function_args {
    arg_name  = "ttl"
    arg_value = "604800"  # 7 days in seconds
  }
  function_args {
    arg_name  = "weight"
    arg_value = "1"
  }
}

# Configure CORS for CDN
resource "alicloud_cdn_domain_config" "cdn_cors" {
  domain_name   = alicloud_cdn_domain_new.roboverse_cdn.domain_name
  function_name = "set_req_header"
  
  function_args {
    arg_name  = "key"
    arg_value = "Access-Control-Allow-Origin"
  }
  function_args {
    arg_name  = "value"
    arg_value = "*"
  }
}