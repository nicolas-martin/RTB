# Database Integration Example

This document shows how to integrate the database with the existing quest system.

## Current Quest Flow (Without Database)

```
User checks quest
    ↓
QuestService.checkQuest()
    ↓
Run GraphQL Query (always)
    ↓
Validate conditions
    ↓
Return result
    ↓
Store in localStorage (per project)
```

## New Quest Flow (With Database)

```
User checks quest
    ↓
QuestService.checkQuest()
    ↓
Check database: Is quest already completed? ─── YES → Return cached result (FAST!)
    ↓ NO
Run GraphQL Query
    ↓
Validate conditions
    ↓
Quest completed? ─── YES → Save to database + Award points
    ↓ NO               
Quest in progress? ─── YES → Update progress in database
    ↓ NO
Return result
```

## Integration Code

### Step 1: Import Database Service

```typescript
// src/services/questService.ts
import { getQuestDatabaseService } from '../database';

export class QuestService {
  private dbService = getQuestDatabaseService();
  // ... existing code
}
```

### Step 2: Modify checkQuest Method

```typescript
async checkQuest(questId: string, playerId: string): Promise<Quest | null> {
  const quest = this.quests.find((q) => q.getId() === questId);
  if (!quest || !this.project) return null;

  try {
    // === NEW: Check database first ===
    const isCompleted = await this.dbService.isQuestCompleted(
      playerId,
      questId,
      this.project.id
    );

    if (isCompleted) {
      console.log(`Quest ${questId} already completed (from database)`);
      return {
        ...quest.getConfig(),
        completed: true,
        progress: 100,
      };
    }
    // === END NEW CODE ===

    // Existing validation logic
    const variables = await this.buildQueryVariables(
      quest.getQuery(),
      playerId,
      quest.getConfig()
    );

    const queryResult = await this.graphqlService.executeQuery(
      quest.getQuery(),
      variables
    );

    const validation = await quest.validate(queryResult);

    // === NEW: Save to database if completed ===
    if (validation.completed) {
      await this.dbService.markQuestCompleted(
        playerId,
        questId,
        this.project.id,
        quest.getReward()
      );
      console.log(`Quest ${questId} completed! Awarded ${quest.getReward()} points`);
    } else if (validation.progress !== undefined) {
      // Update progress for progress-type quests
      await this.dbService.updateQuestProgress(
        playerId,
        questId,
        this.project.id,
        validation.progress
      );
    }
    // === END NEW CODE ===

    // Keep existing localStorage for backward compatibility
    const progress: QuestProgress = {
      questId,
      completed: validation.completed,
      progress: validation.progress,
      lastUpdated: new Date().toISOString(),
    };

    this.questProgress.set(questId, progress);
    this.saveProgressToStorage();

    return {
      ...quest.getConfig(),
      completed: validation.completed,
      progress: validation.progress,
    };
  } catch (error) {
    console.error(`Failed to check quest ${questId}:`, error);
    return null;
  }
}
```

### Step 3: Add Points Getter Method

```typescript
async getUserPoints(playerId: string): Promise<number> {
  if (!this.project) return 0;

  try {
    return await this.dbService.getUserPoints(playerId, this.project.id);
  } catch (error) {
    console.error('Failed to get user points:', error);
    return 0;
  }
}
```

### Step 4: Add User Stats Method

```typescript
async getUserStats(playerId: string): Promise<{
  totalQuests: number;
  completedQuests: number;
  inProgressQuests: number;
  totalPoints: number;
}> {
  if (!this.project) {
    return {
      totalQuests: 0,
      completedQuests: 0,
      inProgressQuests: 0,
      totalPoints: 0,
    };
  }

  try {
    return await this.dbService.getUserQuestStats(playerId, this.project.id);
  } catch (error) {
    console.error('Failed to get user stats:', error);
    return {
      totalQuests: 0,
      completedQuests: 0,
      inProgressQuests: 0,
      totalPoints: 0,
    };
  }
}
```

## UI Integration

### Add User Stats Display

```typescript
// src/App.tsx
import { useState, useEffect } from 'react';
import { projectManager } from './services/projectManager';

function App() {
  const [userStats, setUserStats] = useState<{
    totalPoints: number;
    completedQuests: number;
    totalQuests: number;
  }>({
    totalPoints: 0,
    completedQuests: 0,
    totalQuests: 0,
  });

  const checkProgress = async (wallet: string) => {
    // Existing code to check quests...
    const updatedProjectQuests = await projectManager.checkAllProjectsProgress(wallet);
    setProjectQuests(updatedProjectQuests);

    // NEW: Get user stats
    const stats = await projectManager.getUserStats(wallet);
    setUserStats(stats);
  };

  return (
    <div className="app">
      <h1>Quests</h1>
      
      {/* User Stats Card */}
      {playerId && (
        <div className="user-stats-card">
          <h2>Your Progress</h2>
          <div className="stats-grid">
            <div className="stat">
              <span className="stat-value">{userStats.totalPoints}</span>
              <span className="stat-label">Total Points</span>
            </div>
            <div className="stat">
              <span className="stat-value">
                {userStats.completedQuests}/{userStats.totalQuests}
              </span>
              <span className="stat-label">Quests Completed</span>
            </div>
          </div>
        </div>
      )}

      {/* Existing quest cards... */}
    </div>
  );
}
```

