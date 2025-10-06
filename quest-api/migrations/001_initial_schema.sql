-- Create quest_progress table
CREATE TABLE IF NOT EXISTS quest_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_address TEXT NOT NULL,
    project_id TEXT NOT NULL,
    quest_id TEXT NOT NULL,
    completed BOOLEAN NOT NULL DEFAULT FALSE,
    progress NUMERIC,
    points_earned INTEGER NOT NULL DEFAULT 0,
    completed_at TIMESTAMP WITH TIME ZONE,
    last_checked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    -- Ensure one progress record per (wallet, project, quest)
    CONSTRAINT quest_progress_unique UNIQUE (wallet_address, project_id, quest_id)
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_quest_progress_wallet
    ON quest_progress(wallet_address);

CREATE INDEX IF NOT EXISTS idx_quest_progress_project
    ON quest_progress(project_id);

CREATE INDEX IF NOT EXISTS idx_quest_progress_wallet_project
    ON quest_progress(wallet_address, project_id);

-- Create points_transactions table
CREATE TABLE IF NOT EXISTS points_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_address TEXT NOT NULL,
    project_id TEXT NOT NULL,
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('earned', 'redeemed')),
    amount INTEGER NOT NULL CHECK (amount > 0),
    quest_id TEXT,
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for points queries
CREATE INDEX IF NOT EXISTS idx_points_transactions_wallet
    ON points_transactions(wallet_address);

CREATE INDEX IF NOT EXISTS idx_points_transactions_project
    ON points_transactions(project_id);

CREATE INDEX IF NOT EXISTS idx_points_transactions_wallet_project
    ON points_transactions(wallet_address, project_id);

CREATE INDEX IF NOT EXISTS idx_points_transactions_created_at
    ON points_transactions(created_at DESC);

-- Add trigger to update updated_at on quest_progress
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_quest_progress_updated_at
    BEFORE UPDATE ON quest_progress
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE quest_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE points_transactions ENABLE ROW LEVEL SECURITY;

-- Create policies to allow all operations (adjust based on your security needs)
-- Note: In production, you should implement proper authentication-based policies

CREATE POLICY "Allow all operations on quest_progress"
    ON quest_progress FOR ALL
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow all operations on points_transactions"
    ON points_transactions FOR ALL
    USING (true)
    WITH CHECK (true);

-- Comments for documentation
COMMENT ON TABLE quest_progress IS 'Stores user quest completion progress and points earned';
COMMENT ON TABLE points_transactions IS 'Stores all points transactions (earned and redeemed)';
COMMENT ON COLUMN quest_progress.wallet_address IS 'User wallet address (Ethereum format)';
COMMENT ON COLUMN quest_progress.points_earned IS 'Points earned for this quest (reward amount when completed)';
COMMENT ON COLUMN points_transactions.transaction_type IS 'Type of transaction: earned (from quest completion) or redeemed (points spent)';
