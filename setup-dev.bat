@echo off
echo 🚀 Setting up SynapEvents Development Environment
echo.

:: Check if backend .env exists
if not exist "backend\.env" (
    echo 🔧 Creating backend .env file...
    copy /Y "backend\.env.example" "backend\.env"
    echo ⚠️  Please update the backend\.env file with your configuration
) else (
    echo ✅ Backend .env file already exists
)

:: Check if frontend .env.local exists
if not exist "frontend\.env.local" (
    echo 🔧 Creating frontend .env.local file...
    copy /Y "frontend\.env.local.example" "frontend\.env.local"
    echo ⚠️  Please update the frontend\.env.local file with your configuration
) else (
    echo ✅ Frontend .env.local file already exists
)

echo.
echo 📦 Installing dependencies...
echo.

:: Install backend dependencies
cd backend
if not exist "node_modules" (
    echo 📥 Installing backend dependencies...
    call npm install
) else (
    echo ✅ Backend dependencies already installed
)
cd ..

:: Install frontend dependencies
cd frontend
if not exist "node_modules" (
    echo 📥 Installing frontend dependencies...
    call npm install
) else (
    echo ✅ Frontend dependencies already installed
)
cd ..

echo.
echo ✨ Setup complete! Here's how to run the application:
echo.
echo 1. Start the backend:
echo    cd backend ^&^& npm run dev
echo.
echo 2. In a new terminal, start the frontend:
echo    cd frontend ^&^& npm run dev
echo.
echo 3. Open your browser to http://localhost:3000
echo.
echo Happy coding! 🚀
pause
