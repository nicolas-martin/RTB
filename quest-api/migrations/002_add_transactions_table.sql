-- Create wallet_transactions table to store all blockchain transactions
CREATE TABLE IF NOT EXISTS wallet_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_address TEXT NOT NULL,
    project_id TEXT NOT NULL,
    transaction_hash TEXT NOT NULL,
    transaction_type TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    amount TEXT NOT NULL,
    points_earned INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    -- Ensure one record per transaction hash
    CONSTRAINT wallet_transactions_unique UNIQUE (transaction_hash)
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_wallet
    ON wallet_transactions(wallet_address);

CREATE INDEX IF NOT EXISTS idx_wallet_transactions_project
    ON wallet_transactions(project_id);

CREATE INDEX IF NOT EXISTS idx_wallet_transactions_wallet_project
    ON wallet_transactions(wallet_address, project_id);

CREATE INDEX IF NOT EXISTS idx_wallet_transactions_timestamp
    ON wallet_transactions(timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_wallet_transactions_hash
    ON wallet_transactions(transaction_hash);

-- Enable Row Level Security (RLS)
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (adjust based on your security needs)
CREATE POLICY "Allow all operations on wallet_transactions"
    ON wallet_transactions FOR ALL
    USING (true)
    WITH CHECK (true);

-- Comments for documentation
COMMENT ON TABLE wallet_transactions IS 'Stores all blockchain transactions for wallets across projects';
COMMENT ON COLUMN wallet_transactions.wallet_address IS 'User wallet address (Ethereum format)';
COMMENT ON COLUMN wallet_transactions.transaction_hash IS 'Unique blockchain transaction hash';
COMMENT ON COLUMN wallet_transactions.transaction_type IS 'Type of transaction (supply, borrow, swap, etc.)';
COMMENT ON COLUMN wallet_transactions.amount IS 'Transaction amount as string to preserve precision';
COMMENT ON COLUMN wallet_transactions.points_earned IS 'Points earned from this transaction';
