# Quest Database Integration

This document describes the database integration for quest completion tracking implemented in the quest system.

## Overview

The quest execution system has been modified to track quest completions in a database (or mock storage) to ensure:
- Quests that are already completed are not re-executed
- User points are tracked and persisted
- Quest completions are recorded with timestamps
- The system gracefully handles database failures

## Architecture

### Database Interface

**Location**: `/src/types/database.ts`

The `IDatabaseService` interface defines the contract for all database operations:

```typescript
interface IDatabaseService {
  isQuestCompleted(userId: string, questId: string, projectId: string): Promise<boolean>
  markQuestCompleted(completion: QuestCompletion): Promise<boolean>
  updateUserPoints(userId: string, projectId: string, pointsToAdd: number): Promise<boolean>
  getUserPoints(userId: string, projectId: string): Promise<number>
  getCompletedQuests(userId: string, projectId: string): Promise<QuestCompletion[]>
  initialize?(config: DatabaseConfig): Promise<void>
  healthCheck?(): Promise<boolean>
}
```

### Database Services

**Location**: `/src/services/databaseService.ts`

Two implementations are provided:

#### 1. MockDatabaseService (Default)
- Uses browser localStorage for development/testing
- Fully functional without requiring backend setup
- Data persists between browser sessions
- Useful for development and demos

#### 2. ApiDatabaseService (Production)
- Placeholder for production API integration
- Contains skeleton methods with TODO markers
- Ready to be connected to actual REST API endpoints
- Includes proper error handling and timeout support

### Service Factory

```typescript
// Create a mock database service (default)
const mockDb = createDatabaseService(false)

// Create an API database service
const apiDb = createDatabaseService(true, {
  apiEndpoint: 'https://api.example.com',
  apiKey: 'your-api-key',
  timeout: 5000
})

// Use singleton instance
const db = getDatabaseService()
```

## Integration Points

### QuestService

**Location**: `/src/services/questService.ts`

The `QuestService` class now integrates with the database at key points:

#### Quest Checking Flow

```
1. User requests to check quest progress
   ↓
2. Check if quest is already completed in database
   ↓
3a. If completed → Skip validation, return completed status
   ↓
3b. If not completed → Run GraphQL query and validation
   ↓
4. If validation passes (quest just completed):
   - Mark quest as completed in database
   - Award points to user
   - Update local progress cache
   ↓
5. Return quest status to UI
```

#### Key Methods

- `checkQuest(questId, playerId)` - Main quest checking logic with database integration
- `getUserPoints(playerId)` - Get user's total points for the project
- `getCompletedQuestsFromDb(playerId)` - Get list of completed quest IDs
- `setDatabaseService(service)` - Allow dependency injection for testing

### ProjectManager

**Location**: `/src/services/projectManager.ts`

Extended with methods to aggregate data across projects:

- `getUserPointsForProject(projectId, playerId)` - Points for a specific project
- `getAllUserPoints(playerId)` - Points map for all projects
- `getCompletedQuestsForProject(projectId, playerId)` - Completed quests for a project

### User Interface

**Location**: `/src/App.tsx`

The UI now displays:
- Number of completed quests vs total quests
- User's earned points per project
- Total available points per project
- Real-time updates when quests are completed

## Error Handling

The system implements robust error handling:

### Database Failures

If database operations fail, the system:
1. Logs the error with context
2. Falls back to local validation for quest checking
3. Continues to function (though without persistence)
4. Shows appropriate warnings in console

```typescript
try {
  const isCompleted = await this.databaseService.isQuestCompleted(...)
  // ... normal flow
} catch (error) {
  console.error('Database error:', error)
  // Fall back to local validation
  // ... fallback flow
}
```

### Partial Failures

- If quest validation succeeds but database marking fails:
  - User sees quest as completed locally
  - Warning logged to console
  - Points may not be awarded (retry on next check)

- If database check fails:
  - Quest validation runs normally
  - Completion marking still attempted
  - System continues to function

## Data Models

### QuestCompletion

```typescript
interface QuestCompletion {
  userId: string        // Wallet address or user ID
  questId: string       // Unique quest identifier
  projectId: string     // Project identifier (rtb, gluex, etc.)
  completedAt: string   // ISO timestamp
  pointsEarned: number  // Points awarded for completion
}
```

### UserPoints

```typescript
interface UserPoints {
  userId: string        // Wallet address or user ID
  projectId: string     // Project identifier
  totalPoints: number   // Accumulated points
  lastUpdated: string   // ISO timestamp of last update
}
```

## Storage Keys

The MockDatabaseService uses consistent localStorage keys:

- Quest completions: `quest_db_completions_{projectId}_{userId}`
- User points: `quest_db_points_{projectId}_{userId}`
- Health check: `quest_db_health_check`

