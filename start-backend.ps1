Write-Host "=================================" -ForegroundColor Green
Write-Host "Agriculture Equipment Rental System" -ForegroundColor Green
Write-Host "Backend Server Starter" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Green
Write-Host ""

# Change to backend directory
Set-Location "E:\agriculture-equipment-rental-system\backend"

Write-Host "Current directory: $(Get-Location)" -ForegroundColor Yellow
Write-Host ""

# Check if server.js exists
if (Test-Path "server.js") {
    Write-Host "✅ server.js found!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Starting backend server..." -ForegroundColor Cyan
    Write-Host ""
    Write-Host "🌐 Server will run on: http://localhost:5000" -ForegroundColor Blue
    Write-Host "🔧 API Health check: http://localhost:5000/api/health" -ForegroundColor Blue
    Write-Host "📊 Database: agriculture" -ForegroundColor Blue
    Write-Host ""
    Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
    Write-Host "=================================" -ForegroundColor Green
    Write-Host ""
    
    # Start the server
    node server.js
} else {
    Write-Host "❌ server.js not found in backend directory!" -ForegroundColor Red
    Write-Host "Please check if you're in the correct folder." -ForegroundColor Red
    Write-Host ""
    Get-ChildItem
}

Write-Host ""
Write-Host "Server stopped." -ForegroundColor Yellow
Read-Host "Press Enter to exit"