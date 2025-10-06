# Quest API

Backend API for quest validation, GraphQL integration, and points management with Supabase persistence.

## Features

- ✅ Parse TOML quest definitions using `toml` library
- ✅ Validate quests against GraphQL endpoints
- ✅ Track quest progress in Supabase database
- ✅ Points earning and redemption system
- ✅ Transaction history tracking
- ✅ Support for multiple quest types (conditional, progress, custom)
- ✅ Custom validator functions

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Supabase

1. Create a new Supabase project at https://supabase.com
2. Go to the SQL Editor in your Supabase dashboard
3. Run the migration file `migrations/001_initial_schema.sql`
4. Get your project URL and anon key from Settings > API

### 3. Configure Environment Variables

Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Fill in your credentials:
```env
PORT=3001
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
```

### 4. Add Project TOML Files

Create project configuration files in `src/data/{projectId}/project.toml`:

```toml
[project]
id = "my-project"
name = "My Project"
description = "My awesome quest project"
graphqlEndpoint = "https://api.goldsky.com/api/public/..."

[[quest]]
id = "first_quest"
title = "First Quest"
description = "Complete your first quest"
reward = 100
type = "conditional"
query = """
query GetUserData($userId: String!) {
  user(id: $userId) {
    swapCount
  }
}
"""

[[quest.conditions]]
field = "user.swapCount"
operator = ">"
value = 0
```

## Development

```bash
npm run dev  # Run with tsx watch mode
```

## Production

```bash
npm run build  # Compile TypeScript
npm start      # Run compiled code
```

## Testing

```bash
npm test
```

## API Documentation

See [API.md](./API.md) for detailed endpoint documentation.

### Quick Reference

**Quests:**
- `GET /api/quests?projectId={id}` - Get quest metadata
- `GET /api/quests/progress/:wallet?projectId={id}` - Get cached progress
- `POST /api/quests/refresh/:wallet?projectId={id}` - Refresh from GraphQL

**Points:**
- `GET /api/points/:wallet?projectId={id}` - Get points summary
- `POST /api/points/redeem` - Redeem points
- `GET /api/points/transactions/:wallet?projectId={id}` - Get transaction history

## Architecture

```
quest-api/
├── src/
│   ├── database/
│   │   ├── supabaseClient.ts    # Supabase initialization
│   │   ├── questDatabase.ts     # Database operations
│   │   └── schema.ts            # TypeScript types
│   ├── models/                  # Quest type implementations
│   ├── services/
│   │   ├── questService.ts      # Core quest logic
│   │   ├── questParser.ts       # TOML parsing
│   │   └── graphqlClient.ts     # GraphQL execution
│   ├── data/                    # Project TOML files
│   └── index.ts                 # Express server
├── migrations/
│   └── 001_initial_schema.sql   # Database schema
└── API.md                       # API documentation
```

## Database Schema

### quest_progress
Stores user quest completion status and points earned.

### points_transactions
Stores all points transactions (earned from quests, redeemed for rewards).

See `migrations/001_initial_schema.sql` for full schema details.

## Migration from In-Memory to Supabase

This version replaces the in-memory quest progress storage with Supabase persistence:

**Before:** Quest progress was only stored in memory and lost on server restart.
**After:** Quest progress is persisted to Supabase and survives server restarts.

The API now:
1. Checks GraphQL on `/refresh` endpoints
2. Updates Supabase with quest progress
3. Creates points transactions when quests are completed
4. Serves cached data from Supabase on `/progress` endpoints

## Frontend Integration Flow

1. **Initial Load:**
   - Load quest metadata (fast, no user data needed)

2. **User Connects Wallet:**
   - Load cached progress from Supabase (fast)
   - Load points summary

3. **User Clicks Refresh:**
   - Fetch fresh data from GraphQL
   - Update Supabase automatically
   - Show updated progress to user

4. **User Redeems Points:**
   - Call redeem API with amount and reason
   - Update available balance
