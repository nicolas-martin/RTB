# Quest API

Backend API for quest validation and GraphQL querying. Migrated from frontend for security.

## Features

- Quest parsing from TOML files
- GraphQL query execution via Goldsky
- Quest validation (conditional, progress, custom)
- RESTful API endpoints

## Installation

```bash
npm install
```

## Development

```bash
npm run dev
```

## Build

```bash
npm run build
npm start
```

## Test

```bash
npm test
```

## API Endpoints

### GET /health
Health check endpoint

### GET /api/projects/:projectId
Get project metadata

### GET /api/projects/:projectId/quests
Get all quests for a project

### POST /api/projects/:projectId/quests/:questId/check
Check a specific quest for a player
```json
{
  "playerId": "0x..."
}
```

### POST /api/projects/:projectId/quests/check-all
Check all quests for a player
```json
{
  "playerId": "0x..."
}
```

### GET /api/projects/:projectId/quests/active
Get active quests (filtered by date)

## Project Structure

```
src/
├── data/           # Quest data files (TOML, validators, etc.)
├── models/         # Quest models (BaseQuest, ConditionalQuest, etc.)
├── services/       # Business logic (questParser, questService, graphqlClient)
├── types/          # TypeScript type definitions
├── validators/     # Custom quest validators
└── index.ts        # Express server
```
