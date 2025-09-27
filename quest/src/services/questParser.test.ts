import { describe, it, expect } from 'vitest';
import { questParser } from './questParser';
import { readFileSync } from 'fs';
import { join } from 'path';
import { validate } from '../../data/rtb/validators/busted_round_2_same_card';

describe('QuestParser with custom validator', () => {
	it('should load TOML, parse custom quest, and validate with GraphQL result', async () => {
		const tomlPath = join(__dirname, '../../data/rtb/project.toml');
		const tomlContent = readFileSync(tomlPath, 'utf-8');

		const { project, quests } = await questParser.parseProjectFromFile(tomlContent);

		expect(project.id).toBe('rtb');
		expect(quests.length).toBeGreaterThan(0);

		const customQuest = quests.find(q => q.getId() === 'busted_round_2_same_card');
		expect(customQuest).toBeDefined();
		expect(customQuest?.getType()).toBe('custom');

		const graphqlResult = {
			player: {
				games: [
					{
						status: 'BUSTED',
						rounds: [
							{ roundIndex: 0, roundOutcome: '6H' },
							{ roundIndex: 1, roundOutcome: '6D' }
						]
					}
				]
			}
		};

		const result = await customQuest!.validate(graphqlResult);

		expect(result.completed).toBe(true);
	});

	it('should return false when rounds have different ranks', async () => {
		const tomlPath = join(__dirname, '../../data/rtb/project.toml');
		const tomlContent = readFileSync(tomlPath, 'utf-8');

		const { quests } = await questParser.parseProjectFromFile(tomlContent);
		const customQuest = quests.find(q => q.getId() === 'busted_round_2_same_card');

		const graphqlResult = {
			player: {
				games: [
					{
						status: 'BUSTED',
						rounds: [
							{ roundIndex: 0, roundOutcome: '5H' },
							{ roundIndex: 1, roundOutcome: '3S' }
						]
					}
				]
			}
		};

		const result = await customQuest!.validate(graphqlResult);

		expect(result.completed).toBe(false);
	});

	it('should test the actual validator function from data/rtb/validators', () => {
		const graphqlResult = {
			player: {
				games: [
					{
						status: 'BUSTED',
						rounds: [
							{ roundIndex: 0, roundOutcome: '6H' },
							{ roundIndex: 1, roundOutcome: '6D' }
						]
					}
				]
			}
		};

		const result = validate(graphqlResult);
		expect(result).toBe(true);
	});

	it('should return false with the actual validator when ranks differ', () => {
		const graphqlResult = {
			player: {
				games: [
					{
						status: 'BUSTED',
						rounds: [
							{ roundIndex: 0, roundOutcome: '5H' },
							{ roundIndex: 1, roundOutcome: '3S' }
						]
					}
				]
			}
		};

		const result = validate(graphqlResult);
		expect(result).toBe(false);
	});
});
