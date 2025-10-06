# Quest API Documentation

## Setup

1. Install dependencies:
```bash
npm install
```

2. Set up Supabase:
   - Create a new Supabase project
   - Run the migration in `migrations/001_initial_schema.sql` in the Supabase SQL editor
   - Copy `.env.example` to `.env` and fill in your Supabase credentials

3. Add project TOML files to `src/data/{projectId}/project.toml`

4. Run the server:
```bash
npm run dev  # Development
npm run build && npm start  # Production
```

## API Endpoints

### Quest Endpoints

#### 1. Get All Quests (Metadata Only)
```http
GET /api/quests?projectId={projectId}
```

**Response:**
```json
[
  {
    "id": "first_swap",
    "title": "First Swap",
    "description": "Complete your first swap",
    "reward": 100,
    "type": "conditional",
    "query": "...",
    "startDate": "2024-01-01T00:00:00Z",
    "endDate": "2024-12-31T23:59:59Z"
  }
]
```

#### 2. Get Cached Quest Progress
```http
GET /api/quests/progress/{walletAddress}?projectId={projectId}
```

**Response:**
```json
[
  {
    "id": "first_swap",
    "title": "First Swap",
    "description": "Complete your first swap",
    "reward": 100,
    "type": "conditional",
    "query": "...",
    "completed": true,
    "progress": 1
  }
]
```

#### 3. Refresh Quest Progress (Check GraphQL)
```http
POST /api/quests/refresh/{walletAddress}?projectId={projectId}
```

**Response:** Same as cached progress, but fetches fresh data from GraphQL and updates Supabase.

### Points Endpoints

#### 4. Get Points Summary
```http
GET /api/points/{walletAddress}?projectId={projectId}
```

**Response:**
```json
[
  {
    "wallet_address": "0x123...",
    "project_id": "goldsky-test",
    "total_earned": 500,
    "total_redeemed": 100,
    "available": 400
  }
]
```

#### 5. Redeem Points
```http
POST /api/points/redeem
Content-Type: application/json

{
  "walletAddress": "0x123...",
  "projectId": "goldsky-test",
  "amount": 100,
  "reason": "NFT Purchase"
}
```

**Response:**
```json
{
  "wallet_address": "0x123...",
  "project_id": "goldsky-test",
  "total_earned": 500,
  "total_redeemed": 200,
  "available": 300
}
```

**Error (Insufficient Balance):**
```json
{
  "error": "Insufficient points balance"
}
```

#### 6. Get Transaction History
```http
GET /api/points/transactions/{walletAddress}?projectId={projectId}
```

**Response:**
```json
[
  {
    "id": "uuid",
    "wallet_address": "0x123...",
    "project_id": "goldsky-test",
    "transaction_type": "earned",
    "amount": 100,
    "quest_id": "first_swap",
    "reason": null,
    "created_at": "2024-01-15T10:30:00Z"
  },
  {
    "id": "uuid",
    "wallet_address": "0x123...",
    "project_id": "goldsky-test",
    "transaction_type": "redeemed",
    "amount": 100,
    "quest_id": null,
    "reason": "NFT Purchase",
    "created_at": "2024-01-16T14:20:00Z"
  }
]
```

## Frontend Integration Flow

1. **Initial Load:**
   ```javascript
   // Load quest metadata (fast, no user data)
   const quests = await fetch(`/api/quests?projectId=${projectId}`);
   ```

2. **User Connects Wallet:**
   ```javascript
   // Load cached progress from Supabase (fast)
   const progress = await fetch(`/api/quests/progress/${walletAddress}?projectId=${projectId}`);

   // Load points summary
   const points = await fetch(`/api/points/${walletAddress}?projectId=${projectId}`);
   ```

3. **User Clicks Refresh:**
   ```javascript
   // Fetch fresh data from GraphQL, update Supabase
   const freshProgress = await fetch(
     `/api/quests/refresh/${walletAddress}?projectId=${projectId}`,
     { method: 'POST' }
   );
   ```

4. **User Redeems Points:**
   ```javascript
   const result = await fetch('/api/points/redeem', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({
       walletAddress,
       projectId,
       amount: 100,
       reason: 'NFT Purchase'
     })
   });
   ```

## Database Schema

### quest_progress
- `id` - UUID primary key
- `wallet_address` - User's wallet address
- `project_id` - Project identifier
- `quest_id` - Quest identifier
- `completed` - Boolean completion status
- `progress` - Numeric progress value (nullable)
- `points_earned` - Points earned for this quest
- `completed_at` - Timestamp when completed
- `last_checked_at` - Last time this was checked
- Unique constraint: `(wallet_address, project_id, quest_id)`

### points_transactions
- `id` - UUID primary key
- `wallet_address` - User's wallet address
- `project_id` - Project identifier
- `transaction_type` - 'earned' | 'redeemed'
- `amount` - Points amount (positive integer)
- `quest_id` - Quest ID (for 'earned' transactions)
- `reason` - Reason for redemption (for 'redeemed' transactions)
- `created_at` - Transaction timestamp
