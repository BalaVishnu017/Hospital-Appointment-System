# Hospital Appointment Booking System

## Project Development and Implementation

The Hospital Appointment Booking System was developed and implemented from scratch as a full-stack web application. The project provides patient registration and login, doctor searching, appointment booking and cancellation, and administrator management.

The application was developed using **Node.js, Express.js, SQLite, HTML, CSS and JavaScript**. I created the project structure, implemented the application functionality, configured the database, integrated authentication, and performed application testing.

The project was also integrated with **GitHub, Docker, Jenkins, Selenium and GitHub Actions** to demonstrate version control, containerization, continuous integration, automated browser testing and automated workflows.

---

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

---

## 2. Running the Application Using Docker

After completing application development, I configured Docker to containerize the application.

The hospital application image was tagged as:

`saigayathria48/student-attendance-management:hospital-67fedf6`

The image was stored in a private Docker Hub repository. A separate hospital tag was used because the Docker Hub account had no remaining private repository slots.

### Docker Commands

```powershell
docker login
docker compose build
docker compose up -d
docker compose ps
```

After starting the container, I accessed the application using:

**Application URL:** http://localhost:3001

Docker Compose was configured to:

- Build and run the hospital application.
- Map the application port to the host machine.
- Maintain SQLite database records using a Docker volume.
- Keep the application database separate from other project databases.
- Support stopping and restarting the application without deleting stored records.

### Stop the Application

```powershell
docker compose stop
```

### View Application Logs

```powershell
docker compose logs hospital
```

---

## 3. Administrator Account Configuration

After starting the Docker container, I configured the administrator account using the administrator bootstrap script.

The administrator details were entered securely through PowerShell environment variables.

### PowerShell Commands

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

**Note:** Administrator credentials are configured securely and are not included in the GitHub repository or Docker image.

---

## 4. GitHub Integration

After completing the application development, I configured Git and uploaded the project source code to my GitHub account.

### GitHub Repository

[Hospital Appointment Booking System](https://github.com/saigayathria48/hospital-appointment-system)

### Git Commands

```powershell
git init
git add .
git commit -m "Initial hospital appointment system implementation"
git branch -M main
git remote add origin https://github.com/saigayathria48/hospital-appointment-system.git
git push -u origin main
```

GitHub was used to:

- Maintain the application source code.
- Track changes using Git.
- Maintain version history.
- Share the project repository.
- Provide repository access for Jenkins integration.

Sensitive files, database records and credentials were excluded from version control.

---

## 5. Jenkins Continuous Integration Pipeline

After uploading the project to GitHub, I integrated the repository with Jenkins to automate the build and testing process.

### Jenkins URL

http://localhost:8080

### Jenkins Configuration Steps

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

### Jenkins Pipeline Operations

The Jenkins pipeline was configured to perform the following operations:

- Checkout the source code from GitHub.
- Install the required Node.js dependencies.
- Execute automated application tests using `npm test`.
- Build a Docker image.
- Start a temporary application container.
- Perform an HTTP health check at `http://127.0.0.1:3010/health`.
- Remove the temporary container after execution.

The Jenkins pipeline successfully demonstrated automated testing and Docker image building.

**Note:** The pipeline creates a local image and does not automatically publish it to Docker Hub or replace the running application on port 3001.

---

## 6. Automated Browser Testing Using Python and Selenium

After implementing the application and configuring the CI pipeline, I performed automated browser testing using **Selenium WebDriver with Python**.

Selenium was used to automate browser interactions and verify the functionality of the Hospital Appointment Booking System through Google Chrome.

### Step 1: Verify Python Installation

```powershell
py --version
```

### Step 2: Verify Selenium Installation

```powershell
py -m pip show selenium
```

### Step 3: Install Selenium if Required

```powershell
py -m pip install selenium
```

### Step 4: Configure Selenium WebDriver

The following configurations were performed:

- Imported Selenium WebDriver into the Python test script.
- Configured Chrome WebDriver to launch Google Chrome.
- Configured the local hospital application URL as the testing target.
- Used Selenium commands to interact with application elements.
- Used explicit waits to ensure elements were available before performing actions.

### Step 5: Execute Selenium Tests

```powershell
py test_selenium.py
```

### Selenium Test Cases

The automated browser test cases covered the following functionalities:

1. Opening the Hospital Appointment Booking System.
2. Verifying the application homepage.
3. Testing patient registration.
4. Testing patient login and authentication.
5. Searching for available doctors.
6. Verifying doctor details.
7. Booking an appointment.
8. Cancelling an appointment.
9. Testing application navigation.
10. Verifying successful responses and error messages.

### Outcome

Selenium WebDriver was used to automate browser-based testing of the application and verify important user workflows, reducing the need for repetitive manual testing.

---

## 7. Local Application Testing

The application was also tested independently using Node.js to verify backend operations and database functionality.

### Install Dependencies

```powershell
npm ci
```

### Execute Automated Tests

```powershell
npm test
```

The automated tests verified important backend operations, including:

- Account creation and authentication.
- User roles and access.
- Doctor and appointment slot management.
- Appointment booking.
- Appointment cancellation.
- Database persistence.

The tests helped verify that the application performed the required operations correctly.

---

## 8. GitHub Actions Workflow

The GitHub Actions workflow was also configured to automate application testing and Docker image building.

The workflow was configured to execute when:

- Changes were pushed to the GitHub repository.
- Pull requests were submitted.

### GitHub Actions Operations

- Checkout the repository source code.
- Set up the Node.js environment.
- Install application dependencies.
- Execute automated tests using `npm test`.
- Build the Docker image.

This integration helped automate the testing and build process whenever changes were submitted to the repository.

---

## 9. Technologies and Tools Used

| Technology / Tool | Purpose |
|---|---|
| HTML | Web page structure |
| CSS | Frontend styling |
| JavaScript | Frontend functionality |
| Node.js | Backend runtime |
| Express.js | Backend framework |
| SQLite | Database management |
| Git | Version control |
| GitHub | Source code hosting |
| Docker | Application containerization |
| Docker Compose | Container management |
| Docker Hub | Docker image storage |
| Jenkins | Continuous Integration |
| GitHub Actions | Automated workflows |
| Python | Selenium test scripting |
| Selenium WebDriver | Browser automation testing |
| Google Chrome | Browser testing |
| PowerShell | Command execution and configuration |

---

## 10. Final Project Outcome

The Hospital Appointment Booking System was developed and configured through the complete application development and DevOps workflow.

The project successfully demonstrates the integration of:

1. Full-stack web application development.
2. Database configuration and management.
3. User authentication and administrator management.
4. Git and GitHub version control.
5. Docker image creation and containerization.
6. Docker Compose container management.
7. Jenkins continuous integration.
8. Selenium automated browser testing.
9. GitHub Actions automated workflows.
10. Application testing and verification.

### Conclusion

Through this project, I gained practical experience in developing a web application from scratch, implementing database operations, integrating GitHub, creating Docker images and containers, configuring a Jenkins pipeline, automating browser testing using Selenium, and implementing GitHub Actions workflows.

The project demonstrates the integration of application development, testing, version control and DevOps tools into a complete software development workflow.
