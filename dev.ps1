# Start AiMi in development mode
Write-Host "Starting AiMi in development mode..." -ForegroundColor Cyan
Write-Host ""
Write-Host "Make sure Ollama is running!" -ForegroundColor Yellow
Write-Host ""

# Start the webpack dev server in a new window
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run dev:renderer"

# Wait for webpack to start
Start-Sleep -Seconds 3

# Set environment and start Electron
$env:NODE_ENV = "development"
npx electron .
