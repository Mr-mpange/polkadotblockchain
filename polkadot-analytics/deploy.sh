#!/bin/bash

# Polkadot Analytics Platform - Deployment Script
# This script helps deploy the platform to different environments

set -e

echo "🚀 Polkadot Analytics Platform Deployment"
echo "========================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if .env file exists
check_env() {
    if [ ! -f "config/.env" ]; then
        print_warning "No .env file found. Copying from .env.example..."
        cp config/.env.example config/.env
        print_warning "Please edit config/.env with your actual configuration values"
    fi
}

# Install dependencies
install_deps() {
    print_status "Installing dependencies..."

    # Frontend dependencies
    if [ -d "frontend" ]; then
        print_status "Installing frontend dependencies..."
        cd frontend && npm install && cd ..
    fi

    # Backend dependencies
    if [ -d "backend" ]; then
        print_status "Installing backend dependencies..."
        cd backend && npm install && cd ..
    fi

    # AI Analytics dependencies
    if [ -d "ai-analytics" ]; then
        print_status "Installing AI analytics dependencies..."
        cd ai-analytics && pip install -r requirements.txt && cd ..
    fi
}

# Build frontend
build_frontend() {
    if [ -d "frontend" ]; then
        print_status "Building frontend..."
        cd frontend && npm run build && cd ..
    fi
}

# Start services in development mode
start_dev() {
    print_status "Starting development servers..."

    # Start MongoDB (if not running)
    if ! pgrep -x "mongod" > /dev/null; then
        print_warning "MongoDB not running. Please start MongoDB first."
        print_warning "You can start it with: brew services start mongodb-community (Mac)"
        print_warning "Or: sudo systemctl start mongod (Linux)"
    fi

    # Start backend
    if [ -d "backend" ]; then
        print_status "Starting backend server (port 5000)..."
        cd backend && npm run dev &
        BACKEND_PID=$!
        cd ..
    fi

    # Start AI Analytics
    if [ -d "ai-analytics" ]; then
        print_status "Starting AI analytics server (port 8000)..."
        cd ai-analytics && python app.py &
        AI_PID=$!
        cd ..
    fi

    # Start frontend
    if [ -d "frontend" ]; then
        print_status "Starting frontend server (port 3000)..."
        cd frontend && npm run dev &
        FRONTEND_PID=$!
        cd ..
    fi

    print_status "Development servers started!"
    print_status "Frontend: http://localhost:3000"
    print_status "Backend API: http://localhost:5000"
    print_status "AI Analytics: http://localhost:8000"

    # Wait for user to stop
    print_status "Press Ctrl+C to stop all servers"

    # Cleanup function
    cleanup() {
        print_status "Stopping servers..."
        if [ ! -z "$BACKEND_PID" ]; then kill $BACKEND_PID 2>/dev/null; fi
        if [ ! -z "$AI_PID" ]; then kill $AI_PID 2>/dev/null; fi
        if [ ! -z "$FRONTEND_PID" ]; then kill $FRONTEND_PID 2>/dev/null; fi
        exit 0
    }

    trap cleanup INT TERM
    wait
}

# Run tests
run_tests() {
    print_status "Running tests..."

    # Frontend tests
    if [ -d "frontend" ]; then
        print_status "Running frontend tests..."
        cd frontend && npm test -- --coverage --watchAll=false && cd ..
    fi

    # Backend tests
    if [ -d "backend" ]; then
        print_status "Running backend tests..."
        cd backend && npm test -- --coverage --watchAll=false && cd ..
    fi
}

# Load sample data
load_sample_data() {
    if command -v mongoimport &> /dev/null; then
        print_status "Loading sample data into MongoDB..."

        if [ -d "sample-data" ]; then
            cd sample-data

            mongoimport --db polkadot_analytics --collection parachains --file parachains.json --jsonArray
            mongoimport --db polkadot_analytics --collection tvl_data --file tvl_data.json --jsonArray
            mongoimport --db polkadot_analytics --collection transactions_data --file transactions_data.json --jsonArray
            mongoimport --db polkadot_analytics --collection blocks_data --file blocks_data.json --jsonArray

            cd ..
            print_status "Sample data loaded successfully!"
        else
            print_warning "Sample data directory not found"
        fi
    else
        print_warning "mongoimport not found. Please install MongoDB tools or load data manually."
    fi
}

# Deploy to production (example)
deploy_production() {
    print_status "Deploying to production..."

    # Build frontend
    build_frontend

    # This would typically involve:
    # 1. Building Docker images
    # 2. Pushing to container registry
    # 3. Deploying to cloud platform (Heroku, AWS, etc.)

    print_warning "Production deployment requires additional setup:"
    print_warning "1. Set up Docker containers"
    print_warning "2. Configure cloud database (MongoDB Atlas)"
    print_warning "3. Set up CI/CD pipeline"
    print_warning "4. Configure domain and SSL certificates"
}

# Main menu
main_menu() {
    echo ""
    echo "Choose an option:"
    echo "1) Install dependencies"
    echo "2) Start development servers"
    echo "3) Run tests"
    echo "4) Load sample data"
    echo "5) Build for production"
    echo "6) Deploy to production"
    echo "7) Exit"
    echo ""

    read -p "Enter your choice (1-7): " choice

    case $choice in
        1)
            check_env
            install_deps
            ;;
        2)
            check_env
            start_dev
            ;;
        3)
            run_tests
            ;;
        4)
            load_sample_data
            ;;
        5)
            build_frontend
            print_status "Frontend built successfully!"
            ;;
        6)
            deploy_production
            ;;
        7)
            print_status "Goodbye!"
            exit 0
            ;;
        *)
            print_error "Invalid option"
            main_menu
            ;;
    esac
}

# Run main menu
main_menu
