import { validate } from './busted_round_2_same_card';

const testData = {
	"data": {
		"player": {
			"games": [
				{
					"status": "BUSTED",
					"rounds": [
						{
							"roundIndex": 0,
							"roundOutcome": 34
						}
					]
				},
				{
					"status": "BUSTED",
					"rounds": [
						{
							"roundIndex": 0,
							"roundOutcome": 33
						}
					]
				},
				{
					"status": "BUSTED",
					"rounds": [
						{
							"roundIndex": 0,
							"roundOutcome": 38
						}
					]
				},
				{
					"status": "BUSTED",
					"rounds": [
						{
							"roundIndex": 0,
							"roundOutcome": 39
						}
					]
				},
				{
					"status": "BUSTED",
					"rounds": [
						{
							"roundIndex": 0,
							"roundOutcome": 10
						}
					]
				},
				{
					"status": "BUSTED",
					"rounds": [
						{
							"roundIndex": 0,
							"roundOutcome": 46
						}
					]
				},
				{
					"status": "BUSTED",
					"rounds": [
						{
							"roundIndex": 0,
							"roundOutcome": 17
						},
						{
							"roundIndex": 1,
							"roundOutcome": 32
						},
						{
							"roundIndex": 2,
							"roundOutcome": 45
						}
					]
				},
				{
					"status": "BUSTED",
					"rounds": [
						{
							"roundIndex": 0,
							"roundOutcome": 35
						}
					]
				},
				{
					"status": "BUSTED",
					"rounds": [
						{
							"roundIndex": 0,
							"roundOutcome": 17
						},
						{
							"roundIndex": 1,
							"roundOutcome": 40
						}
					]
				},
				{
					"status": "BUSTED",
					"rounds": [
						{
							"roundIndex": 0,
							"roundOutcome": 19
						},
						{
							"roundIndex": 1,
							"roundOutcome": 32
						}
					]
				},
				{
					"status": "BUSTED",
					"rounds": [
						{
							"roundIndex": 0,
							"roundOutcome": 5
						}
					]
				},
				{
					"status": "BUSTED",
					"rounds": [
						{
							"roundIndex": 0,
							"roundOutcome": 21
						}
					]
				},
				{
					"status": "BUSTED",
					"rounds": [
						{
							"roundIndex": 0,
							"roundOutcome": 39
						}
					]
				},
				{
					"status": "BUSTED",
					"rounds": [
						{
							"roundIndex": 0,
							"roundOutcome": 31
						}
					]
				},
				{
					"status": "BUSTED",
					"rounds": [
						{
							"roundIndex": 0,
							"roundOutcome": 36
						}
					]
				},
				{
					"status": "BUSTED",
					"rounds": [
						{
							"roundIndex": 0,
							"roundOutcome": 42
						}
					]
				},
				{
					"status": "BUSTED",
					"rounds": [
						{
							"roundIndex": 0,
							"roundOutcome": 42
						}
					]
				},
				{
					"status": "BUSTED",
					"rounds": [
						{
							"roundIndex": 0,
							"roundOutcome": 40
						}
					]
				},
				{
					"status": "BUSTED",
					"rounds": [
						{
							"roundIndex": 0,
							"roundOutcome": 27
						}
					]
				},
				{
					"status": "BUSTED",
					"rounds": [
						{
							"roundIndex": 0,
							"roundOutcome": 25
						},
						{
							"roundIndex": 1,
							"roundOutcome": 3
						},
						{
							"roundIndex": 2,
							"roundOutcome": 31
						},
						{
							"roundIndex": 3,
							"roundOutcome": 1
						}
					]
				},
				{
					"status": "BUSTED",
					"rounds": [
						{
							"roundIndex": 0,
							"roundOutcome": 10
						},
						{
							"roundIndex": 1,
							"roundOutcome": 38
						}
					]
				},
				{
					"status": "BUSTED",
					"rounds": [
						{
							"roundIndex": 0,
							"roundOutcome": 20
						}
					]
				},
				{
					"status": "BUSTED",
					"rounds": [
						{
							"roundIndex": 0,
							"roundOutcome": 8
						},
						{
							"roundIndex": 1,
							"roundOutcome": 51
						}
					]
				},
				{
					"status": "BUSTED",
					"rounds": [
						{
							"roundIndex": 0,
							"roundOutcome": 32
						},
						{
							"roundIndex": 1,
							"roundOutcome": 5
						},
						{
							"roundIndex": 2,
							"roundOutcome": 17
						},
						{
							"roundIndex": 3,
							"roundOutcome": 51
						}
					]
				},
				{
					"status": "BUSTED",
					"rounds": [
						{
							"roundIndex": 0,
							"roundOutcome": 46
						}
					]
				},
				{
					"status": "BUSTED",
					"rounds": [
						{
							"roundIndex": 0,
							"roundOutcome": 50
						}
					]
				}
			]
		}
	}
};

console.log('Testing busted_round_2_same_card validator');
console.log('Result:', validate(testData));
