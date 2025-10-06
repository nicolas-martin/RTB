# ⚠️ IMPORTANT: Run This Migration First

Before testing the API, you **MUST** run the database migration to create the required tables in Supabase.

## Step 1: Open Supabase SQL Editor

Go to: https://supabase.com/dashboard/project/ovabsyedogcimjmgzufr/sql/new

##Step 2: Copy and Paste This SQL

Copy the **ENTIRE** SQL below and paste it into the SQL editor, then click "Run":

```sql
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
    CONSTRAINT quest_progress_unique UNIQUE (wallet_address, project_id, quest_id)
);

CREATE INDEX IF NOT EXISTS idx_quest_progress_wallet ON quest_progress(wallet_address);
CREATE INDEX IF NOT EXISTS idx_quest_progress_project ON quest_progress(project_id);
CREATE INDEX IF NOT EXISTS idx_quest_progress_wallet_project ON quest_progress(wallet_address, project_id);

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

CREATE INDEX IF NOT EXISTS idx_points_transactions_wallet ON points_transactions(wallet_address);
CREATE INDEX IF NOT EXISTS idx_points_transactions_project ON points_transactions(project_id);
CREATE INDEX IF NOT EXISTS idx_points_transactions_wallet_project ON points_transactions(wallet_address, project_id);
CREATE INDEX IF NOT EXISTS idx_points_transactions_created_at ON points_transactions(created_at DESC);

-- Add trigger to update updated_at
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

-- Enable RLS
ALTER TABLE quest_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE points_transactions ENABLE ROW LEVEL SECURITY;

-- Create policies (allow all for now - will secure later)
DROP POLICY IF EXISTS "Allow all operations on quest_progress" ON quest_progress;
CREATE POLICY "Allow all operations on quest_progress" ON quest_progress FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF NOT EXISTS "Allow all operations on points_transactions" ON points_transactions;
CREATE POLICY "Allow all operations on points_transactions" ON points_transactions FOR ALL USING (true) WITH CHECK (true);
```

## Step 3: Verify Tables Were Created

Run this query to verify:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('quest_progress', 'points_transactions');
```

You should see both tables listed.

## Step 4: You're Done!

Now you can test the API endpoints. The server is already running on http://localhost:3001
