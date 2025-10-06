# Profile Page - Real Earning History

## Summary

Updated the profile page to fetch and display **real earning history** from the quest API instead of mock data.

## Changes Made

### 1. Created `EarningHistory` Component
**File:** `/Users/nma/dev/RideTheBusRN/site/src/components/EarningHistory.tsx`

**Features:**
- Fetches completed quests from all projects (rtb, gluex)
- Displays quest completion timestamp, points earned, quest title, and project
- Shows loading state while fetching
- Shows empty state when no wallet connected
- Shows empty state when no quests completed
- Sorts by completion date (newest first)

**Data Flow:**
```typescript
1. Get wallet address from useQuestData()
2. For each project (rtb, gluex):
   - Fetch quest metadata: questApiClient.getQuests(projectId)
   - Fetch progress data: questApiClient.getCachedProgress(wallet, projectId)
   - Filter for completed quests only (completed === true)
   - Join metadata with progress data
3. Combine all projects
4. Sort by completed_at (DESC)
5. Display in table
```

### 2. Updated Profile Page
**File:** `/Users/nma/dev/RideTheBusRN/site/src/pages/profile.astro`

**Changes:**
- Removed mock earning history table
- Added `<EarningHistory client:only="react" />` component
- Component must use `client:only="react"` to avoid SSR context issues

### 3. Styling
**File:** `/Users/nma/dev/RideTheBusRN/site/src/components/EarningHistory.css`

- Matches existing profile page design
- Responsive table layout
- Mobile: Hides project column on small screens

## Data Structure

**quest_progress table fields used:**
```typescript
interface QuestProgress {
  quest_id: string;         // Quest identifier
  completed: boolean;        // Completion status
  completed_at: string;      // ISO timestamp when completed
  points_earned: number;     // Points awarded
}
```

**Quest metadata fields used:**
```typescript
interface Quest {
  id: string;       // Quest identifier
  title: string;    // Quest display name
}
```

**Display format:**
```
| Timestamp              | Reward Amount | Quest Title          | Project |
|------------------------|---------------|----------------------|---------|
| 2025-01-15 14:32:00   | +1000 Points  | Win 1 Game on RTB    | RTB     |
| 2025-01-14 09:15:00   | +4000 Points  | Play 10 Games        | RTB     |
```

## States Handled

1. **Not Connected:** "Connect your wallet to view your earning history"
2. **Loading:** "Loading..."
3. **Error:** "Error: {message}"
4. **No Completions:** "No completed quests yet. Start completing quests to earn points!"
5. **Has Completions:** Display table sorted by date

## API Endpoints Used

```
GET /api/quests?projectId=rtb          → Quest metadata
GET /api/quests?projectId=gluex        → Quest metadata
GET /api/quests/progress/:wallet?projectId=rtb   → Progress data
GET /api/quests/progress/:wallet?projectId=gluex → Progress data
```

## Why client:only="react"?

The component uses React Context (`useQuestData`) which requires:
1. `QuestProvider` wrapper (provides context)
2. Client-side only rendering (no SSR)

Using `client:only="react"` ensures:
- No server-side rendering attempt
- Context is available when component mounts
- No hydration mismatches

## Example Output

**When wallet connected and quests completed:**

| Timestamp           | Reward Amount | Quest Title                 | Project |
|---------------------|---------------|-----------------------------|---------|
| 1/15/2025, 2:32 PM  | +1,000 Points | Win 1 Game on RTB          | RTB     |
| 1/14/2025, 9:15 AM  | +4,000 Points | Play 10 Games on RTB       | RTB     |
| 1/13/2025, 4:45 PM  | +2,000 Points | Bet 0.5 XPL in total       | RTB     |
| 1/12/2025, 11:20 AM | +500 Points   | Provide liquidity          | GLUEX   |

## Dependencies

**Frontend:**
- `questApiClient` - API communication
- `useQuestData` - Wallet connection context
- `QUEST_PROJECT_IDS` - List of all projects

**Backend:**
- `quest_progress` table in Supabase
- Quest metadata from TOML files

## Next Steps

To see real data in the earning history:

1. **Run Supabase migration** - Create `quest_progress` table
   - See: `/Users/nma/dev/RideTheBusRN/quest-api/RUN_THIS_MIGRATION.md`

2. **Complete some quests:**
   - Go to `/quest/rtb`
   - Connect wallet
   - Complete quests (triggers GraphQL validation)
   - Backend writes to `quest_progress` table

3. **View profile:**
   - Go to `/profile`
   - Connect wallet
   - See completed quests in earning history

## Technical Notes

- Component re-fetches on wallet change
- Fetches from all projects in parallel
- Gracefully handles API errors per-project
- Uses cached progress (fast load)
- Could be enhanced to support pagination for users with many completions
