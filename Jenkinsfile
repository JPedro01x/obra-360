pipeline {
    agent any

    tools {
        maven 'Maven-3.9'
        nodejs 'NodeJS-20'
    }

    environment {
        PROJECT_NAME = 'obra-360'
        BACKEND_DIR = 'backend'
        DOCKER_REGISTRY = 'docker.io/jpedro01x'
        IMAGE_TAG = "${BUILD_NUMBER}"
    }

    stages {
        
        stage('1. Checkout Source Code') {
            steps {
                echo '📥 Clonando repositório Git do Obra360...'
                checkout scm
            }
        }

        stage('2. Backend Tests (Java 21 Spring Boot)') {
            steps {
                echo '🧪 Executando suíte de testes unitários e de integração (MockMvc)...'
                dir("${env.BACKEND_DIR}") {
                    bat 'mvn test'
                }
            }
            post {
                always {
                    junit 'backend/target/surefire-reports/*.xml'
                }
            }
        }

        stage('3. Build Backend Package (Spring Boot JAR)') {
            steps {
                echo '📦 Compilando artefato JAR corporativo de produção...'
                dir("${env.BACKEND_DIR}") {
                    bat 'mvn clean package -DskipTests'
                }
            }
        }

        stage('4. Frontend Build & Static Analysis (Vite + React 18)') {
            steps {
                echo '⚡ Instalando dependências e compilando o Frontend React PWA...'
                bat 'npm ci'
                bat 'npm run build'
            }
        }

        stage('5. Docker Image Generation') {
            steps {
                echo '🐳 Criando imagens Docker do Backend e Frontend para implantação Cloud...'
                bat "docker build -t ${env.DOCKER_REGISTRY}/obra360-backend:${env.IMAGE_TAG} ./backend"
                bat "docker build -t ${env.DOCKER_REGISTRY}/obra360-frontend:${env.IMAGE_TAG} ."
            }
        }

        stage('6. Deploy to Staging Environment') {
            steps {
                echo '🚀 Publicando artefatos de staging no servidor de homologação...'
                // bat 'docker compose up -d'
            }
        }
    }

    post {
        success {
            echo '✅ Pipeline CI/CD do Jenkins concluído com SUCESSO! Artefatos validados.'
        }
        failure {
            echo '❌ Falha no Pipeline do Jenkins! Verifique os logs de compilação acima.'
        }
    }
}
