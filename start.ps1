# CommunityMap Quick Start Script for Windows PowerShell
# This script helps you start the CommunityMap application quickly

Write-Host ""
Write-Host "🗺️  CommunityMap Quick Start" -ForegroundColor Cyan
Write-Host "==============================" -ForegroundColor Cyan
Write-Host ""

# Check prerequisites
Write-Host "Checking prerequisites..." -ForegroundColor Blue

# Check Java
try {
    $javaVersion = java -version 2>&1 | Select-String "version" | ForEach-Object { $_.Line.Split('"')[1] }
    $javaMajorVersion = [int]($javaVersion.Split('.')[0])
    if ($javaMajorVersion -ge 17) {
        Write-Host "✓ Java $javaVersion found" -ForegroundColor Green
    } else {
        Write-Host "✗ Java 17+ required (found $javaVersion)" -ForegroundColor Red
        Write-Host "Please install Java 17+ from https://adoptium.net/" -ForegroundColor Yellow
        Read-Host "Press Enter to exit"
        exit 1
    }
} catch {
    Write-Host "✗ Java not found" -ForegroundColor Red
    Write-Host "Please install Java 17+ from https://adoptium.net/" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

# Check Node.js
try {
    $nodeVersion = node --version
    $nodeMajorVersion = [int]($nodeVersion.Substring(1).Split('.')[0])
    if ($nodeMajorVersion -ge 16) {
        Write-Host "✓ Node.js $nodeVersion found" -ForegroundColor Green
    } else {
        Write-Host "✗ Node.js 16+ required (found $nodeVersion)" -ForegroundColor Red
        Write-Host "Please install Node.js 16+ from https://nodejs.org/" -ForegroundColor Yellow
        Read-Host "Press Enter to exit"
        exit 1
    }
} catch {
    Write-Host "✗ Node.js not found" -ForegroundColor Red
    Write-Host "Please install Node.js 16+ from https://nodejs.org/" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

# Check MongoDB
try {
    $mongoVersion = mongod --version 2>&1 | Select-String "version" | Select-Object -First 1
    Write-Host "✓ MongoDB found" -ForegroundColor Green
} catch {
    Write-Host "⚠ MongoDB not found in PATH" -ForegroundColor Yellow
    Write-Host "Please ensure MongoDB is installed and running" -ForegroundColor Yellow
}

# Check Maven
try {
    $mavenVersion = mvn --version 2>&1 | Select-String "Apache Maven" | ForEach-Object { $_.Line.Split(' ')[2] }
    Write-Host "✓ Maven $mavenVersion found" -ForegroundColor Green
} catch {
    Write-Host "✗ Maven not found" -ForegroundColor Red
    Write-Host "Please install Maven from https://maven.apache.org/download.cgi" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""

# Check if ports are available
Write-Host "Checking port availability..." -ForegroundColor Blue

# Check port 8080
$port8080 = Get-NetTCPConnection -LocalPort 8080 -ErrorAction SilentlyContinue
if ($port8080) {
    Write-Host "⚠ Port 8080 is in use" -ForegroundColor Yellow
    Write-Host "Backend may not start properly" -ForegroundColor Yellow
} else {
    Write-Host "✓ Port 8080 is available" -ForegroundColor Green
}

# Check port 3000
$port3000 = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
if ($port3000) {
    Write-Host "⚠ Port 3000 is in use" -ForegroundColor Yellow
    Write-Host "Frontend may not start properly" -ForegroundColor Yellow
} else {
    Write-Host "✓ Port 3000 is available" -ForegroundColor Green
}

Write-Host ""

# Start MongoDB if not running
Write-Host "Starting MongoDB..." -ForegroundColor Blue
$mongoProcess = Get-Process -Name "mongod" -ErrorAction SilentlyContinue
if (-not $mongoProcess) {
    Write-Host "Starting MongoDB service..."
    try {
        Start-Service MongoDB -ErrorAction Stop
        Write-Host "✓ MongoDB started" -ForegroundColor Green
    } catch {
        Write-Host "⚠ Could not start MongoDB service" -ForegroundColor Yellow
        Write-Host "Please start MongoDB manually: mongod" -ForegroundColor Yellow
    }
} else {
    Write-Host "✓ MongoDB is already running" -ForegroundColor Green
}

Write-Host ""

# Install frontend dependencies if needed
if (-not (Test-Path "frontend\node_modules")) {
    Write-Host "Installing frontend dependencies..." -ForegroundColor Blue
    Set-Location frontend
    npm install
    Set-Location ..
    Write-Host "✓ Frontend dependencies installed" -ForegroundColor Green
} else {
    Write-Host "✓ Frontend dependencies already installed" -ForegroundColor Green
}

Write-Host ""

# Start the application
Write-Host "Starting CommunityMap..." -ForegroundColor Blue
Write-Host ""

# Start backend
Write-Host "Starting backend (Spring Boot)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "mvn spring-boot:run" -WindowStyle Normal

# Wait for backend to start
Write-Host "Waiting for backend to start..."
Start-Sleep -Seconds 15

# Check if backend started successfully
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8080/actuator/health" -TimeoutSec 5 -ErrorAction Stop
    Write-Host "✓ Backend started successfully" -ForegroundColor Green
} catch {
    Write-Host "⚠ Backend may still be starting..." -ForegroundColor Yellow
}

# Start frontend
Write-Host "Starting frontend (React)..." -ForegroundColor Yellow
Set-Location frontend
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm start" -WindowStyle Normal
Set-Location ..

Write-Host ""
Write-Host "🎉 CommunityMap is starting!" -ForegroundColor Green
Write-Host ""
Write-Host "Access the application:" -ForegroundColor Blue
Write-Host "  Frontend: http://localhost:3000" -ForegroundColor White
Write-Host "  Backend API: http://localhost:8080/api/resources" -ForegroundColor White
Write-Host "  Health Check: http://localhost:8080/actuator/health" -ForegroundColor White
Write-Host ""
Write-Host "To stop the application, run: .\stop.ps1" -ForegroundColor Yellow
Write-Host ""
Read-Host "Press Enter to continue"
