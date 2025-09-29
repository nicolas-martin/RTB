import { describe, it, expect } from 'vitest';
import { questParser } from './questParser';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('GlueX project parsing', () => {
	it('should load and parse GlueX project TOML', async () => {
		const tomlPath = join(__dirname, '../../data/gluex/project.toml');
		const tomlContent = readFileSync(tomlPath, 'utf-8');

		const { project, quests } = await questParser.parseProjectFromFile(tomlContent);

		expect(project.id).toBe('gluex');
		expect(project.name).toBe('GlueX');
		expect(quests.length).toBe(5);

		// Test quest types
		const conditionalQuest = quests.find(q => q.getId() === 'swap_1_usdt0_to_xpl');
		expect(conditionalQuest?.getType()).toBe('conditional');

		const progressQuest = quests.find(q => q.getId() === 'total_10_swaps');
		expect(progressQuest?.getType()).toBe('progress');

		const customQuest = quests.find(q => q.getId() === 'total_value_traded_100_usdt0');
		expect(customQuest?.getType()).toBe('custom');
	});

	it('should validate custom quest with test data', async () => {
		const tomlPath = join(__dirname, '../../data/gluex/project.toml');
		const tomlContent = readFileSync(tomlPath, 'utf-8');

		const { quests } = await questParser.parseProjectFromFile(tomlContent);
		const customQuest = quests.find(q => q.getId() === 'total_value_traded_100_usdt0');

		const testData = {
			user: {
				tokenVolumes: [
					{ token: "0xtoken1", totalVolume: "60000000" },
					{ token: "0xtoken2", totalVolume: "50000000" }
				]
			}
		};

		const result = await customQuest!.validate(testData);
		expect(result.completed).toBe(true);
	});
});
