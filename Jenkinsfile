node {
  ws("workspace/${env.JOB_NAME}/${BRANCH}") {
  
  parameters {
    	gitParameter branchFilter: 'origin/(.*)', defaultValue: 'master', name: 'BRANCH', type: 'PT_BRANCH'
     }	
  
    try {     
      stage("BUILD STARTED") {      
      	println "STARTED JOB NAME: [${env.JOB_NAME}] :: BUILD NUMBER: [${env.BUILD_NUMBER}] :: BUILD URL: [${env.BUILD_URL}] :: GIT BRANCH: [${BRANCH}]"
      }
	 
	  def projectName	  = "fx-portal"
	  def ecsRepoName	  = "fx-portal"			
      def imageTag        = "portal"
      def serviceName     = "service-fx-portal"
      def taskFamily      = "td-fx-portal"    
      def clusterName     = "cluster-fxguard-dev"        
      def remoteImageTag  = "${imageTag}-${BUILD_NUMBER}"
      def taskDefile      = "file://${projectName}/task-definition-${remoteImageTag}.json"
      def ecRegistry      = "https://248909911509.dkr.ecr.eu-west-2.amazonaws.com"
      def gitRepo         = "git@github.com:fxguard/fx-portal.git"
      def gitBranch       =  "${params.BRANCH}"	
      def changesInTaskDef = false   

    stage('SCM Checkout'){	   
	 echo "SCM checkout from repo  ${gitRepo} and branch name ${gitBranch} , ${branch}" 
	 cleanWs()
         git branch: gitBranch, credentialsId: 'git_credentials_ssh', url: gitRepo
    }

     stage('Environment') {
      echo "FXG portal" 	     
      sh 'git --version'
	    echo "Branch: ${gitBranch}" 
      sh 'docker -v'
      sh 'printenv'
    }
    stage("Project build") {
      nodejs('node') {
		//sh "npm install && cd client && npm install --force && CI=false yarn build"  
		sh "npm install && cd client && npm install --force && cp -r ./react-chartjsx ./node_modules/react-chartjsx && CI=false yarn build"         
      } 
    }	    
    stage("Docker build") {      
        sh "docker build --no-cache -t ${ecsRepoName} ."                                 
    }  
    
    
    stage("Docker push") {
        docker.withRegistry(ecRegistry, 'ecr:eu-west-2:aws_ecr_credentials') {
            docker.image("${ecsRepoName}:latest").push('latest')
            docker.image("${ecsRepoName}:latest").push(remoteImageTag)
        }      
      }	 

      stage("Deploy") {

       sh  "                                                                     \
          sed -e  's;%BUILD_TAG%;${remoteImageTag};g'                             \
                  task-definition.json >                                      \
                  task-definition-${remoteImageTag}.json                      \
        "

        withCredentials([[$class: 'AmazonWebServicesCredentialsBinding', accessKeyVariable: 'AWS_ACCESS_KEY_ID', credentialsId: 'aws_ecr_credentials', secretKeyVariable: 'AWS_SECRET_ACCESS_KEY']]) {
          withEnv(["AWS_DEFAULT_REGION=eu-west-2"]) {
            
            // Get current [TaskDefinition#revision-number]
            def currTaskDef = sh (
              returnStdout: true,
              script: "aws ecs describe-task-definition  --task-definition ${taskFamily} | egrep 'revision' | tr ',' ' ' | awk '{print \$2}'"
            ).trim()

            println "Current task definition :: ${currTaskDef}"

            def currentTask = sh (
              returnStdout: true,
              script: "aws ecs list-tasks  --cluster ${clusterName} --family ${taskFamily} --output text | egrep 'TASKARNS' | awk '{print \$2}'" 
            ).trim()

		    println "Current task :: ${currentTask}"

            if(currTaskDef) {
            
              sh  "                                                                   \
                aws ecs update-service  --cluster ${clusterName}                      \
                                        --service ${serviceName}                      \
                                        --task-definition ${taskFamily}:${currTaskDef}\
                                        --desired-count 0                             \
                "
            }

            if (currentTask) {
              sh "aws ecs stop-task --cluster ${clusterName} --task ${currentTask}"
            }

            //if(changesInTaskDef){
            	// Register the new [TaskDefinition]
            	sh  "                                                                     \
              		aws ecs register-task-definition  --family ${taskFamily}                \
                                                --cli-input-json ${taskDefile}        \
              	"
			//}
			
            // Get the last registered [TaskDefinition#revision]
            def taskRevision = sh (
              returnStdout: true,
              script:  "                                                              \
                aws ecs describe-task-definition  --task-definition ${taskFamily}     \
                                                  | egrep 'revision'                  \
                                                  | tr ',' ' '                        \
                                                  | awk '{print \$2}'                 \
                "
            ).trim()

            // ECS update service to use the newly registered [TaskDefinition#revision]
        
            sh  "                                                                     \
              aws ecs update-service  --cluster ${clusterName}                        \
                                      --service ${serviceName}                        \
                                      --task-definition ${taskFamily}:${taskRevision} \
                                      --desired-count 1                               \
              "
          }
        }


      }

      try {
        stage("Remove docker image from jenkins") {      
          sh "docker images -a | grep '248909911509' | awk '{print \$3}' | xargs docker rmi -f"  
          sh "docker images -a | grep 'fx-' | awk '{print \$3}' | xargs docker rmi -f"                                 
        }
      } catch(e) {
        //slackSend (color: '#FF0000', message: "FAILED: Job '${env.JOB_NAME} [${env.BUILD_NUMBER}]' (${env.BUILD_URL})")
        //println "FAILED TO DELETE THE OLD IMAGES and error is ${e}"         
      }      
        

    stage("BUILD SUCCEED") {
       // slackSend (color: '#00FF00', message: "SUCCESSFUL: Job '${env.JOB_NAME} [${env.BUILD_NUMBER}]' (${env.BUILD_URL})")
      println "SUCCESSFUL JOB NAME: [${env.JOB_NAME}] :: BUILD NUMBER: [${env.BUILD_NUMBER}] :: BUILD URL: [${env.BUILD_URL}]"
      }
      stage('cleanup'){
           // cleanWs()
      }
    } catch(e) {
      //slackSend (color: '#FF0000', message: "FAILED: Job '${env.JOB_NAME} [${env.BUILD_NUMBER}]' (${env.BUILD_URL})")
      println "FAILED JOB NAME: [${env.JOB_NAME}] :: BUILD NUMBER: [${env.BUILD_NUMBER}] :: BUILD URL: [${env.BUILD_URL}]"
      println "Exception is : ${e}"
     // cleanWs()
      throw e
    }  
  }
}
