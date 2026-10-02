// Send a Telegram message.
// The text goes through the environment (never through Groovy/shell string interpolation),
// and the bot token is passed to curl on stdin so it never shows up in argv.
def tg(String text) {
    withEnv(["TG_TEXT=${text}"]) {
        sh '''
            set +x
            config=$(printf 'url = "https://api.telegram.org/bot%s/sendMessage"' "$TOKEN")
            echo "$config" | curl -fsS -o /dev/null -K - --data-urlencode "chat_id=$CHAT_ID" --data-urlencode "text=$TG_TEXT" || echo 'telegram notify failed (ignored)'
        '''
    }
}

pipeline {
    agent any

    environment {
        // Telegram configre
        TOKEN = credentials('telegram_token')
        CHAT_ID = credentials('telegram_chatid')

        // Docker
        IMAGE = 'yamiannephilim/wedding'
        CONTAINER = 'wedding'
        NETWORK = 'yan'

        // Telegram message
        GIT_MESSAGE = sh(returnStdout: true, script: "git log -n 1 --format=%s ${GIT_COMMIT}").trim()
        GIT_AUTHOR = sh(returnStdout: true, script: "git log -n 1 --format=%ae ${GIT_COMMIT}").trim()
        GIT_COMMIT_SHORT = sh(returnStdout: true, script: "git rev-parse --short ${GIT_COMMIT}").trim()
        GIT_INFO = "Branch: ${GIT_BRANCH}\nLast Message: ${GIT_MESSAGE}\nAuthor: ${GIT_AUTHOR}\nCommit: ${GIT_COMMIT_SHORT}"
        TEXT_BREAK = '----------------------------------------'
        TEXT_PRE = "${TEXT_BREAK}\n${GIT_INFO}"
        TEXT_BUILD = "${JOB_NAME} is Building"
        TEXT_TEST = "${JOB_NAME} is Testing"
        TEXT_PUSH = "${JOB_NAME} is Pushing"
        TEXT_CLEAN = "${JOB_NAME} is Cleaning"
        TEXT_RUN = "${JOB_NAME} is Running"

        // Telegram parameters
        TEXT_SUCCESS_BUILD = "${JOB_NAME} is Success"
        TEXT_FAILURE_BUILD = "${JOB_NAME} is Failure"
    }

    stages {
        stage('Build') {
            steps {
                script {
                    tg(env.TEXT_PRE)
                    tg(env.TEXT_BUILD)
                }

                // Binary files checked out as Git LFS pointers would be served as broken assets
                sh '''
                    if grep -rlI '^version https://git-lfs.github.com/spec/v1' index.html wp-content; then
                        echo 'Git LFS pointer files found in the site: run "git lfs pull" on the agent'
                        exit 1
                    fi
                '''

                sh 'docker build --pull -t "$IMAGE:$GIT_COMMIT_SHORT" -t "$IMAGE:latest" .'
            }
        }

        stage('Test') {
            steps {
                script {
                    tg(env.TEXT_TEST)
                }

                // Smoke test the new image before it is pushed or deployed
                sh '''
                    name="$CONTAINER-smoke-$BUILD_NUMBER"
                    docker rm -f "$name" >/dev/null 2>&1 || true
                    docker run -d --name "$name" "$IMAGE:$GIT_COMMIT_SHORT" >/dev/null

                    ok=0
                    for i in $(seq 1 20); do
                        if docker exec "$name" wget -qO- http://127.0.0.1/ 2>/dev/null | grep -q 'Thu Buzzy'; then
                            ok=1
                            break
                        fi
                        sleep 1
                    done
                    [ "$ok" = 1 ] || { echo 'smoke test: index.html is not served'; exit 1; }

                    docker exec "$name" wget -qO- http://127.0.0.1/wp-content/themes/js/main-wedding8a54.js >/dev/null

                    if docker exec "$name" wget -qO- http://127.0.0.1/.git/HEAD >/dev/null 2>&1; then
                        echo 'smoke test: /.git is exposed'
                        exit 1
                    fi
                '''
            }

            post {
                // also runs when the build is aborted, unlike a shell trap
                always {
                    sh 'docker rm -f "$CONTAINER-smoke-$BUILD_NUMBER" >/dev/null 2>&1 || true'
                }
            }
        }

        stage('Push') {
            steps {
                script {
                    tg(env.TEXT_PUSH)
                }

                withDockerRegistry(credentialsId: 'docker_hub', url: 'https://index.docker.io/v1/') {
                    sh 'docker push "$IMAGE:$GIT_COMMIT_SHORT"'
                    sh 'docker push "$IMAGE:latest"'
                }
            }
        }

        stage('Clean') {
            steps {
                script {
                    tg(env.TEXT_CLEAN)
                }

                // Only ever touch this job's own container (exact name)
                sh 'docker rm -f "$CONTAINER" >/dev/null 2>&1 || echo "this container does not exist"'
            }
        }

        stage('Run') {
            steps {
                script {
                    tg(env.TEXT_RUN)
                }

                sh 'docker network inspect "$NETWORK" >/dev/null 2>&1 || docker network create "$NETWORK"'
                sh 'docker run --name "$CONTAINER" --network "$NETWORK" --restart=unless-stopped -d "$IMAGE:$GIT_COMMIT_SHORT"'
                sh '''
                    sleep 2
                    [ "$(docker inspect -f '{{.State.Running}}' "$CONTAINER")" = true ]
                '''

                // This job's images that no container uses and that are older than 30 days
                // (every tag stays on Docker Hub for rollbacks)
                sh 'docker image prune -af --filter label=app=wedding --filter until=720h'
            }
        }
    }

    post {
        always {
            cleanWs()
        }

        success {
            script {
                tg(env.TEXT_SUCCESS_BUILD)
            }
        }

        failure {
            script {
                tg(env.TEXT_FAILURE_BUILD)
            }
        }
    }
}
