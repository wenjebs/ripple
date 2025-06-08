#!/usr/bin/env python3
"""
Database migration script to add missing columns to goals table
Run this script to update your database schema before running the cron job
"""

import os
import sys
from pathlib import Path
from dotenv import load_dotenv
from supabase import create_client

# Load environment variables
load_dotenv()

def run_migration():
    """Run the database migration"""
    
    # Get Supabase credentials
    SUPABASE_URL = os.getenv("SUPABASE_URL")
    SUPABASE_KEY = os.getenv("SUPABASE_KEY")
    
    if not SUPABASE_URL or not SUPABASE_KEY:
        print("❌ Error: SUPABASE_URL and SUPABASE_KEY must be set in .env file")
        sys.exit(1)
    
    # Create Supabase client
    try:
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
        print("✅ Connected to Supabase")
    except Exception as e:
        print(f"❌ Failed to connect to Supabase: {e}")
        sys.exit(1)
    
    # Read migration SQL
    migration_file = Path(__file__).parent / "migrations" / "add_goal_columns.sql"
    
    if not migration_file.exists():
        print(f"❌ Migration file not found: {migration_file}")
        sys.exit(1)
    
    print(f"📖 Reading migration from: {migration_file}")
    
    with open(migration_file, 'r') as f:
        migration_sql = f.read()
    
    # Split SQL into individual statements
    statements = [stmt.strip() for stmt in migration_sql.split(';') if stmt.strip() and not stmt.strip().startswith('--')]
    
    print(f"🔄 Executing {len(statements)} SQL statements...")
    
    # Execute each statement
    for i, statement in enumerate(statements, 1):
        try:
            print(f"   {i}. Executing: {statement[:50]}...")
            
            # Use rpc to execute raw SQL
            result = supabase.rpc('exec_sql', {'sql': statement}).execute()
            
            print(f"   ✅ Statement {i} completed")
            
        except Exception as e:
            print(f"   ❌ Error in statement {i}: {e}")
            
            # Check if it's a "column already exists" error - this is OK
            if "already exists" in str(e).lower() or "duplicate" in str(e).lower():
                print(f"   ℹ️  Column/table already exists - skipping")
                continue
            else:
                print(f"   💥 Critical error - stopping migration")
                sys.exit(1)
    
    print("\n🎉 Migration completed successfully!")
    print("\n📋 Summary of changes:")
    print("   • Added 'end_date' column to goals table (auto-calculated)")
    print("   • Added 'settled_at' column to goals table")
    print("   • Created 'settlement_transactions' table")
    print("   • Added performance indexes")
    
    print("\n✅ Your database is now ready for the monthly settlement cron job!")

if __name__ == "__main__":
    print("🚀 Starting database migration...")
    print("=" * 50)
    run_migration() 