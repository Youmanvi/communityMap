# CommunityMap Docker Scripts for Windows PowerShell
# Easy Docker management for Windows users

Write-Host ""
Write-Host "🐳 CommunityMap Docker Manager" -ForegroundColor Cyan
Write-Host "==============================" -ForegroundColor Cyan
Write-Host ""

# Check if Docker is installed
try {
    $dockerVersion = docker --version
    Write-Host "✓ Docker found: $dockerVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Docker not found" -ForegroundColor Red
    Write-Host "Please install Docker Desktop from https://www.docker.com/products/docker-desktop" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

# Check if Docker Compose is available
try {
    $composeVersion = docker compose version
    Write-Host "✓ Docker Compose found: $composeVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Docker Compose not found" -ForegroundColor Red
    Write-Host "Please ensure Docker Compose is installed" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""

# Menu options
Write-Host "Select an option:" -ForegroundColor Blue
Write-Host "1. Start Development Environment" -ForegroundColor White
Write-Host "2. Start Production Environment" -ForegroundColor White
Write-Host "3. Stop All Services" -ForegroundColor White
Write-Host "4. View Logs" -ForegroundColor White
Write-Host "5. Clean Up (Remove containers and volumes)" -ForegroundColor White
Write-Host "6. Exit" -ForegroundColor White
Write-Host ""

$choice = Read-Host "Enter your choice (1-6)"

switch ($choice) {
    "1" {
        Write-Host "Starting Development Environment..." -ForegroundColor Yellow
        Write-Host "This will start MongoDB and Backend services" -ForegroundColor Blue
        Write-Host "Frontend should be run separately with: .\start.ps1" -ForegroundColor Blue
        docker compose -f docker-compose.dev.yml up -d
        Write-Host "✓ Development environment started" -ForegroundColor Green
        Write-Host "Backend: http://localhost:8080" -ForegroundColor White
        Write-Host "MongoDB: localhost:27017" -ForegroundColor White
    }
    "2" {
        Write-Host "Starting Production Environment..." -ForegroundColor Yellow
        Write-Host "This will start MongoDB, Backend, and Frontend services" -ForegroundColor Blue
        docker compose --profile prod up -d
        Write-Host "✓ Production environment started" -ForegroundColor Green
        Write-Host "Frontend: http://localhost" -ForegroundColor White
        Write-Host "Backend: http://localhost:8080" -ForegroundColor White
    }
    "3" {
        Write-Host "Stopping All Services..." -ForegroundColor Yellow
        docker compose -f docker-compose.dev.yml down
        docker compose --profile prod down
        Write-Host "✓ All services stopped" -ForegroundColor Green
    }
    "4" {
        Write-Host "Viewing Logs..." -ForegroundColor Yellow
        Write-Host "Select service to view logs:" -ForegroundColor Blue
        Write-Host "1. Backend" -ForegroundColor White
        Write-Host "2. MongoDB" -ForegroundColor White
        Write-Host "3. Frontend (if running)" -ForegroundColor White
        
        $logChoice = Read-Host "Enter your choice (1-3)"
        
        switch ($logChoice) {
            "1" { docker compose logs -f backend }
            "2" { docker compose logs -f mongodb }
            "3" { docker compose logs -f frontend-prod }
            default { Write-Host "Invalid choice" -ForegroundColor Red }
        }
    }
    "5" {
        Write-Host "Cleaning Up..." -ForegroundColor Yellow
        Write-Host "This will remove all containers, networks, and volumes" -ForegroundColor Red
        $confirm = Read-Host "Are you sure? (y/N)"
        if ($confirm -eq "y" -or $confirm -eq "Y") {
            docker compose -f docker-compose.dev.yml down -v --remove-orphans
            docker compose --profile prod down -v --remove-orphans
            docker system prune -f
            Write-Host "✓ Cleanup completed" -ForegroundColor Green
        } else {
            Write-Host "Cleanup cancelled" -ForegroundColor Yellow
        }
    }
    "6" {
        Write-Host "Goodbye!" -ForegroundColor Green
        exit 0
    }
    default {
        Write-Host "Invalid choice" -ForegroundColor Red
    }
}

Write-Host ""
Read-Host "Press Enter to continue"
