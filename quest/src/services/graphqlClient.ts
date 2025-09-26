import { GraphQLClient } from 'graphql-request';

export class GraphQLService {
	private client: GraphQLClient;

	constructor(endpoint: string) {
		this.client = new GraphQLClient(endpoint, {
			headers: {
				'Content-Type': 'application/json',
			},
		});
	}

	async executeQuery<T = any>(
		query: string,
		variables?: Record<string, any>
	): Promise<T> {
		try {
			const data = await this.client.request<T>(query, variables);
			return data;
		} catch (error) {
			console.error('GraphQL query error:', error);
			throw new Error(
				`Failed to execute GraphQL query: ${error instanceof Error ? error.message : 'Unknown error'}`
			);
		}
	}

	updateEndpoint(endpoint: string) {
		this.client = new GraphQLClient(endpoint, {
			headers: {
				'Content-Type': 'application/json',
			},
		});
	}
}

export const createGraphQLService = (endpoint: string) =>
	new GraphQLService(endpoint);