Note: These are separate from the existing `quest_progress_*` keys used for local caching.

## Testing

### Manual Testing

1. **Connect wallet and complete a quest:**
   ```
   - Open browser dev tools → Application → Local Storage
   - Complete a quest
   - Verify keys appear with correct data
   ```

2. **Test completion persistence:**
   ```
   - Complete a quest
   - Refresh the page
   - Connect with same wallet
   - Verify quest shows as completed without re-validation
   ```

3. **Test points accumulation:**
   ```
   - Complete multiple quests
   - Check project stats header shows correct total
   - Verify points = sum of completed quest rewards
   ```

### Automated Testing

Create tests for the database service:

```typescript
describe('MockDatabaseService', () => {
  let service: MockDatabaseService

  beforeEach(() => {
    service = new MockDatabaseService()
    localStorage.clear()
  })

  test('should mark quest as completed', async () => {
    const completion: QuestCompletion = {
      userId: '0x123',
      questId: 'test_quest',
      projectId: 'test_project',
      completedAt: new Date().toISOString(),
      pointsEarned: 100
    }

    const result = await service.markQuestCompleted(completion)
    expect(result).toBe(true)

    const isCompleted = await service.isQuestCompleted('0x123', 'test_quest', 'test_project')
    expect(isCompleted).toBe(true)
  })

  test('should accumulate points', async () => {
    await service.updateUserPoints('0x123', 'test_project', 100)
    await service.updateUserPoints('0x123', 'test_project', 50)

    const points = await service.getUserPoints('0x123', 'test_project')
    expect(points).toBe(150)
  })
})
```

## Production API Implementation

To implement the production API service:

1. **Update API endpoints** in `ApiDatabaseService`
2. **Implement authentication** (API keys, JWT, etc.)
3. **Add request/response validation**
4. **Implement retry logic** for failed requests
5. **Add rate limiting** handling
6. **Configure proper CORS** on backend

Example API endpoint structure:

```
GET  /quests/completed?userId={userId}&questId={questId}&projectId={projectId}
POST /quests/complete
POST /users/points
GET  /users/points?userId={userId}&projectId={projectId}
GET  /quests/completed?userId={userId}&projectId={projectId}
GET  /health
```

## Migration Notes

### From localStorage to API

When switching from MockDatabaseService to ApiDatabaseService:

1. Export existing localStorage data if needed
2. Update the service creation in your app initialization
3. Test with a staging API first
4. Monitor for any edge cases or data inconsistencies
5. Consider a transition period where both services are checked

### Backward Compatibility

The system maintains backward compatibility:
- Existing `quest_progress_*` localStorage keys still work
- Database integration is additive, not replacement
- System continues to function if database is unavailable
- No breaking changes to quest definitions or validation

## Performance Considerations

### Optimization Strategies

1. **Batch Requests**: When checking multiple projects, requests can be parallelized
2. **Caching**: Completed quest checks are cached in memory during session
3. **Lazy Loading**: Database checks only happen when user connects wallet
4. **Early Returns**: Skip validation for already-completed quests

### Database Load

- Each quest check: 1 read operation
- Each completion: 2 write operations (completion + points)
- Per user per project: ~10 reads + ~5 writes (assuming 5 quests completed)

## Security Considerations

1. **User ID Validation**: Always validate wallet addresses on backend
2. **Quest ID Validation**: Verify quest exists before marking complete
3. **Points Validation**: Backend should verify points match quest reward
4. **Replay Protection**: Ensure completions can't be submitted multiple times
5. **Rate Limiting**: Protect against abuse on API endpoints

## Future Enhancements

Potential improvements:

1. **Optimistic Updates**: Show completion immediately, sync with DB in background
2. **Offline Support**: Queue completions when offline, sync when online
3. **Achievements System**: Track meta-achievements across quests
4. **Leaderboards**: Add ranking support in database schema
5. **Quest Chains**: Support prerequisite quests that unlock others
6. **Time-Limited Quests**: Add expiration tracking in database
7. **Partial Progress**: Save intermediate progress for long-running quests

## Troubleshooting

### Quest not marked as completed

1. Check console for database errors
2. Verify localStorage has space available
3. Check network tab for API failures
4. Verify wallet address is consistent

### Points not updating

1. Verify `markQuestCompleted` was called successfully
2. Check that quest reward is defined in TOML
3. Inspect localStorage for points entry
4. Check for concurrent update race conditions

### Performance issues

1. Check number of database calls per quest check
2. Verify caching is working properly
3. Consider batching multiple quest checks
4. Profile with browser dev tools

## Support

For issues or questions:
- Check console logs for detailed error messages
- Review database service health check results
- Verify quest TOML configuration is correct
- Test with MockDatabaseService first before API integration