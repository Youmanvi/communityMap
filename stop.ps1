# CommunityMap Stop Script for Windows PowerShell
# This script stops the CommunityMap application

Write-Host "🛑 Stopping CommunityMap..." -ForegroundColor Red

# Function to kill process by port
function Stop-ProcessByPort {
    param([int]$Port)
    
    $processes = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess
    if ($processes) {
        foreach ($pid in $processes) {
            Write-Host "Stopping process on port $Port (PID: $pid)"
            try {
                Stop-Process -Id $pid -Force -ErrorAction Stop
                Write-Host "✓ Port $Port freed" -ForegroundColor Green
            } catch {
                Write-Host "⚠ Could not stop process on port $Port" -ForegroundColor Yellow
            }
        }
    } else {
        Write-Host "No process found on port $Port" -ForegroundColor Yellow
    }
}

# Stop processes
Write-Host "Stopping backend (port 8080)..." -ForegroundColor Blue
Stop-ProcessByPort -Port 8080

Write-Host "Stopping frontend (port 3000)..." -ForegroundColor Blue
Stop-ProcessByPort -Port 3000

# Kill any remaining Java processes (Spring Boot)
Write-Host "Stopping any remaining Spring Boot processes..." -ForegroundColor Blue
$javaProcesses = Get-Process -Name "java" -ErrorAction SilentlyContinue
if ($javaProcesses) {
    $javaProcesses | Stop-Process -Force -ErrorAction SilentlyContinue
    Write-Host "✓ Java processes stopped" -ForegroundColor Green
}

# Kill any remaining Node processes (React)
Write-Host "Stopping any remaining React processes..." -ForegroundColor Blue
$nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    $nodeProcesses | Stop-Process -Force -ErrorAction SilentlyContinue
    Write-Host "✓ Node processes stopped" -ForegroundColor Green
}

# Clean up log files
if (Test-Path "backend.log") {
    Write-Host "Cleaning up backend.log..." -ForegroundColor Blue
    Remove-Item "backend.log" -Force
}

if (Test-Path "frontend.log") {
    Write-Host "Cleaning up frontend.log..." -ForegroundColor Blue
    Remove-Item "frontend.log" -Force
}

Write-Host ""
Write-Host "✓ CommunityMap stopped successfully" -ForegroundColor Green
Write-Host ""
Write-Host "To start again, run: .\start.ps1" -ForegroundColor Yellow
Read-Host "Press Enter to continue"
