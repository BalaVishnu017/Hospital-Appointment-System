# Hospital Appointment Booking System

A local lab demonstration of patient registration and login, doctor search, appointment booking and cancellation, and administrator management. The application uses Node.js, Express and SQLite. The database and credentials are excluded from Git and Docker image layers. Use synthetic patient records for lab demonstrations.

## Run with Docker Compose

The hospital image is stored privately at `saigayathria48/student-attendance-management:hospital-67fedf6`. A distinct hospital tag is used because the Docker Hub account has no remaining private repository slots. The attendance image uses its own tags; the applications have separate containers, databases and ports. Sign in with `docker login` to pull the private image.

From this directory with Docker Desktop running:

```powershell
docker compose build
docker compose up -d
docker compose ps
```

Open http://localhost:3001. Compose binds to this computer's loopback interface and stores the SQLite database in its `hospital-data` volume. If port 3001 is occupied, stop the other service or set `$env:HOST_PORT = '3101'` before starting; the application will then be available on port 3101. A new volume starts with a new database. To retain existing local records, migrate an integrity-checked SQLite backup to the volume before starting; do not simply copy a live SQLite file.

Bootstrap an administrator once in a PowerShell session after starting the container:

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

The bootstrap creates an administrator if none exists; it does not reset an existing account. Passwords must have at least 12 characters and at most 72 UTF-8 bytes. Keep credentials in a secure password manager rather than source code, logs or Git. Sessions are kept in memory and expire when the application restarts. The local HTTP setup is intended for a lab demonstration, not public use with real patient data.

`docker compose stop` stops the service without deleting the data volume. `docker compose logs hospital` displays logs. Back up the database before any data migration or removal; deleting the volume deletes its database.

## Run tests locally

Use Node.js 22.23.2, then run:

```powershell
npm ci
npm test
```

The GitHub Actions workflow installs dependencies, runs the automated tests and builds the Docker image on pushes and pull requests. It does not publish an image or deploy the application.

The earlier tutorial's `login.js` is retained locally for reference; the current application implements authentication in `index.js` and the image does not use `login.js`.

## Run the pipeline in Jenkins

Jenkins can run the `Jenkinsfile` in this repository on Windows. Make sure Docker Desktop is open and its engine is running, then open `http://localhost:8080` and sign in.

1. Select **New Item**, enter `hospital-appointment-system`, choose **Pipeline**, and select **OK**.
2. In the **Pipeline** section choose **Pipeline script from SCM**.
3. Set **SCM** to **Git**, use `https://github.com/saigayathria48/hospital-appointment-system.git`, and set the branch to `*/main`.
4. Leave the script path as `Jenkinsfile`, save, and select **Build Now**.

The pipeline installs dependencies, runs `npm test`, builds a local image named `hospital-appointment-system:jenkins-<build-number>`, starts it temporarily on port 3010, and checks `http://127.0.0.1:3010/health`. It removes the temporary container after the build. It does not publish an image or change the running application on port 3001.

If Jenkins reports that Docker cannot be found, keep Docker Desktop running and add its CLI directory (`C:\Users\SaiGayathri\AppData\Local\Programs\DockerDesktop\resources\bin`) to the Jenkins service PATH, then restart the Jenkins service. The pipeline also checks that path automatically on this computer.
