# Quest API Changelog

## v2.0.0 - Supabase Integration (Current)

### Breaking Changes
- Changed parameter name from `playerId` to `walletAddress` across all endpoints
- Completely new endpoint structure (see API.md)
- Removed old endpoints:
  - `GET /api/projects/:projectId`
  - `POST /api/projects/:projectId/quests/:questId/check`
  - `POST /api/projects/:projectId/quests/check-all`
  - `GET /api/projects/:projectId/quests/active`

### New Features
- ✅ **Supabase Persistence**: Quest progress is now persisted to Supabase database
- ✅ **Points System**: Full points earning, redemption, and transaction tracking
- ✅ **Cached Progress**: Fast loading of cached quest progress from Supabase
- ✅ **Refresh on Demand**: Separate endpoints for cached vs. fresh GraphQL data
- ✅ **Points Redemption**: API for spending earned points with balance validation
- ✅ **Transaction History**: Track all points transactions (earned/redeemed)

### New Endpoints
1. `GET /api/quests?projectId={id}` - Get quest metadata
2. `GET /api/quests/progress/:wallet?projectId={id}` - Get cached progress
3. `POST /api/quests/refresh/:wallet?projectId={id}` - Refresh from GraphQL
4. `GET /api/points/:wallet?projectId={id}` - Get points summary
5. `POST /api/points/redeem` - Redeem points
6. `GET /api/points/transactions/:wallet?projectId={id}` - Get transaction history

### Database Schema
- **quest_progress**: Stores quest completion status, progress, and points earned
- **points_transactions**: Stores all points transactions with type (earned/redeemed)

### Technical Improvements
- Using `toml` library for parsing (no manual string manipulation)
- Proper TypeScript types for all database operations
- Transaction support for points redemption (checks balance before redeeming)
- Automatic points transaction creation when quests are completed
- Row Level Security (RLS) enabled on all tables

### Migration Guide
See README.md for full setup instructions. Key steps:
1. Set up Supabase project
2. Run migrations/001_initial_schema.sql
3. Configure SUPABASE_URL and SUPABASE_ANON_KEY in .env
4. Update frontend to use new endpoints (see API.md)

---

## v1.0.0 - Initial Release

### Features
- TOML quest parsing
- GraphQL query execution
- In-memory quest progress tracking
- Multiple quest types (conditional, progress, custom)
- Custom validators
