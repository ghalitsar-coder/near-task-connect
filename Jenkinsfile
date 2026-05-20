pipeline {
    agent any

    environment {
        DOCKERHUB_USER = "YOUR_DOCKERHUB_USER"
        IMAGE_NAME = "kerjadekat-frontend"
        GITOPS_REPO = "git@github.com:YOUR_ORG/kerjadekat.git"
    }

    stages {
        stage('Install Dependencies & Lint') {
            steps {
                dir('frontend') {
                    // Use a node/bun container or ensure bun is installed on Jenkins agent
                    sh 'docker run --rm -v $(pwd):/app -w /app oven/bun:1.1 bun install --frozen-lockfile'
                    sh 'docker run --rm -v $(pwd):/app -w /app oven/bun:1.1 bun run lint'
                }
            }
        }

        stage('Build Docker Image') {
            steps {
                dir('frontend') {
                    // This Dockerfile builds the SPA and serves it via nginx
                    sh "docker build -f ../infrastructure/docker/frontend/Dockerfile -t ${DOCKERHUB_USER}/${IMAGE_NAME}:${GIT_COMMIT} -t ${DOCKERHUB_USER}/${IMAGE_NAME}:latest ."
                }
            }
        }

        stage('Push to Docker Hub') {
            steps {
                withCredentials([usernamePassword(credentialsId: 'dockerhub-creds', passwordVariable: 'DOCKER_PASS', usernameVariable: 'DOCKER_USER')]) {
                    sh "echo \$DOCKER_PASS | docker login -u \$DOCKER_USER --password-stdin"
                    sh "docker push ${DOCKERHUB_USER}/${IMAGE_NAME}:${GIT_COMMIT}"
                    sh "docker push ${DOCKERHUB_USER}/${IMAGE_NAME}:latest"
                }
            }
        }

        stage('Update GitOps Manifest') {
            steps {
                sshagent(['github-ssh-key']) {
                    sh '''
                        git config --global user.email "ci@kerjadekat.id"
                        git config --global user.name "Jenkins CI"

                        git clone ${GITOPS_REPO} gitops-repo
                        cd gitops-repo

                        yq e ".spec.template.spec.containers[0].image = \\"${DOCKERHUB_USER}/${IMAGE_NAME}:${GIT_COMMIT}\\"" -i gitops/base/frontend/deployment.yaml

                        git add gitops/base/frontend/deployment.yaml
                        git diff-index --quiet HEAD || git commit -m "ci: update frontend image to ${GIT_COMMIT} [skip ci]"
                        git push origin main
                    '''
                }
            }
        }
    }
}
