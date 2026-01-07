@echo off
echo ========================================
echo    Database Migration Fix Script
echo ========================================
echo.

cd server

echo [1/4] Stopping any running processes...
echo Please close any running Node.js/npm processes if they are running.
echo.
timeout /t 3

echo [2/4] Cleaning Prisma artifacts...
if exist "node_modules\.prisma" (
    echo Removing old Prisma client...
    rmdir /s /q "node_modules\.prisma" 2>nul
)
echo.

echo [3/4] Generating fresh Prisma client...
call npm run prisma:generate
echo.

echo [4/4] Resetting database...
echo WARNING: This will delete all data in the database!
set /p confirm="Continue with database reset? (Y/N): "
if /i "%confirm%"=="Y" (
    echo Resetting database...
    call npx prisma migrate reset --force
    echo.
    echo ✅ Database reset complete!
) else (
    echo Skipped database reset.
)

echo.
echo ========================================
echo    Migration Fix Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Run start.bat to start the application
echo.
pause
