import express, { Request, Response } from 'express';
import cors from 'cors';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';
import { QuestService } from './services/questService.js';
import { initializeSupabase } from './database/supabaseClient.js';
import { questDatabase } from './database/questDatabase.js';
import { normalizeTransactions } from './services/transactionNormalizer.js';

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

// GET /api/projects - Get all projects with metadata
app.get('/api/projects', async (_req: Request, res: Response) => {
	try {
		console.log('[API] GET /api/projects - Fetching all project metadata');

		// Known project IDs
		const projectIds = ['rtb', 'aave', 'gluex', 'fluid'];
		const projects: any[] = [];

		for (const projectId of projectIds) {
			try {
				const service = await loadProjectService(projectId);
				const project = service.getProject();
				if (project) {
					projects.push(project);
					console.log(`[API] Loaded metadata for ${projectId}`);
				}
			} catch (error) {
				console.warn(`[API] Failed to load project ${projectId}:`, error);
				// Continue loading other projects
			}
		}

		console.log(`[API] Returning metadata for ${projects.length} projects`);
		res.json(projects);
	} catch (error) {
		console.error('[API] Error loading projects:', error);
		res.status(500).json({ error: 'Failed to load projects' });
	}
});

// 1. GET /api/quests - Get all quests metadata (no progress)
// 2. GET /api/quests?projectId={id} - Get quests for specific project
app.get('/api/quests', async (req: Request, res: Response) => {
	try {
		const { projectId } = req.query;
		console.log(`[API] GET /api/quests - projectId: ${projectId}`);

		if (projectId) {
			// Get quests for specific project
			console.log(`[API] Loading project service for: ${projectId}`);
			const service = await loadProjectService(projectId as string);
			const quests = service.getQuests().map(q => q.getConfig());
			console.log(`[API] Returning ${quests.length} quests for ${projectId}`);
			res.json(quests);
		} else {
			// Get all quests from all projects
			// For now, we'll return an error since we need to know which projects to load
			console.warn('[API] projectId query parameter missing');
			res.status(400).json({ error: 'projectId query parameter is required' });
		}
	} catch (error) {
		console.error('[API] Error loading quests:', error);
		res.status(500).json({ error: 'Failed to load quests' });
	}
});

// 3. GET /api/quests/progress/:walletAddress - Get cached progress from Supabase
// 4. GET /api/quests/progress/:walletAddress?projectId={id} - Get cached progress for project
app.get('/api/quests/progress/:walletAddress', async (req: Request, res: Response) => {
	try {
		const { walletAddress } = req.params;
		const { projectId } = req.query;

		console.log(`[API] GET /api/quests/progress/${walletAddress}?projectId=${projectId}`);

		if (!projectId) {
			console.warn('[API] projectId query parameter missing');
			return res.status(400).json({ error: 'projectId query parameter is required' });
		}

		console.log(`[API] Fetching progress from database for wallet: ${walletAddress}, project: ${projectId}`);
		const progressData = await questDatabase.getUserQuestProgress(
			walletAddress,
			projectId as string
		);

		console.log(`[API] Found ${progressData.length} progress records`);

		// Return only progress data, not full quest objects
		const progressMap = progressData.map(p => ({
			quest_id: p.quest_id,
			completed: p.completed,
			progress: p.progress,
			points_earned: p.points_earned,
			completed_at: p.completed_at,
			last_checked_at: p.last_checked_at
		}));

		res.json(progressMap);
	} catch (error) {
		console.error('[API] Error loading cached progress:', error);
		res.status(500).json({ error: 'Failed to load cached progress' });
	}
});

