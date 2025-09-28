@echo off
REM Setup script for Finance App development environment (Windows)

echo Setting up Finance App development environment...

REM Check if Docker is installed
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Docker is required but not installed. Please install Docker Desktop.
    pause
    exit /b 1
)

REM Check if Docker Compose is installed
docker-compose --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Docker Compose is required but not installed. Please install Docker Desktop.
    pause
    exit /b 1
)

REM Create environment file if it doesn't exist
if not exist backend\.env (
    echo Creating backend\.env from template...
    copy backend\.env.example backend\.env
    echo Please edit backend\.env with your configuration before proceeding
)

REM Build and start services
echo Building and starting Docker services...
cd docker
docker-compose up --build -d

REM Wait for services to be ready
echo Waiting for services to be ready...
timeout /t 10 /nobreak > nul

REM Check if services are running
docker-compose ps | findstr "Up" >nul
if %errorlevel% equ 0 (
    echo Services are running!
    echo.
    echo Application URLs:
    echo    Frontend: http://localhost:3000
    echo    Backend API: http://localhost:8000
    echo    API Docs: http://localhost:8000/docs
    echo.
    echo Database and Redis are running on default ports
    echo    PostgreSQL: localhost:5432
    echo    Redis: localhost:6379
) else (
    echo Some services failed to start. Check logs with: docker-compose logs
    pause
    exit /b 1
)

echo Setup complete! Happy coding!
pause