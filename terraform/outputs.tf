output "slb_public_ip" {
  description = "The public IP address of the load balancer"
  value       = alicloud_slb_load_balancer.app.address
}

output "container_registry_url" {
  description = "The URL of the container registry"
  value       = "${alicloud_cr_repo.app.domain_list["public"]}/${alicloud_cr_namespace.roboverse.name}"
}

output "container_registry_domain" {
  description = "The base domain of the container registry"
  value       = alicloud_cr_repo.app.domain_list["public"]
}

output "application_url" {
  description = "The URL where the application can be accessed"
  value       = "http://${alicloud_slb_load_balancer.app.address}"
}

output "cdn_domain" {
  description = "The domain name of the CDN"
  value       = alicloud_cdn_domain_new.roboverse_cdn.domain_name
}

output "cdn_url" {
  description = "The full URL of the CDN with HTTPS"
  value       = "https://${alicloud_cdn_domain_new.roboverse_cdn.domain_name}"
}


output "auto_scaling_group_id" {
  description = "The ID of the auto scaling group"
  value       = alicloud_ess_scaling_group.app.id
}

output "vpc_id" {
  description = "The ID of the VPC"
  value       = alicloud_vpc.roboverse_vpc.id
}

# Database outputs are already defined in the apsaradb module