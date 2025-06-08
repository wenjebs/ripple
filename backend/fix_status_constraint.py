#!/usr/bin/env python3
"""
Fix the status constraint to allow settlement statuses
"""

import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

def fix_status_constraint():
    """Fix the status constraint to allow settlement statuses"""
    
    SUPABASE_URL = os.getenv("SUPABASE_URL")
    SUPABASE_KEY = os.getenv("SUPABASE_KEY")
    
    if not SUPABASE_URL or not SUPABASE_KEY:
        print("❌ Error: SUPABASE_URL and SUPABASE_KEY must be set in .env file")
        return False
    
    try:
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
        print("✅ Connected to Supabase")
        
        print("\n🔧 To fix the status constraint, run this SQL in Supabase SQL Editor:")
        print("=" * 80)
        
        sql_commands = [
            "-- Drop the existing status constraint",
            "ALTER TABLE goals DROP CONSTRAINT IF EXISTS goals_status_check;",
            "",
            "-- Add new constraint with settlement statuses",
            "ALTER TABLE goals ADD CONSTRAINT goals_status_check CHECK (status IN ('incomplete', 'completed', 'settled_complete', 'settled_failed'));",
        ]
        
        for cmd in sql_commands:
            print(cmd)
        
        print("=" * 80)
        print("\n✅ After running this SQL, your cron job will work completely!")
        
        return True
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == "__main__":
    print("🔧 Status Constraint Fix")
    print("=" * 50)
    fix_status_constraint() 