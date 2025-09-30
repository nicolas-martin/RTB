# Quest Database Module

A database interface for tracking user quest completion and points accumulation with a CSV-based storage implementation.

## Overview

This module provides a clean, abstracted database interface that makes it easy to:
- Track which quests users have completed
- Store user points per project
- Query quest progress and completion status
- Generate leaderboards
- Switch between different database backends without code changes

## Architecture

```
┌─────────────────────────────────────┐
│   Quest System / Application Code   │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│    QuestDatabaseService (High-level)│  ← Use this in your app
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│    IQuestDatabase (Interface)       │  ← Database abstraction
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│    CSVDatabase (Implementation)     │  ← Current implementation
│    - Uses localStorage               │
│    - CSV format                      │
└─────────────────────────────────────┘
```

## Files

- **`types.ts`** - TypeScript interfaces and types
- **`csvStorage.ts`** - CSV file I/O utilities (works with localStorage)
- **`csvDatabase.ts`** - CSV-based database implementation
- **`questDatabaseService.ts`** - High-level service for quest operations
- **`index.ts`** - Main entry point and factory functions
- **`examples.ts`** - Usage examples
- **`README.md`** - This file

## Database Schema

### QuestCompletion Table
| Field | Type | Description |
|-------|------|-------------|
| userAddress | string | User's wallet address |
| questId | string | Unique quest identifier |
| projectId | string | Project identifier |
| completed | boolean | Whether quest is completed |
| progress | number? | Progress percentage (0-100) |
| completedAt | string? | ISO 8601 timestamp of completion |
| lastCheckedAt | string | ISO 8601 timestamp of last check |

### UserPoints Table
| Field | Type | Description |
|-------|------|-------------|
| userAddress | string | User's wallet address |
| projectId | string | Project identifier |
| totalPoints | number | Total points accumulated |
| lastUpdatedAt | string | ISO 8601 timestamp of last update |

## Quick Start

### Basic Usage

```typescript
import { getQuestDatabaseService } from './database';

const dbService = getQuestDatabaseService();

// Check if quest is completed
const isCompleted = await dbService.isQuestCompleted(
  userAddress,
  questId,
  projectId
);

// Mark quest as completed and award points
if (!isCompleted) {
  const newlyCompleted = await dbService.markQuestCompleted(
    userAddress,
    questId,
    projectId,
    1000 // points reward
  );
}

// Get user's total points
const points = await dbService.getUserPoints(userAddress, projectId);
```

### Integration with Quest System

```typescript
import { QuestService } from './services/questService';
import { getQuestDatabaseService } from './database';

const questService = new QuestService(graphqlEndpoint);
const dbService = getQuestDatabaseService();

// When checking a quest
async function checkQuest(userAddress: string, questId: string) {
  // First check if already completed in database
  const isCompleted = await dbService.isQuestCompleted(
    userAddress,
    questId,
    projectId
  );

  if (isCompleted) {
    return { completed: true };
  }

  // Run validation
  const quest = await questService.checkQuest(questId, userAddress);

  // If just completed, save to database
  if (quest.completed) {
    await dbService.markQuestCompleted(
      userAddress,
      questId,
      projectId,
      quest.reward
    );
  }

  return quest;
}
```

## API Reference

### QuestDatabaseService

High-level service with convenient methods:

#### Quest Completion Methods

- **`isQuestCompleted(userAddress, questId, projectId): Promise<boolean>`**
  - Check if a user has completed a quest

- **`markQuestCompleted(userAddress, questId, projectId, pointsReward): Promise<boolean>`**
  - Mark quest as completed and award points
  - Returns `true` if newly completed, `false` if already completed

- **`updateQuestProgress(userAddress, questId, projectId, progress): Promise<void>`**
  - Update progress for progress-type quests (0-100)

- **`getUserCompletedQuests(userAddress, projectId?): Promise<QuestCompletion[]>`**
  - Get all completed quests for a user

- **`getUserQuestCompletions(userAddress, projectId?): Promise<QuestCompletion[]>`**
  - Get all quest records (completed and in-progress)

#### Points Methods

- **`getUserPoints(userAddress, projectId): Promise<number>`**
  - Get user's total points for a project

- **`getUserTotalPoints(userAddress): Promise<number>`**
  - Get user's total points across all projects

- **`getLeaderboard(projectId, limit): Promise<UserPoints[]>`**
  - Get top users by points for a project

#### Statistics Methods

