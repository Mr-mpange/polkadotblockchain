#!/bin/bash

echo "=========================================="
echo "Polkadot Analytics - Environment Setup"
echo "=========================================="
echo ""

# Function to copy env file if it doesn't exist
setup_env_file() {
    local dir=$1
    local component=$2
    
    if [ ! -f "$dir/.env" ]; then
        echo "📝 Setting up $component environment file..."
        cp "$dir/.env.example" "$dir/.env"
        echo "✅ Created $dir/.env"
    else
        echo "⚠️  $dir/.env already exists, skipping..."
    fi
}

# Setup backend environment
setup_env_file "./backend" "Backend"

# Setup frontend environment
setup_env_file "./frontend" "Frontend"

# Setup AI analytics environment
setup_env_file "./ai-analytics" "AI Analytics"

echo ""
echo "=========================================="
echo "✨ Environment files created successfully!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Edit the .env files with your specific configuration"
echo "2. Make sure MongoDB is running (or use Docker Compose)"
echo "3. Run 'npm install' in backend and frontend directories"
echo "4. Run 'pip install -r requirements.txt' in ai-analytics directory"
echo ""
echo "To start all services with Docker:"
echo "  docker-compose up -d"
echo ""
echo "To start services individually:"
echo "  Backend:       cd backend && npm run dev"
echo "  Frontend:      cd frontend && npm run dev"
echo "  AI Analytics:  cd ai-analytics && python app.py"
echo ""