### Add Leaderboard Component

```typescript
// src/components/Leaderboard.tsx
import { useState, useEffect } from 'react';
import { getQuestDatabaseService } from '../database';

interface LeaderboardProps {
  projectId: string;
}

export function Leaderboard({ projectId }: LeaderboardProps) {
  const [leaderboard, setLeaderboard] = useState<Array<{
    userAddress: string;
    totalPoints: number;
  }>>([]);

  useEffect(() => {
    async function loadLeaderboard() {
      const dbService = getQuestDatabaseService();
      const topUsers = await dbService.getLeaderboard(projectId, 10);
      setLeaderboard(topUsers);
    }

    loadLeaderboard();
  }, [projectId]);

  return (
    <div className="leaderboard">
      <h2>Leaderboard</h2>
      <ol>
        {leaderboard.map((entry, index) => (
          <li key={entry.userAddress}>
            <span className="rank">#{index + 1}</span>
            <span className="address">
              {entry.userAddress.substring(0, 6)}...
              {entry.userAddress.substring(entry.userAddress.length - 4)}
            </span>
            <span className="points">{entry.totalPoints.toLocaleString()} pts</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
```

## ProjectManager Integration

```typescript
// src/services/projectManager.ts
import { getQuestDatabaseService } from '../database';

export class ProjectManager {
  private dbService = getQuestDatabaseService();
  
  // ... existing code

  async getUserPoints(playerId: string): Promise<Map<string, number>> {
    const pointsMap = new Map<string, number>();

    for (const service of this.questServices.values()) {
      const project = service.getProject();
      if (project) {
        const points = await this.dbService.getUserPoints(playerId, project.id);
        pointsMap.set(project.id, points);
      }
    }

    return pointsMap;
  }

  async getUserStats(playerId: string): Promise<{
    totalPoints: number;
    completedQuests: number;
    totalQuests: number;
  }> {
    const totalPoints = await this.dbService.getUserTotalPoints(playerId);
    
    let completedQuests = 0;
    let totalQuests = 0;

    for (const service of this.questServices.values()) {
      const project = service.getProject();
      if (project) {
        const stats = await this.dbService.getUserQuestStats(playerId, project.id);
        completedQuests += stats.completedQuests;
        totalQuests += stats.totalQuests;
      }
    }

    return {
      totalPoints,
      completedQuests,
      totalQuests,
    };
  }
}
```

## Performance Optimization

### Batch Quest Checking

```typescript
async checkAllQuests(playerId: string): Promise<Quest[]> {
  if (!this.project) return [];

  // Get all quest IDs
  const questIds = this.quests.map(q => q.getId());

  // Batch check completions (single database operation)
  const completionStatus = await this.dbService.getQuestsCompletionStatus(
    playerId,
    this.project.id,
    questIds
  );

  const results: Quest[] = [];

  for (const quest of this.quests) {
    const questId = quest.getId();
    const isCompleted = completionStatus.get(questId);

    if (isCompleted) {
      // Skip validation for completed quests
      results.push({
        ...quest.getConfig(),
        completed: true,
        progress: 100,
      });
    } else {
      // Only validate incomplete quests
      const result = await this.checkQuest(questId, playerId);
      if (result) {
        results.push(result);
      }
    }
  }

  return results;
}
```

## Benefits

1. **Performance** - Completed quests don't re-run GraphQL queries
2. **Points System** - Automatic points tracking and accumulation
3. **Leaderboards** - Built-in leaderboard support
4. **Statistics** - User progress and completion tracking
5. **Reliability** - Persistent storage of quest completions
6. **Scalability** - Easy migration to production database

## Testing Integration

```typescript
// Test that quest completion is saved to database
import { getQuestDatabaseService } from '../database';

describe('QuestService with Database', () => {
  it('should save quest completion to database', async () => {
    const questService = new QuestService(graphqlEndpoint);
    const dbService = getQuestDatabaseService();

    // Check quest
    const result = await questService.checkQuest('win_1_game', '0x123');

    expect(result.completed).toBe(true);

    // Verify in database
    const isCompleted = await dbService.isQuestCompleted(
      '0x123',
      'win_1_game',
      'rtb'
    );

    expect(isCompleted).toBe(true);
  });

  it('should award points when quest completes', async () => {
    const questService = new QuestService(graphqlEndpoint);
    const dbService = getQuestDatabaseService();

    // Check quest (should complete and award 1000 points)
    await questService.checkQuest('win_1_game', '0x123');

    // Verify points
    const points = await dbService.getUserPoints('0x123', 'rtb');

    expect(points).toBe(1000);
  });
});
```

## Migration Path

### Phase 1: Development (Current - CSV)
- Use CSV database for development
- Test integration with quest system
- Verify points tracking works

### Phase 2: Staging (CSV or In-Memory DB)
- Deploy with CSV for initial testing
- Monitor performance and usage patterns
- Collect requirements for production database

### Phase 3: Production (Real Database)
- Implement PostgreSQL/MySQL/MongoDB
- Migrate existing data
- Deploy to production
- No application code changes needed!

## Summary

The database integration is straightforward:
1. Import `getQuestDatabaseService()`
2. Check database before running validation
3. Save completions and points after validation
4. Add UI components for stats and leaderboard

The abstraction layer ensures you can start with CSV and seamlessly migrate to a production database later without changing any application code.
