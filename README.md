# Hospital Appointment Booking System

## Project Development and Implementation

The Hospital Appointment Booking System was developed and implemented from scratch as a full-stack web application. The project provides patient registration and login, doctor searching, appointment booking and cancellation, and administrator management.

The application was developed using **Node.js, Express.js, SQLite, HTML, CSS and JavaScript**. I created the project structure, implemented the application functionality, configured the database, integrated authentication, and performed application testing.

The project was also integrated with GitHub, Docker, Jenkins and Selenium to demonstrate version control, containerization, continuous integration and automated browser testing.

## 1. Application Development from Scratch

The following tasks were performed during application development:

- Created the project directory and initialized the Node.js application.
- Configured the required dependencies using `npm`.
- Developed the backend using Node.js and Express.js.
- Implemented patient registration and login functionality.
- Implemented doctor search and doctor details display.
- Developed appointment booking and cancellation functionality.
- Implemented administrator functionality for managing doctors and appointments.
- Integrated SQLite as the database for storing application records.
- Implemented password hashing and session-based authentication.
- Added input validation and error handling.
- Created the frontend using HTML, CSS and JavaScript.
- Connected the frontend with backend routes and database operations.
- Tested the major application functionalities.

Synthetic patient records are used for laboratory demonstrations. Database files and credentials are excluded from Git and Docker image layers.

## 2. Running the Application Using Docker

After completing application development, I configured Docker to containerize the application.

The hospital application image was tagged as `saigayathria48/student-attendance-management:hospital-67fedf6` and stored in a private Docker Hub repository. A separate hospital tag was used because the Docker Hub account had no remaining private repository slots.

The following commands were used:

```powershell
docker login
docker compose build
docker compose up -d
docker compose ps
```

After starting the container, I accessed the application using:

http://localhost:3001

Docker Compose was configured to:
- Build and run the hospital application.
- Map the application port to the host machine.
- Maintain SQLite database records using a Docker volume.
- Keep the application database separate from other project databases.
- Support stopping and restarting the application without deleting stored records.

To stop the application:

```powershell
docker compose stop
```

To view application logs:

```powershell
docker compose logs hospital
```

## 3. Administrator Account Configuration

After starting the Docker container, I configured the administrator account using the administrator bootstrap script.

The administrator details were entered securely through PowerShell environment variables.

```powershell
$env:ADMIN_NAME = Read-Host 'Admin name'
$env:ADMIN_EMAIL = Read-Host 'Admin email'
$secret = Read-Host 'Admin password (at least 12 characters)' -AsSecureString
$env:ADMIN_PASSWORD = [System.Net.NetworkCredential]::new('', $secret).Password

try {
    docker compose exec -T -e ADMIN_NAME -e ADMIN_EMAIL -e ADMIN_PASSWORD hospital node scripts/create-admin.js
} finally {
    Remove-Item Env:ADMIN_NAME, Env:ADMIN_EMAIL, Env:ADMIN_PASSWORD -ErrorAction SilentlyContinue
    Remove-Variable secret -ErrorAction SilentlyContinue
}
```

The administrator account was created successfully for accessing administrative functionality.

## 4. GitHub Integration

After completing the application development, I configured Git and uploaded the project source code to my GitHub account.

Repository:

https://github.com/saigayathria48/hospital-appointment-system

The following commands were used:

```powershell
git init
git add .
git commit -m "Initial hospital appointment system implementation"
git branch -M main
git remote add origin https://github.com/saigayathria48/hospital-appointment-system.git
git push -u origin main
```

GitHub was used to maintain the source code, track changes and provide repository access for Jenkins integration.

Sensitive files, database records and credentials were excluded from version control.

## 5. Jenkins Continuous Integration Pipeline

After uploading the project to GitHub, I integrated the repository with Jenkins to automate the build and testing process.

Jenkins was accessed through:

http://localhost:8080

The following steps were performed:

1. Opened the Jenkins dashboard.
2. Selected **New Item**.
3. Entered the project name `hospital-appointment-system`.
4. Selected **Pipeline** and clicked **OK**.
5. Selected **Pipeline script from SCM**.
6. Selected Git as the source control management system.
7. Entered the GitHub repository URL:

   `https://github.com/saigayathria48/hospital-appointment-system.git`

8. Configured the branch as `*/main`.
9. Set the script path to `Jenkinsfile`.
10. Saved the pipeline configuration.
11. Selected **Build Now** to execute the pipeline.

The Jenkins pipeline was configured to perform the following operations:

- Checkout the source code from GitHub.
- Install the required Node.js dependencies.
- Execute automated application tests using `npm test`.
- Build a Docker image.
- Start a temporary application container.
- Perform an HTTP health check at `http://127.0.0.1:3010/health`.
- Remove the temporary container after execution.

The Jenkins pipeline successfully demonstrated automated testing and Docker image building.

The pipeline creates a local image and does not automatically publish it to Docker Hub or replace the running application on port 3001.

## 6. Automated Testing Using Selenium

After implementing the application and configuring the CI pipeline, I performed automated browser testing using Selenium with Python.

The required Python environment and Selenium dependencies were configured.

Commands:

```powershell
py --version
py -m pip show selenium
```

Selenium WebDriver was configured to launch Chrome and interact with the application through browser automation.

The automated test cases covered important application functionalities, including:

- Opening the hospital application.
- Patient registration.
- Patient login.
- Doctor searching.
- Appointment booking.
- Appointment cancellation.
- Application page navigation.
- Verification of application responses.

The Selenium tests were executed against the locally running application.

## 7. Local Application Testing

The application was also tested independently using Node.js.

The following commands were executed:

```powershell
npm ci
npm test
```

The automated tests verified important backend operations, including:

- Account creation and authentication.
- User roles and access.
- Doctor and appointment slot management.
- Appointment booking.
- Appointment cancellation.
- Database persistence.

The GitHub Actions workflow was also configured to install dependencies, execute automated tests and build the Docker image whenever changes were pushed or pull requests were submitted.

## 8. Final Project Outcome

The Hospital Appointment Booking System was developed and configured through the complete development and DevOps workflow.

The following technologies and tools were used:

| Technology / Tool | Purpose |
|---|---|
| HTML, CSS, JavaScript | Frontend development |
| Node.js, Express.js | Backend development |
| SQLite | Database management |
| Git and GitHub | Version control and source code hosting |
| Docker | Application containerization |
| Docker Compose | Container management |
| Jenkins | Continuous Integration |
| GitHub Actions | Automated workflow |
| Python and Selenium | Browser automation testing |
| PowerShell | Command execution and configuration |

**Conclusion:**

Through this project, I gained practical experience in developing a web application from scratch, implementing database operations, integrating GitHub, creating Docker images and containers, configuring a Jenkins pipeline, and performing automated testing using Selenium. The project demonstrates the integration of application development and DevOps tools into a complete software development workflow.
