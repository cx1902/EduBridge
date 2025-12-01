@echo off
echo ========================================
echo    EduConnect Platform Startup
echo ========================================
echo.

echo [1/3] Checking if backend server is ready...
cd server
if not exist "node_modules" (
    echo Installing server dependencies...
    call npm install
)

echo.
echo [2/3] Setting up database...
echo Generating Prisma client...
call npm run prisma:generate

echo.
echo Would you like to run database migrations and seed? (Y/N)
set /p migrate="Enter choice: "
if /i "%migrate%"=="Y" (
    echo Running migrations...
    call npm run prisma:migrate
    echo.
    echo Seeding database with sample data...
    call npm run prisma:seed
)

echo.
echo [3/3] Starting backend server...
echo Server will run on http://localhost:3000
echo.
start cmd /k "cd /d %cd% && npm run dev"

cd ..\client
if not exist "node_modules" (
    echo Installing client dependencies...
    call npm install
)

echo.
echo Starting frontend application...
echo App will open at http://localhost:5173
echo.
timeout /t 3
start cmd /k "cd /d %cd% && npm run dev"

echo.
echo ========================================
echo    EduConnect is starting!
echo ========================================
echo.
echo Backend: http://localhost:3000
echo Frontend: http://localhost:5173
echo.
echo Login Credentials:
echo - Student: student@educonnect.com / Student@123
echo - Tutor: tutor@educonnect.com / Tutor@123
echo - Admin: admin@educonnect.com / Admin@123
echo.
echo Press any key to exit this window...
pause >nul
