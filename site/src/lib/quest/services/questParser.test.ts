import { describe, it, expect } from 'vitest';
import { QuestParser } from './questParser';
import { CustomQuest } from '../models';

describe('QuestParser type parameter parsing', () => {
	const parser = new QuestParser();

	it('should parse custom type without parameters', async () => {
		const tomlContent = `
[project]
id = "test"
name = "Test"
description = "Test project"
graphqlEndpoint = "https://example.com"

[[quest]]
id = "test_quest"
title = "Test Quest"
description = "Test description"
reward = 1000
type = "custom"
query = "query { test }"
`;

		const result = await parser.parseProjectFromFile(tomlContent);
		expect(result.quests).toHaveLength(1);
		expect(result.quests[0].getConfig().type).toBe('custom');
	});

	it('should parse custom type with single parameter', async () => {
		const tomlContent = `
[project]
id = "test"
name = "Test"
description = "Test project"
graphqlEndpoint = "https://example.com"

[[quest]]
id = "test_quest"
title = "Test Quest"
description = "Test description"
reward = 1000
type = "custom(100000000)"
query = "query { test }"
`;

		const result = await parser.parseProjectFromFile(tomlContent);
		expect(result.quests).toHaveLength(1);
		expect(result.quests[0].getConfig().type).toBe('custom');
		expect(result.quests[0]).toBeInstanceOf(CustomQuest);
		if (result.quests[0] instanceof CustomQuest) {
			expect(result.quests[0].getTypeParams()).toEqual([100000000]);
		}
	});

	it('should parse custom type with multiple parameters', async () => {
		const tomlContent = `
[project]
id = "test"
name = "Test"
description = "Test project"
graphqlEndpoint = "https://example.com"

[[quest]]
id = "test_quest"
title = "Test Quest"
description = "Test description"
reward = 1000
type = "custom(100000000, 'daily', true)"
query = "query { test }"
`;

		const result = await parser.parseProjectFromFile(tomlContent);
		expect(result.quests).toHaveLength(1);
		expect(result.quests[0].getConfig().type).toBe('custom');
		expect(result.quests[0]).toBeInstanceOf(CustomQuest);
		if (result.quests[0] instanceof CustomQuest) {
			expect(result.quests[0].getTypeParams()).toEqual([100000000, 'daily', true]);
		}
	});
});
