# Quest API Migration Summary

## Overview

Successfully migrated quest parsing and Goldsky GraphQL logic from the frontend (`quest/`) to a new TypeScript backend API (`quest-api/`).

## What Was Migrated

### ✅ Core Logic
- **Quest Models**: BaseQuest, ConditionalQuest, ProgressQuest, CustomQuest
- **Quest Parser**: TOML parsing with type parameter support
- **Quest Service**: Quest validation and management
- **GraphQL Client**: Goldsky integration via graphql-request
- **Variable Functions**: Dynamic variable resolution
- **Custom Validators**: Framework for custom quest validation

### ✅ Data Files
- All quest data from `quest/data/` → `quest-api/src/data/`
  - gluex project data
  - rtb project data
  - TOML quest definitions
  - Validator implementations

### ✅ Tests
- Quest parser tests (3 tests passing)
- Test infrastructure with Vitest

### ✅ API Endpoints
Created Express REST API with endpoints:
- `GET /health` - Health check
- `GET /api/projects/:projectId` - Get project metadata
- `GET /api/projects/:projectId/quests` - Get all quests
- `POST /api/projects/:projectId/quests/:questId/check` - Check specific quest
- `POST /api/projects/:projectId/quests/check-all` - Check all quests
- `GET /api/projects/:projectId/quests/active` - Get active quests

## Project Structure

```
quest-api/
├── src/
│   ├── data/              # Quest data (TOML, validators, variables)
│   │   ├── gluex/
│   │   └── rtb/
│   ├── models/            # Quest models
│   │   ├── BaseQuest.ts
│   │   ├── ConditionalQuest.ts
│   │   ├── ProgressQuest.ts
│   │   └── CustomQuest.ts
│   ├── services/          # Business logic
│   │   ├── graphqlClient.ts
│   │   ├── questParser.ts
│   │   ├── questService.ts
│   │   ├── variableFunctions.ts
│   │   └── __tests__/
│   ├── types/             # TypeScript types
│   │   └── quest.ts
│   ├── validators/        # Validator framework
│   │   └── customValidators.ts
│   └── index.ts           # Express server
├── package.json
├── tsconfig.json
└── vitest.config.ts
```

## Dependencies

### Production
- express - REST API framework
- cors - CORS middleware
- graphql & graphql-request - Goldsky GraphQL client
- toml - TOML parser for quest definitions

### Development
- typescript
- tsx - TypeScript execution
- vitest - Testing framework
- @types/* - Type definitions

## Known Limitations / TODO

### ⚠️ Price Service Integration Needed
Two validators require price conversion that was using frontend services:
- `total_value_traded_100_usdt0.ts`
- `volume_10_usdt0_24h.ts`

These validators currently return 0 with a warning. Original implementation is commented out.

**Next steps:**
1. Migrate `gluexPriceClient` service to backend
2. Implement token price caching/storage
3. Uncomment and update the validator implementations

### Database Integration
The original frontend had database service integration (QuestDatabaseService) that was NOT migrated as it wasn't needed for the core quest validation logic. If persistence is needed:
1. Migrate database service from frontend
2. Wire up to API endpoints
3. Add quest completion tracking

## Running the API

### Development
```bash
npm run dev
```

### Production
```bash
npm run build
npm start
```

### Testing
```bash
npm test
```

## Security Benefits

By moving quest parsing and GraphQL logic to the backend:
1. **API Keys Protected**: Goldsky API keys no longer exposed to frontend
2. **Query Validation**: Quest queries validated server-side
3. **Rate Limiting**: Can add rate limiting at API level
4. **Centralized Logic**: Single source of truth for quest validation

## Next Steps

1. **Deploy Backend API**: Deploy to production environment
2. **Update Frontend**: Update frontend to call API endpoints instead of local services
3. **Price Service**: Migrate price conversion logic for gluex validators
4. **Authentication**: Add authentication to API endpoints if needed
5. **Monitoring**: Add logging and monitoring
6. **Documentation**: Add API documentation (OpenAPI/Swagger)
