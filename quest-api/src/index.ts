import express, { Request, Response } from 'express';
import cors from 'cors';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { QuestService } from './services/questService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Store quest services per project
const questServices = new Map<string, QuestService>();

// Load project helper
async function loadProjectService(projectId: string): Promise<QuestService> {
	if (questServices.has(projectId)) {
		return questServices.get(projectId)!;
	}

	// Load project TOML file
	const projectPath = join(__dirname, 'data', projectId, 'project.toml');
	const tomlContent = readFileSync(projectPath, 'utf-8');

	const service = new QuestService();
	await service.loadProject(tomlContent);
	questServices.set(projectId, service);

	return service;
}

// Health check
app.get('/health', (_req: Request, res: Response) => {
	res.json({ status: 'ok' });
});

// Get project metadata
app.get('/api/projects/:projectId', async (req: Request, res: Response) => {
	try {
		const { projectId } = req.params;
		const service = await loadProjectService(projectId);
		const project = service.getProject();

		if (!project) {
			return res.status(404).json({ error: 'Project not found' });
		}

		res.json(project);
	} catch (error) {
		console.error('Error loading project:', error);
		res.status(500).json({ error: 'Failed to load project' });
	}
});

// Get all quests for a project
app.get('/api/projects/:projectId/quests', async (req: Request, res: Response) => {
	try {
		const { projectId } = req.params;
		const service = await loadProjectService(projectId);
		const quests = service.getQuests().map(q => q.getConfig());

		res.json(quests);
	} catch (error) {
		console.error('Error loading quests:', error);
		res.status(500).json({ error: 'Failed to load quests' });
	}
});

// Check quest for a specific player
app.post('/api/projects/:projectId/quests/:questId/check', async (req: Request, res: Response) => {
	try {
		const { projectId, questId } = req.params;
		const { playerId } = req.body;

		if (!playerId) {
			return res.status(400).json({ error: 'playerId is required' });
		}

		const service = await loadProjectService(projectId);
		const quest = await service.checkQuest(questId, playerId);

		if (!quest) {
			return res.status(404).json({ error: 'Quest not found or validation failed' });
		}

		res.json(quest);
	} catch (error) {
		console.error('Error checking quest:', error);
		res.status(500).json({ error: 'Failed to check quest' });
	}
});

// Check all quests for a player
app.post('/api/projects/:projectId/quests/check-all', async (req: Request, res: Response) => {
	try {
		const { projectId } = req.params;
		const { playerId } = req.body;

		if (!playerId) {
			return res.status(400).json({ error: 'playerId is required' });
		}

		const service = await loadProjectService(projectId);
		const quests = await service.checkAllQuests(playerId);

		res.json(quests);
	} catch (error) {
		console.error('Error checking quests:', error);
		res.status(500).json({ error: 'Failed to check quests' });
	}
});

// Get active quests (filtered by date)
app.get('/api/projects/:projectId/quests/active', async (req: Request, res: Response) => {
	try {
		const { projectId } = req.params;
		const service = await loadProjectService(projectId);
		const activeQuests = service.getActiveQuests();

		res.json(activeQuests);
	} catch (error) {
		console.error('Error getting active quests:', error);
		res.status(500).json({ error: 'Failed to get active quests' });
	}
});

app.listen(port, () => {
	console.log(`Quest API server running on port ${port}`);
});
