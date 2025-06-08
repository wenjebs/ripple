#!/usr/bin/env python3
"""
Simple database migration to add missing columns to goals table
"""

import os
from dotenv import load_dotenv
from supabase import create_client

# Load environment variables
load_dotenv()

def run_migration():
    """Run the database migration"""
    
    SUPABASE_URL = os.getenv("SUPABASE_URL")
    SUPABASE_KEY = os.getenv("SUPABASE_KEY")
    
    if not SUPABASE_URL or not SUPABASE_KEY:
        print("❌ Error: SUPABASE_URL and SUPABASE_KEY must be set in .env file")
        return False
    
    try:
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
        print("✅ Connected to Supabase")
        
        # Check current table structure
        print("🔍 Checking current goals table structure...")
        
        # Try to query goals table to see what columns exist
        try:
            result = supabase.table("goals").select("*").limit(1).execute()
            print(f"✅ Goals table exists with {len(result.data)} rows")
        except Exception as e:
            print(f"❌ Error querying goals table: {e}")
            return False
        
        print("\n📝 To add the missing columns, please run the following SQL in your Supabase SQL Editor:")
        print("=" * 80)
        
        sql_commands = [
            "-- Add end_date column (auto-calculated from start_date + duration)",
            "ALTER TABLE goals ADD COLUMN IF NOT EXISTS end_date DATE;",
            "",
            "-- Add settled_at column for tracking settlements", 
            "ALTER TABLE goals ADD COLUMN IF NOT EXISTS settled_at TIMESTAMP WITH TIME ZONE;",
            "",
            "-- Update existing end_date values",
            "UPDATE goals SET end_date = start_date + (duration_weeks * 7) WHERE end_date IS NULL;",
            "",
            "-- Fix status constraint to allow settlement statuses",
            "ALTER TABLE goals DROP CONSTRAINT IF EXISTS goals_status_check;",
            "ALTER TABLE goals ADD CONSTRAINT goals_status_check CHECK (status IN ('incomplete', 'completed', 'settled_complete', 'settled_failed'));",
            "",
            "-- Create settlement_transactions table",
            """CREATE TABLE IF NOT EXISTS settlement_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    wallet_address VARCHAR(34) NOT NULL,
    amount_drops BIGINT NOT NULL,
    transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('refund', 'bonus', 'forfeit')),
    transaction_hash VARCHAR(100),
    settlement_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);""",
            "",
            "-- Add indexes for performance",
            "CREATE INDEX IF NOT EXISTS idx_goals_end_date_settled ON goals(end_date, settled_at);",
            "CREATE INDEX IF NOT EXISTS idx_settlement_user_date ON settlement_transactions(user_id, settlement_date);",
        ]
        
        for cmd in sql_commands:
            print(cmd)
        
        print("=" * 80)
        print("\n🎯 After running the SQL above, your cron job should work!")
        
        return True
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == "__main__":
    print("🚀 Database Migration Helper")
    print("=" * 50)
    success = run_migration()
    
    if success:
        print("\n✅ Migration instructions generated successfully!")
    else:
        print("\n❌ Migration failed!") 