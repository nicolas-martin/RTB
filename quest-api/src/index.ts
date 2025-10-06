import express, { Request, Response } from 'express';
import cors from 'cors';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';
import { QuestService } from './services/questService.js';
import { initializeSupabase } from './database/supabaseClient.js';
import { questDatabase } from './database/questDatabase.js';

// Load environment variables
config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
	console.error('Missing SUPABASE_URL or SUPABASE_ANON_KEY environment variables');
	process.exit(1);
}

initializeSupabase(supabaseUrl, supabaseKey);

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

// 1. GET /api/quests - Get all quests metadata (no progress)
// 2. GET /api/quests?projectId={id} - Get quests for specific project
app.get('/api/quests', async (req: Request, res: Response) => {
	try {
		const { projectId } = req.query;

		if (projectId) {
			// Get quests for specific project
			const service = await loadProjectService(projectId as string);
			const quests = service.getQuests().map(q => q.getConfig());
			res.json(quests);
		} else {
			// Get all quests from all projects
			// For now, we'll return an error since we need to know which projects to load
			res.status(400).json({ error: 'projectId query parameter is required' });
		}
	} catch (error) {
		console.error('Error loading quests:', error);
		res.status(500).json({ error: 'Failed to load quests' });
	}
});

// 3. GET /api/quests/progress/:walletAddress - Get cached progress from Supabase
// 4. GET /api/quests/progress/:walletAddress?projectId={id} - Get cached progress for project
app.get('/api/quests/progress/:walletAddress', async (req: Request, res: Response) => {
	try {
		const { walletAddress } = req.params;
		const { projectId } = req.query;

		if (!projectId) {
			return res.status(400).json({ error: 'projectId query parameter is required' });
		}

		const service = await loadProjectService(projectId as string);
		const quests = await service.loadCachedProgress(walletAddress);

		res.json(quests);
	} catch (error) {
		console.error('Error loading cached progress:', error);
		res.status(500).json({ error: 'Failed to load cached progress' });
	}
});

// 5. POST /api/quests/refresh/:walletAddress - Check GraphQL, update Supabase, return progress
// 6. POST /api/quests/refresh/:walletAddress?projectId={id} - Refresh for specific project
app.post('/api/quests/refresh/:walletAddress', async (req: Request, res: Response) => {
	try {
		const { walletAddress } = req.params;
		const { projectId } = req.query;

		if (!projectId) {
			return res.status(400).json({ error: 'projectId query parameter is required' });
		}

		const service = await loadProjectService(projectId as string);
		const quests = await service.checkAllQuests(walletAddress);

		res.json(quests);
	} catch (error) {
		console.error('Error refreshing quests:', error);
		res.status(500).json({ error: 'Failed to refresh quests' });
	}
});

// 7. GET /api/points/:walletAddress?projectId={id} - Get points summary
app.get('/api/points/:walletAddress', async (req: Request, res: Response) => {
	try {
		const { walletAddress } = req.params;
		const { projectId } = req.query;

		const summaries = await questDatabase.getPointsSummary(
			walletAddress,
			projectId as string | undefined
		);

		res.json(summaries);
	} catch (error) {
		console.error('Error getting points summary:', error);
		res.status(500).json({ error: 'Failed to get points summary' });
	}
});

// 8. POST /api/points/redeem - Redeem points
app.post('/api/points/redeem', async (req: Request, res: Response) => {
	try {
		const { walletAddress, projectId, amount, reason } = req.body;

		if (!walletAddress || !projectId || !amount) {
			return res.status(400).json({
				error: 'walletAddress, projectId, and amount are required',
			});
		}

		if (typeof amount !== 'number' || amount <= 0) {
			return res.status(400).json({ error: 'amount must be a positive number' });
		}

		const summary = await questDatabase.redeemPoints(
			walletAddress,
			projectId,
			amount,
			reason || 'Redemption'
		);

		res.json(summary);
	} catch (error) {
		console.error('Error redeeming points:', error);
		if (error instanceof Error && error.message === 'Insufficient points balance') {
			res.status(400).json({ error: error.message });
		} else {
			res.status(500).json({ error: 'Failed to redeem points' });
		}
	}
});

// 9. GET /api/points/transactions/:walletAddress?projectId={id} - Get redemption history
app.get('/api/points/transactions/:walletAddress', async (req: Request, res: Response) => {
	try {
		const { walletAddress } = req.params;
		const { projectId } = req.query;

		const transactions = await questDatabase.getPointsTransactions(
			walletAddress,
			projectId as string | undefined
		);

		res.json(transactions);
	} catch (error) {
		console.error('Error getting transactions:', error);
		res.status(500).json({ error: 'Failed to get transactions' });
	}
});

app.listen(port, () => {
	console.log(`Quest API server running on port ${port}`);
});
