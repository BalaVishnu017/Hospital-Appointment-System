# Hospital Appointment Booking System

A local lab demonstration of patient registration and login, doctor search, appointment booking and cancellation, and administrator management. The application uses Node.js, Express and SQLite. The database and credentials are excluded from Git and Docker image layers. Use synthetic patient records for lab demonstrations.

## Run with Docker Compose

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
