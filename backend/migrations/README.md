# Database Migration: Add Goal Columns

## Problem
The monthly settlement cron job requires `end_date` and `settled_at` columns in the `goals` table, but they don't exist in the current schema.

## Error Fixed
```
postgrest.exceptions.APIError: {'code': '42703', 'message': 'column goals.end_date does not exist'}
```

## Quick Fix

### Option 1: Run Migration Helper (Recommended)
```bash
cd backend
python simple_migration.py
```

This will generate the exact SQL you need to run.

### Option 2: Manual SQL in Supabase Dashboard

1. Go to your Supabase dashboard → SQL Editor
2. Run this SQL:

```sql
-- Add missing columns to goals table
ALTER TABLE goals ADD COLUMN IF NOT EXISTS end_date DATE;
ALTER TABLE goals ADD COLUMN IF NOT EXISTS settled_at TIMESTAMP WITH TIME ZONE;

-- Update existing end_date values
UPDATE goals SET end_date = start_date + (duration_weeks * 7) WHERE end_date IS NULL;

-- Create settlement_transactions table
CREATE TABLE IF NOT EXISTS settlement_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    wallet_address VARCHAR(34) NOT NULL,
    amount_drops BIGINT NOT NULL,
    transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('refund', 'bonus', 'forfeit')),
    transaction_hash VARCHAR(100),
    settlement_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Add performance indexes
CREATE INDEX IF NOT EXISTS idx_goals_end_date_settled ON goals(end_date, settled_at);
CREATE INDEX IF NOT EXISTS idx_settlement_user_date ON settlement_transactions(user_id, settlement_date);
```

## What This Migration Does

### 1. **Adds `end_date` Column**
- Calculated as `start_date + (duration_weeks * 7)`
- Used by cron job to find goals that have ended

### 2. **Adds `settled_at` Column**
- Tracks when monthly settlement was processed
- Prevents duplicate settlements

### 3. **Creates `settlement_transactions` Table**
- Logs all settlement transactions (refunds, bonuses, forfeitures)
- Required for audit trail and debugging

### 4. **Adds Performance Indexes**
- Speeds up settlement queries
- Optimizes monthly cron job performance

## After Migration

Your cron job should now work without errors:

```bash
cd backend/cron
python cron.py
```

You should see:
```
🚀 Starting Monthly Settlement Process...
==================================================
Found X goals eligible for settlement
```

Instead of the column error! 🎉 