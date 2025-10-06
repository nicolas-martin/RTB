# Setup Instructions

## Step 1: Run Database Migration

You need to run the SQL migration to create the required tables in Supabase.

### Option A: Using Supabase Dashboard (Recommended)
1. Go to https://supabase.com/dashboard/project/ovabsyedogcimjmgzufr
2. Click on "SQL Editor" in the left sidebar
3. Click "New Query"
4. Copy the entire contents of `migrations/001_initial_schema.sql`
5. Paste it into the SQL editor
6. Click "Run" to execute the migration

### Option B: Using Supabase CLI
```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Run the migration
cd /Users/nma/dev/RideTheBusRN/quest-api
supabase db push --db-url postgresql://postgres:[YOUR-PASSWORD]@db.ovabsyedogcimjmgzufr.supabase.co:5432/postgres
```

## Step 2: Verify Tables Were Created

Run this query in the Supabase SQL Editor to verify:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('quest_progress', 'points_transactions');
```

You should see both tables listed.

## Step 3: Start the Quest API Server

```bash
cd /Users/nma/dev/RideTheBusRN/quest-api
npm run dev
```

The server should start on http://localhost:3001

## Step 4: Test with curl

See TEST_ENDPOINTS.md for curl commands to test all endpoints.
