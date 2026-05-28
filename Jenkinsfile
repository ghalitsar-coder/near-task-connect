pipeline {
    agent any

    environment {
        DOCKERHUB_USER = "ghalitsar"
        IMAGE_NAME = "kerjadekat-frontend"
    }

    stages {
        stage('Test CI') {
            steps {
                echo "Hello from Frontend Pipeline!"
                sh "echo 'Testing frontend changes...'"
            }
        }

        stage('Build Image') {
            steps {
                script {
                    def gitCommit = sh(script: 'git rev-parse --short HEAD', returnStdout: true).trim()
                    
                    // Frontend butuh Dockerfile spesifik dari infrastructure
                    // Karena repo terpisah, kita asumsikan Dockerfile-nya ada di ./Dockerfile atau kamu sediakan.
                    // Untuk test ini, kita panggil Dockerfile yang ada di root repo near-task-connect
                    sh "docker build -t ${DOCKERHUB_USER}/${IMAGE_NAME}:${gitCommit} -t ${DOCKERHUB_USER}/${IMAGE_NAME}:latest ."
                }
            }
        }
        
        stage('Push Image') {
            steps {
                echo "Skipping push for this test run. The Build stage worked!"
            }
        }
    }
}