output "db_endpoint" {
  description = "Endpoint de conexão JDBC do banco de dados PostgreSQL no AWS RDS"
  value       = aws_db_instance.postgres.endpoint
}

output "s3_bucket_name" {
  description = "Nome do Bucket AWS S3 para armazenamento de plantas 2D/3D BIM"
  value       = aws_s3_bucket.bim_storage.bucket
}
