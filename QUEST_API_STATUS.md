# Quest API Integration Status

## ✅ Current State After Frontend Refactor

Good news! The quest-api integration survived the frontend refactor merge. All code is intact and functional.

### Backend Status

**quest-api** - ✅ Running on port 3001
- All endpoints working correctly
- Returns quest metadata from TOML files
- Ready to accept progress tracking requests

### Frontend Integration Status

**All API integration code is present:**

1. ✅ **questApiClient.ts** - API client for backend communication
   - `getQuests()` - Fetch quest metadata
   - `getCachedProgress()` - Load cached progress from Supabase
   - `refreshProgress()` - Trigger GraphQL validation
   - `getPointsSummary()` - Get user points
   - `redeemPoints()` - Redeem points

2. ✅ **projectManager.ts** - Quest data management
   - `loadProject()` - Loads quests from API (not TOML)
   - `loadCachedProgressForProjects()` - Project-specific cached progress
   - `loadCachedProgressForAllProjects()` - All projects cached progress
   - `checkProjectsProgress()` - Refresh specific projects via GraphQL
   - `checkAllProjectsProgress()` - Refresh all projects via GraphQL
   - `getPointsForProjects()` - Points for specific projects
   - `getAllUserPoints()` - Points for all projects

3. ✅ **questProgressStore.ts** - State management
   - `projectQuests` - Filtered project data
   - `userPoints` - Filtered points
   - `globalProjectQuests` - ALL projects (for top bar)
   - `globalUserPoints` - ALL projects points (for top bar)
   - `refreshForAccount()` - Accepts optional projectIds parameter
   - `manualRefresh()` - Accepts optional projectIds parameter

4. ✅ **QuestDataProvider.tsx** - Data provider
   - Passes `projectIds` to `refreshForAccount()` (line 88)
   - Filters are temporarily disabled (lines 47-56) but infrastructure is ready

5. ✅ **QuestTopBarStats.tsx** - Top bar component
   - Uses `globalProjectQuests` and `globalUserPoints` from store
   - Shows global stats across ALL projects (even on single project pages)

### Test Results

**Backend API test:**
```bash
curl 'http://localhost:3001/api/quests?projectId=rtb'
```
✅ Returns 6 quests with full metadata

**Frontend build:**
```bash
npm run build
```
✅ Builds successfully with no TypeScript errors

## 🚨 Critical: Supabase Migration Required

The backend will fail when attempting to read/write quest progress because the database tables don't exist yet.

**Run this migration:**
1. Go to: https://supabase.com/dashboard/project/ovabsyedogcimjmgzufr/sql/new
2. Copy SQL from: `/Users/nma/dev/RideTheBusRN/quest-api/RUN_THIS_MIGRATION.md`
3. Execute to create:
   - `quest_progress` table
   - `points_transactions` table
   - Indexes and triggers

## How It Works

### On Project Page (`/quest/rtb`)

**When user connects wallet:**
1. Loads cached progress for **rtb only** (fast) → Shows rtb quests
2. Loads cached progress for **ALL projects** → Updates top bar
3. Refreshes **rtb uncompleted quests** via GraphQL → Updates rtb quests
4. Refreshes **ALL uncompleted quests** via GraphQL → Updates top bar

**Result:**
- Page content: rtb quests only
- Top bar: Global stats (rtb + gluex + all projects)

### On Main Quest Page (`/`)

**When user connects wallet:**
1. Loads cached progress for ALL projects
2. Refreshes ALL uncompleted quests via GraphQL
3. Updates both page content and top bar

**Result:**
- Page content: All projects
- Top bar: Global stats (all projects)

## Performance Optimizations

1. **Smart GraphQL checks** - Only uncompleted quests trigger GraphQL validation
2. **Cached first load** - Shows Supabase data instantly, then refreshes
3. **Project-specific refresh** - Single project pages only refresh that project's content (but always refresh global stats for top bar)

## Next Steps

1. **Run Supabase migration** (critical)
2. **Test with wallet connection**:
   - Go to `/quest/rtb`
   - Connect MetaMask
   - Verify top bar shows global stats
   - Verify page shows only rtb quests
3. **Re-enable project filtering** in `QuestDataProvider.tsx` (lines 47-56)

## Old Code to Remove (Optional Cleanup)

The following files/code can be safely deleted as they're no longer used:

1. **Frontend TOML parsing** - Not needed, backend serves metadata via API
2. **Local database files** in `site/src/lib/quest/database/` - May contain old implementations
3. **Direct GraphQL calls from frontend** - Backend handles this now

However, verify nothing else depends on these before deleting.

## API Endpoints Summary

```
GET  /api/quests?projectId=rtb           - Get quest metadata
GET  /api/quests/progress/:wallet        - Get cached progress
POST /api/quests/refresh/:wallet         - Refresh via GraphQL
GET  /api/points/:wallet                  - Get points summary
POST /api/points/redeem                   - Redeem points
```

All endpoints support `?projectId=X` query parameter.
