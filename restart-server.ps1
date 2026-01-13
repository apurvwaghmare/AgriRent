# Restart Backend Server Script
Write-Host "🔄 Restarting Agriculture Equipment Rental Backend Server..." -ForegroundColor Cyan

# Kill any existing Node processes
Write-Host "📋 Stopping existing Node.js processes..." -ForegroundColor Yellow
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

# Wait a moment
Start-Sleep -Seconds 2

# Navigate to backend directory
Set-Location "E:\agriculture-equipment-rental-system\backend"

# Start the server
Write-Host "🚀 Starting backend server..." -ForegroundColor Green
Write-Host "📡 Server will be available at: http://localhost:5000" -ForegroundColor Blue
Write-Host "🛑 Press Ctrl+C to stop the server" -ForegroundColor Red
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Gray

node server.js