- **`getUserQuestStats(userAddress, projectId?): Promise<Stats>`**
  - Get comprehensive statistics for a user
  ```typescript
  {
    totalQuests: number,
    completedQuests: number,
    inProgressQuests: number,
    totalPoints: number
  }
  ```

- **`getQuestsCompletionStatus(userAddress, projectId, questIds): Promise<Map<string, boolean>>`**
  - Batch check completion status for multiple quests

#### Utility Methods

- **`clearUserData(userAddress, projectId?): Promise<void>`**
  - Clear all data for a user (GDPR compliance)

## Migration Guide

### From LocalStorage to CSV Database

If you're currently using localStorage directly:

**Before:**
```typescript
// Old way - directly using localStorage
const stored = localStorage.getItem(`quest_progress_${projectId}`);
const progress = JSON.parse(stored || '{}');
```

**After:**
```typescript
// New way - using database service
const dbService = getQuestDatabaseService();
const completions = await dbService.getUserQuestCompletions(
  userAddress,
  projectId
);
```

### From CSV to Real Database (PostgreSQL, MySQL, etc.)

To migrate to a real database:

1. **Create a new implementation of `IQuestDatabase`**:

```typescript
// database/postgresDatabase.ts
import { IQuestDatabase, QuestCompletion, UserPoints } from './types';
import { Pool } from 'pg';

export class PostgreSQLDatabase implements IQuestDatabase {
  private pool: Pool;

  constructor(connectionString: string) {
    this.pool = new Pool({ connectionString });
  }

  async getQuestCompletion(
    userAddress: string,
    questId: string,
    projectId: string
  ): Promise<QuestCompletion | null> {
    const result = await this.pool.query(
      'SELECT * FROM quest_completions WHERE user_address = $1 AND quest_id = $2 AND project_id = $3',
      [userAddress, questId, projectId]
    );
    return result.rows[0] || null;
  }

  // Implement other methods...
}
```

2. **Update the factory function in `index.ts`**:

```typescript
import { PostgreSQLDatabase } from './postgresDatabase';

export function createDatabase(): IQuestDatabase {
  // Switch to PostgreSQL
  return new PostgreSQLDatabase(process.env.DATABASE_URL);

  // Or keep CSV for development
  // return new CSVDatabase();
}
```

3. **No other code changes needed!** All application code using `QuestDatabaseService` will automatically use the new database.

## Storage Details

### Current Implementation (CSV)

- **Storage Backend**: Browser localStorage
- **Format**: CSV files
- **Files**:
  - `quest_db_quest_completions.csv` - Quest completion records
  - `quest_db_user_points.csv` - User points records
- **Performance**: Suitable for small to medium datasets (< 10,000 records)
- **Limitations**:
  - No transactions
  - No complex queries
  - Limited by localStorage size (5-10MB)

### Recommended Production Setup

For production, migrate to:
- **PostgreSQL** - Best for complex queries and ACID compliance
- **MongoDB** - Good for flexible schema and high write volumes
- **Firebase** - Good for real-time updates and mobile apps
- **Supabase** - PostgreSQL with built-in auth and real-time

## Testing

The module includes example functions that can be used for testing:

```typescript
import { runAllExamples } from './database/examples';

// Run all examples to test functionality
await runAllExamples();
```

## Performance Considerations

### CSV Implementation
- **Read operations**: O(n) - must parse entire CSV
- **Write operations**: O(n) - must rewrite entire file
- **Best for**: Development, prototyping, small datasets

### Optimization Tips
- Use batch operations when possible (`getQuestsCompletionStatus`)
- Cache frequently accessed data in memory
- Migrate to a real database for production

## Error Handling

All database operations are wrapped in try-catch blocks and return sensible defaults:

```typescript
// If database read fails, returns empty array
const completions = await dbService.getUserQuestCompletions(userAddress);
// completions = [] if error

// If points read fails, returns 0
const points = await dbService.getUserPoints(userAddress, projectId);
// points = 0 if error
```

## Security Considerations

- **No SQL injection**: CSV storage doesn't execute queries
- **Data validation**: All inputs should be validated before storage
- **Access control**: Implement authentication/authorization at the application level
- **Data privacy**: Support user data deletion via `clearUserData()`

## Future Enhancements

Potential improvements:
- [ ] Add caching layer (Redis, in-memory)
- [ ] Add transaction support
- [ ] Add data migration utilities
- [ ] Add backup/restore functionality
- [ ] Add analytics and reporting queries
- [ ] Add audit logging
- [ ] Add data encryption at rest

## License

Same as parent project.
