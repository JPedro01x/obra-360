variable "aws_region" {
  description = "Região AWS de implantação do ecossistema Obra360"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Ambiente de implantação (prod, staging, dev)"
  type        = string
  default     = "prod"
}

variable "db_username" {
  description = "Usuário mestre do banco de dados PostgreSQL"
  type        = string
  default     = "postgres"
}

variable "db_password" {
  description = "Senha mestre do banco de dados PostgreSQL"
  type        = string
  sensitive   = true
  default     = "postgres"
}
