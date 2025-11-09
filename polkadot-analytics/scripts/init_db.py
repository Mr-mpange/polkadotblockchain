#!/usr/bin/env python3
"""
Initialize the database and run migrations.
"""
import os
import sys
from pathlib import Path
from alembic.config import Config
from alembic import command
from dotenv import load_dotenv

# Add the project root to the Python path
project_root = str(Path(__file__).parent.parent)
sys.path.insert(0, project_root)

# Load environment variables
load_dotenv()

def run_migrations():
    """Run database migrations using Alembic."""
    # Get database URL from environment
    db_url = os.getenv("DATABASE_URI")
    if not db_url:
        raise ValueError("DATABASE_URI environment variable not set")
    
    # Set up Alembic config
    alembic_cfg = Config("alembic.ini")
    alembic_cfg.set_main_option("sqlalchemy.url", db_url)
    
    # Run migrations
    print("Running database migrations...")
    command.upgrade(alembic_cfg, "head")
    print("Database migrations completed successfully.")

def init_db():
    """Initialize the database."""
    try:
        # Run migrations
        run_migrations()
        
        # Add any additional initialization code here
        print("Database initialization completed successfully.")
        
    except Exception as e:
        print(f"Error initializing database: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    init_db()
