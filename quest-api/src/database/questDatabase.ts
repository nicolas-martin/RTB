import { getSupabaseClient } from './supabaseClient.js';
import type {
	QuestProgress,
	QuestProgressInsert,
	QuestProgressUpdate,
	PointsTransaction,
	PointsTransactionInsert,
	PointsSummary,
} from './schema.js';

export class QuestDatabase {
	/**
	 * Get quest progress for a specific user and quest
	 */
	async getQuestProgress(
		walletAddress: string,
		questId: string,
		projectId: string
	): Promise<QuestProgress | null> {
		const supabase = getSupabaseClient();

		const { data, error } = await supabase
			.from('quest_progress')
			.select('*')
			.eq('wallet_address', walletAddress)
			.eq('quest_id', questId)
			.eq('project_id', projectId)
			.single();

		if (error) {
			if (error.code === 'PGRST116') {
				// No rows returned
				return null;
			}
			throw new Error(`Failed to get quest progress: ${error.message}`);
		}

		return data;
	}

	/**
	 * Get all quest progress for a user, optionally filtered by project
	 */
	async getUserQuestProgress(
		walletAddress: string,
		projectId?: string
	): Promise<QuestProgress[]> {
		const supabase = getSupabaseClient();

		let query = supabase
			.from('quest_progress')
			.select('*')
			.eq('wallet_address', walletAddress);

		if (projectId) {
			query = query.eq('project_id', projectId);
		}

		const { data, error } = await query;

		if (error) {
			throw new Error(`Failed to get user quest progress: ${error.message}`);
		}

		return data || [];
	}

	/**
	 * Upsert quest progress (create or update)
	 */
	async upsertQuestProgress(progress: QuestProgressInsert): Promise<QuestProgress> {
		const supabase = getSupabaseClient();

		const { data, error } = await supabase
			.from('quest_progress')
			.upsert(progress, {
				onConflict: 'wallet_address,quest_id,project_id',
			})
			.select()
			.single();

		if (error) {
			throw new Error(`Failed to upsert quest progress: ${error.message}`);
		}

		return data;
	}

	/**
	 * Update existing quest progress
	 */
	async updateQuestProgress(
		walletAddress: string,
		questId: string,
		projectId: string,
		updates: QuestProgressUpdate
	): Promise<QuestProgress> {
		const supabase = getSupabaseClient();

		const { data, error } = await supabase
			.from('quest_progress')
			.update(updates)
			.eq('wallet_address', walletAddress)
			.eq('quest_id', questId)
			.eq('project_id', projectId)
			.select()
			.single();

		if (error) {
			throw new Error(`Failed to update quest progress: ${error.message}`);
		}

		return data;
	}

	/**
	 * Create a points transaction (earned or redeemed)
	 */
	async createPointsTransaction(
		transaction: PointsTransactionInsert
	): Promise<PointsTransaction> {
		const supabase = getSupabaseClient();

		const { data, error } = await supabase
			.from('points_transactions')
			.insert(transaction)
			.select()
			.single();

		if (error) {
			throw new Error(`Failed to create points transaction: ${error.message}`);
		}

		return data;
	}

	/**
	 * Get points summary for a user
	 */
	async getPointsSummary(
		walletAddress: string,
		projectId?: string
	): Promise<PointsSummary[]> {
		const supabase = getSupabaseClient();

		let query = supabase
			.from('points_transactions')
			.select('project_id, transaction_type, amount')
			.eq('wallet_address', walletAddress);

		if (projectId) {
			query = query.eq('project_id', projectId);
		}

		const { data, error } = await query;

		if (error) {
			throw new Error(`Failed to get points summary: ${error.message}`);
		}

		// Aggregate by project_id
		const summaryMap = new Map<string, PointsSummary>();

		for (const row of data || []) {
			if (!summaryMap.has(row.project_id)) {
				summaryMap.set(row.project_id, {
					wallet_address: walletAddress,
					project_id: row.project_id,
					total_earned: 0,
					total_redeemed: 0,
					available: 0,
				});
			}

			const summary = summaryMap.get(row.project_id)!;
			if (row.transaction_type === 'earned') {
				summary.total_earned += row.amount;
			} else {
				summary.total_redeemed += row.amount;
			}
			summary.available = summary.total_earned - summary.total_redeemed;
		}

		return Array.from(summaryMap.values());
	}

	/**
	 * Get all points transactions for a user
	 */
	async getPointsTransactions(
		walletAddress: string,
		projectId?: string
	): Promise<PointsTransaction[]> {
		const supabase = getSupabaseClient();

		let query = supabase
			.from('points_transactions')
			.select('*')
			.eq('wallet_address', walletAddress)
			.order('created_at', { ascending: false });

		if (projectId) {
			query = query.eq('project_id', projectId);
		}

		const { data, error } = await query;

		if (error) {
			throw new Error(`Failed to get points transactions: ${error.message}`);
		}

		return data || [];
	}

	/**
	 * Redeem points (creates a redemption transaction)
	 * Returns the new available balance or throws if insufficient funds
	 */
	async redeemPoints(
		walletAddress: string,
		projectId: string,
		amount: number,
		reason: string
	): Promise<PointsSummary> {
		// Check available balance
		const summaries = await this.getPointsSummary(walletAddress, projectId);
		const summary = summaries.find((s) => s.project_id === projectId);

		if (!summary || summary.available < amount) {
			throw new Error('Insufficient points balance');
		}

		// Create redemption transaction
		await this.createPointsTransaction({
			wallet_address: walletAddress,
			project_id: projectId,
			transaction_type: 'redeemed',
			amount,
			reason,
		});

		// Return updated summary
		const updatedSummaries = await this.getPointsSummary(walletAddress, projectId);
		const updatedSummary = updatedSummaries.find((s) => s.project_id === projectId);

		if (!updatedSummary) {
			throw new Error('Failed to get updated points summary');
		}

		return updatedSummary;
	}
}

export const questDatabase = new QuestDatabase();
