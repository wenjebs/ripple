-- Migration: Add end_date and settled_at columns to goals table
-- Date: 2024-01-15

-- Add end_date column (computed from start_date + duration_weeks)
ALTER TABLE goals 
ADD COLUMN IF NOT EXISTS end_date DATE GENERATED ALWAYS AS (start_date + (duration_weeks * 7)) STORED;

-- Add settled_at column for tracking settlement status
ALTER TABLE goals 
ADD COLUMN IF NOT EXISTS settled_at TIMESTAMP WITH TIME ZONE;

-- Fix status constraint to allow settlement statuses
ALTER TABLE goals DROP CONSTRAINT IF EXISTS goals_status_check;
ALTER TABLE goals ADD CONSTRAINT goals_status_check CHECK (status IN ('incomplete', 'completed', 'settled_complete', 'settled_failed'));

-- Create settlement_transactions table if it doesn't exist
CREATE TABLE IF NOT EXISTS settlement_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    wallet_address VARCHAR(34) NOT NULL,
    amount_drops BIGINT NOT NULL,
    transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('refund', 'bonus', 'forfeit')),
    transaction_hash VARCHAR(100),
    settlement_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Add index for faster settlement queries
CREATE INDEX IF NOT EXISTS idx_goals_end_date_settled ON goals(end_date, settled_at);
CREATE INDEX IF NOT EXISTS idx_settlement_user_date ON settlement_transactions(user_id, settlement_date);

COMMENT ON COLUMN goals.end_date IS 'Automatically calculated end date based on start_date + duration_weeks';
COMMENT ON COLUMN goals.settled_at IS 'Timestamp when monthly settlement was processed for this goal';
COMMENT ON TABLE settlement_transactions IS 'Log of all settlement transactions (refunds, bonuses, forfeitures)'; 