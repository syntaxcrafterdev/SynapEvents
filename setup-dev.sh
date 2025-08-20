#!/bin/bash
echo "🚀 Setting up SynapEvents Development Environment"

# Copy environment files
echo "📋 Setting up environment files..."

# Backend setup
if [ ! -f "backend/.env" ]; then
  echo "🔧 Creating backend .env file..."
  cp backend/.env.example backend/.env
  echo "⚠️ Please update the backend/.env file with your configuration"
else
  echo "✅ Backend .env file already exists"
fi

# Frontend setup
if [ ! -f "frontend/.env.local" ]; then
  echo "🔧 Creating frontend .env.local file..."
  cp frontend/.env.local.example frontend/.env.local
  echo "⚠️ Please update the frontend/.env.local file with your configuration"
else
  echo "✅ Frontend .env.local file already exists"
fi

# Install dependencies
echo "📦 Installing dependencies..."

# Install backend dependencies
cd backend
if [ ! -d "node_modules" ]; then
  echo "📥 Installing backend dependencies..."
  npm install
else
  echo "✅ Backend dependencies already installed"
fi
cd ..

# Install frontend dependencies
cd frontend
if [ ! -d "node_modules" ]; then
  echo "📥 Installing frontend dependencies..."
  npm install
else
  echo "✅ Frontend dependencies already installed"
fi
cd ..

echo ""
echo "✨ Setup complete! Here's how to run the application:"
echo ""
echo "1. Start the backend:"
echo "   cd backend && npm run dev"
echo ""
echo "2. In a new terminal, start the frontend:"
echo "   cd frontend && npm run dev"
echo ""
echo "3. Open your browser to http://localhost:3000"
echo ""
echo "Happy coding! 🚀"

exit 0
