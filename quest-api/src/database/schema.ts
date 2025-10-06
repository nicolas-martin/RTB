/**
 * Database schema types for Supabase
 */

export interface QuestProgress {
	id: string;
	wallet_address: string;
	project_id: string;
	quest_id: string;
	completed: boolean;
	progress: number | null;
	points_earned: number;
	completed_at: string | null;
	last_checked_at: string;
}

export interface QuestProgressInsert {
	wallet_address: string;
	project_id: string;
	quest_id: string;
	completed: boolean;
	progress?: number | null;
	points_earned: number;
	completed_at?: string | null;
	last_checked_at: string;
}

export interface QuestProgressUpdate {
	completed?: boolean;
	progress?: number | null;
	points_earned?: number;
	completed_at?: string | null;
	last_checked_at?: string;
}

export type TransactionType = 'earned' | 'redeemed';

export interface PointsTransaction {
	id: string;
	wallet_address: string;
	project_id: string;
	transaction_type: TransactionType;
	amount: number;
	quest_id: string | null;
	reason: string | null;
	created_at: string;
}

export interface PointsTransactionInsert {
	wallet_address: string;
	project_id: string;
	transaction_type: TransactionType;
	amount: number;
	quest_id?: string | null;
	reason?: string | null;
}

export interface PointsSummary {
	wallet_address: string;
	project_id: string;
	total_earned: number;
	total_redeemed: number;
	available: number;
}
