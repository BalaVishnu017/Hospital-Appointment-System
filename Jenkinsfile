pipeline {
    agent any

    options {
        timestamps()
        disableConcurrentBuilds()
    }

    environment {
        IMAGE = "hospital-appointment:jenkins-${BUILD_NUMBER}"
    }

    stages {
        stage('Install Dependencies') {
            steps {
                bat 'npm ci'
            }
        }

        stage('Run Tests') {
            steps {
                bat 'npm test'
            }
        }

        stage('Build Docker Image') {
            steps {
                bat 'docker build -t %IMAGE% .'
            }
        }

        stage('Docker Health Check') {
            steps {
                bat '''
                    docker rm -f hospital-jenkins-check 2>NUL
                    docker run -d --name hospital-jenkins-check -p 3010:3001 %IMAGE%
                    powershell -NoProfile -Command "$deadline=(Get-Date).AddSeconds(30); do { try { $r=Invoke-WebRequest -UseBasicParsing http://127.0.0.1:3010/health -TimeoutSec 2; if ($r.StatusCode -eq 200) { exit 0 } } catch {}; Start-Sleep 1 } while ((Get-Date) -lt $deadline); exit 1"
                '''
            }
        }
    }

    post {
        always {
            bat '''
                docker logs hospital-jenkins-check > docker-smoke.log 2>&1
                docker rm -f hospital-jenkins-check 2>NUL
                exit /b 0
            '''
            archiveArtifacts artifacts: 'docker-smoke.log', allowEmptyArchive: true
        }
    }
}