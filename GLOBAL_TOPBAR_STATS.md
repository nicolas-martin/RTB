# Global Top Bar Stats Implementation

## Changes Made

The top bar now displays **global statistics** (all projects combined) even when viewing a single project page.

### How It Works

**Store (`questProgressStore.ts`)**
- Added `globalProjectQuests` and `globalUserPoints` state
- Always loads ALL projects for global stats
- Separately loads filtered projects for page content

**Data Flow:**

```
On /quest/rtb page:
├── globalProjectQuests = ALL projects (rtb + gluex)  → Top bar stats
├── globalUserPoints = ALL projects                   → Top bar stats
├── projectQuests = rtb only                          → Page content
└── userPoints = rtb only                             → Page content
```

**Top Bar (`QuestTopBarStats.tsx`)**
- Now reads `globalProjectQuests` and `globalUserPoints` directly from store
- Calculates totals across ALL projects
- Independent of project filtering

### Refresh Behavior

**On project page (`/quest/rtb`):**
1. Loads cached progress for rtb (fast) → Shows project quests
2. Loads cached progress for ALL projects → Updates top bar
3. Refreshes rtb via GraphQL → Updates project quests
4. Refreshes ALL projects via GraphQL → Updates top bar

**Performance:**
- Only uncompleted quests trigger GraphQL calls
- Top bar always shows accurate global stats
- Project page only refreshes relevant project

### Testing

1. Go to `/quest/rtb`
2. Connect wallet
3. Top bar should show: **Total points and completion across ALL projects (rtb + gluex)**
4. Page content should show: **Only rtb quests**

### Backend Logs

You should see:
```
[ProjectManager] Loading cached progress for projects: rtb, wallet: 0x...
[ProjectManager] Loading cached progress for wallet: 0x...  (ALL projects)
[ProjectManager] Refreshing progress for rtb
[ProjectManager] Refreshing progress from GraphQL for wallet: 0x...  (ALL projects)
```

## Next Steps

**CRITICAL:** Run Supabase migration first!
- See `/Users/nma/dev/RideTheBusRN/quest-api/RUN_THIS_MIGRATION.md`
- Creates `quest_progress` and `points_transactions` tables
- Without this, API calls will fail
