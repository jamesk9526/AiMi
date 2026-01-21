@echo off
echo Starting AiMi in development mode...
echo.
echo Make sure Ollama is running!
echo.
start cmd /k "npm run dev:renderer"
timeout /t 3
npx electron .