// 5. POST /api/quests/refresh/:walletAddress - Check GraphQL, update Supabase, return progress
// 6. POST /api/quests/refresh/:walletAddress?projectId={id} - Refresh for specific project
app.post('/api/quests/refresh/:walletAddress', async (req: Request, res: Response) => {
	try {
		const { walletAddress } = req.params;
		const { projectId } = req.query;

		console.log(`[API] POST /api/quests/refresh/${walletAddress}?projectId=${projectId}`);

		if (!projectId) {
			console.warn('[API] projectId query parameter missing');
			return res.status(400).json({ error: 'projectId query parameter is required' });
		}

		console.log(`[API] Checking all quests for wallet: ${walletAddress}, project: ${projectId}`);
		const service = await loadProjectService(projectId as string);
		await service.checkAllQuests(walletAddress);

		console.log(`[API] Fetching updated progress from database`);
		// Return updated progress data from database
		const progressData = await questDatabase.getUserQuestProgress(
			walletAddress,
			projectId as string
		);

		console.log(`[API] Returning ${progressData.length} progress records`);

		const progressMap = progressData.map(p => ({
			quest_id: p.quest_id,
			completed: p.completed,
			progress: p.progress,
			points_earned: p.points_earned,
			completed_at: p.completed_at,
			last_checked_at: p.last_checked_at
		}));

		res.json(progressMap);
	} catch (error) {
		console.error('[API] Error refreshing quests:', error);
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

// BATCH ENDPOINTS - For optimized frontend loading

// GET /api/batch/quests?projectIds=rtb,aave,gluex,fluid - Get quests and project metadata for multiple projects
app.get('/api/batch/quests', async (req: Request, res: Response) => {
	try {
		const { projectIds } = req.query;
		console.log(`[API] GET /api/batch/quests - projectIds: ${projectIds}`);

		if (!projectIds) {
			return res.status(400).json({ error: 'projectIds query parameter is required' });
		}

		const ids = (projectIds as string).split(',');
		const results: Record<string, { project: any; quests: any[] }> = {};

		// Load quests and project metadata for each project in parallel
		await Promise.all(
			ids.map(async (projectId) => {
				try {
					const service = await loadProjectService(projectId);
					const project = service.getProject();
					const quests = service.getQuests().map(q => q.getConfig());
					results[projectId] = {
						project: project || { id: projectId, name: projectId },
						quests
					};
					console.log(`[API] Loaded ${quests.length} quests and metadata for ${projectId}`);
				} catch (error) {
					console.error(`[API] Failed to load data for ${projectId}:`, error);
					results[projectId] = {
						project: { id: projectId, name: projectId },
						quests: []
					};
				}
			})
		);

		console.log(`[API] Returning batch quests and metadata for ${ids.length} projects`);
		res.json(results);
	} catch (error) {
		console.error('[API] Error in batch quests:', error);
		res.status(500).json({ error: 'Failed to load batch quests' });
	}
});

// GET /api/batch/progress/:walletAddress?projectIds=rtb,aave,gluex,fluid - Get cached progress for multiple projects
app.get('/api/batch/progress/:walletAddress', async (req: Request, res: Response) => {
	try {
		const { walletAddress } = req.params;
		const { projectIds } = req.query;

		console.log(`[API] GET /api/batch/progress/${walletAddress} - projectIds: ${projectIds}`);

		if (!projectIds) {
			return res.status(400).json({ error: 'projectIds query parameter is required' });
		}

		const ids = (projectIds as string).split(',');
		const results: Record<string, any[]> = {};

		// Get progress for each project in parallel
		await Promise.all(
			ids.map(async (projectId) => {
				try {
					const progressData = await questDatabase.getUserQuestProgress(
						walletAddress,
						projectId
					);

					results[projectId] = progressData.map(p => ({
						quest_id: p.quest_id,
						completed: p.completed,
						progress: p.progress,
						points_earned: p.points_earned,
						completed_at: p.completed_at,
						last_checked_at: p.last_checked_at
					}));

					console.log(`[API] Found ${progressData.length} progress records for ${projectId}`);
				} catch (error) {
					console.error(`[API] Failed to get progress for ${projectId}:`, error);
					results[projectId] = [];
				}
			})
		);

		console.log(`[API] Returning batch progress for ${ids.length} projects`);
		res.json(results);
	} catch (error) {
		console.error('[API] Error in batch progress:', error);
		res.status(500).json({ error: 'Failed to load batch progress' });
	}
});

// POST /api/batch/refresh/:walletAddress?projectIds=rtb,aave,gluex,fluid - Refresh multiple projects
app.post('/api/batch/refresh/:walletAddress', async (req: Request, res: Response) => {
	try {
		const { walletAddress } = req.params;
		const { projectIds } = req.query;

		console.log(`[API] POST /api/batch/refresh/${walletAddress} - projectIds: ${projectIds}`);

		if (!projectIds) {
			return res.status(400).json({ error: 'projectIds query parameter is required' });
		}

		const ids = (projectIds as string).split(',');
		const results: Record<string, any[]> = {};

		// Refresh each project in parallel
		await Promise.all(
			ids.map(async (projectId) => {
				try {
					const service = await loadProjectService(projectId);
					await service.checkAllQuests(walletAddress);

					const progressData = await questDatabase.getUserQuestProgress(
						walletAddress,
						projectId
					);

					results[projectId] = progressData.map(p => ({
						quest_id: p.quest_id,
						completed: p.completed,
						progress: p.progress,
						points_earned: p.points_earned,
						completed_at: p.completed_at,
						last_checked_at: p.last_checked_at
					}));

					console.log(`[API] Refreshed ${progressData.length} quests for ${projectId}`);
				} catch (error) {
					console.error(`[API] Failed to refresh ${projectId}:`, error);
					results[projectId] = [];
				}
			})
		);

		console.log(`[API] Returning batch refresh for ${ids.length} projects`);
		res.json(results);
	} catch (error) {
		console.error('[API] Error in batch refresh:', error);
		res.status(500).json({ error: 'Failed to refresh batch' });
	}
});

// GET /api/batch/points/:walletAddress?projectIds=rtb,aave,gluex,fluid - Get points for multiple projects
app.get('/api/batch/points/:walletAddress', async (req: Request, res: Response) => {
	try {
		const { walletAddress } = req.params;
		const { projectIds } = req.query;

		console.log(`[API] GET /api/batch/points/${walletAddress} - projectIds: ${projectIds}`);

		// If no projectIds specified, get all
		if (!projectIds) {
			const summaries = await questDatabase.getPointsSummary(walletAddress);
			const results: Record<string, any> = {};

			for (const summary of summaries) {
				results[summary.project_id] = summary;
			}

			return res.json(results);
		}

		const ids = (projectIds as string).split(',');
		const results: Record<string, any> = {};

		// Get points for each project
		await Promise.all(
			ids.map(async (projectId) => {
				try {
					const summaries = await questDatabase.getPointsSummary(walletAddress, projectId);
					results[projectId] = summaries[0] || {
						wallet_address: walletAddress,
						project_id: projectId,
						total_earned: 0,
						total_redeemed: 0,
						available: 0
					};
					console.log(`[API] Got points for ${projectId}: ${results[projectId].available}`);
				} catch (error) {
					console.error(`[API] Failed to get points for ${projectId}:`, error);
					results[projectId] = {
						wallet_address: walletAddress,
						project_id: projectId,
						total_earned: 0,
						total_redeemed: 0,
						available: 0
					};
				}
			})
		);

		console.log(`[API] Returning batch points for ${ids.length} projects`);
		res.json(results);
	} catch (error) {
		console.error('[API] Error in batch points:', error);
		res.status(500).json({ error: 'Failed to load batch points' });
	}
});

// 10. GET /api/transactions?projectId={id}&walletAddress={address} - Execute and get all transactions for a wallet
app.get('/api/transactions', async (req: Request, res: Response) => {
	try {
		const { projectId, walletAddress } = req.query;
		console.log(`[API] GET /api/transactions - projectId: ${projectId}, walletAddress: ${walletAddress}`);

		if (!projectId) {
			console.warn('[API] projectId query parameter missing');
			return res.status(400).json({ error: 'projectId query parameter is required' });
		}

		if (!walletAddress) {
			console.warn('[API] walletAddress query parameter missing');
			return res.status(400).json({ error: 'walletAddress query parameter is required' });
		}

		console.log(`[API] Loading project service for: ${projectId}`);
		const service = await loadProjectService(projectId as string);
		const transactionConfigs = service.getTransactions();

		console.log(`[API] Executing ${transactionConfigs.length} transactions for wallet: ${walletAddress}`);

		// Execute all transactions and normalize results
		const allNormalizedTransactions = await Promise.all(
			transactionConfigs.map(async (config) => {
				try {
					const data = await service.executeTransaction(config.name, walletAddress as string);
					// Normalize the transaction data
					return normalizeTransactions(config.name, data);
				} catch (error) {
					console.error(`[API] Error executing transaction ${config.name}:`, error);
					return [];
				}
			})
		);

		// Flatten the array of arrays and sort by timestamp (most recent first)
		const flattenedTransactions = allNormalizedTransactions
			.flat()
			.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
			.map(tx => ({
				...tx,
				points_earned: parseFloat(tx.amount) / 10000
			}));

		// Store transactions in database (filter out those without transactionHash)
		const transactionsToStore = flattenedTransactions
			.filter(tx => tx.transactionHash)
			.map(tx => ({
				wallet_address: walletAddress as string,
				project_id: projectId as string,
				transaction_hash: tx.transactionHash!,
				transaction_type: tx.transaction_type,
				timestamp: new Date(parseInt(tx.timestamp) * 1000).toISOString(),
				amount: tx.amount,
				points_earned: tx.points_earned,
			}));

		if (transactionsToStore.length > 0) {
			try {
				await questDatabase.upsertWalletTransactionsBatch(transactionsToStore);
				console.log(`[API] Stored ${transactionsToStore.length} transactions in database`);
			} catch (error) {
				console.error(`[API] Error storing transactions:`, error);
				// Continue even if storage fails - we still return the transactions
			}
		}

		console.log(`[API] Returning ${flattenedTransactions.length} normalized transactions`);
		res.json(flattenedTransactions);
	} catch (error) {
		console.error('[API] Error loading transactions:', error);
		res.status(500).json({ error: 'Failed to load transactions' });
	}
});

app.listen(port, () => {
	console.log(`Quest API server running on port ${port}`);
});
