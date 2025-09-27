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
							"roundOutcome": "JC"
						}
					]
				},
				{
					"status": "BUSTED",
					"rounds": [
						{
							"roundIndex": 0,
							"roundOutcome": "8C"
						}
					]
				},
				{
					"status": "BUSTED",
					"rounds": [
						{
							"roundIndex": 0,
							"roundOutcome": "7S"
						}
					]
				},
				{
					"status": "BUSTED",
					"rounds": [
						{
							"roundIndex": 0,
							"roundOutcome": "2S"
						}
					]
				},
				{
					"status": "BUSTED",
					"rounds": [
						{
							"roundIndex": 0,
							"roundOutcome": "3S"
						}
					]
				},
				{
					"status": "BUSTED",
					"rounds": [
						{
							"roundIndex": 0,
							"roundOutcome": "5H"
						},
						{
							"roundIndex": 1,
							"roundOutcome": "3S"
						}
					]
				},
				{
					"status": "BUSTED",
					"rounds": [
						{
							"roundIndex": 0,
							"roundOutcome": "7D"
						},
						{
							"roundIndex": 1,
							"roundOutcome": "JS"
						},
						{
							"roundIndex": 2,
							"roundOutcome": "10C"
						}
					]
				},
				{
					"status": "BUSTED",
					"rounds": [
						{
							"roundIndex": 0,
							"roundOutcome": "JC"
						}
					]
				},
				{
					"status": "BUSTED",
					"rounds": [
						{
							"roundIndex": 0,
							"roundOutcome": "5C"
						}
					]
				},
				{
					"status": "BUSTED",
					"rounds": [
						{
							"roundIndex": 0,
							"roundOutcome": "9S"
						}
					]
				},
				{
					"status": "BUSTED",
					"rounds": [
						{
							"roundIndex": 0,
							"roundOutcome": "AC"
						}
					]
				},
				{
					"status": "BUSTED",
					"rounds": [
						{
							"roundIndex": 0,
							"roundOutcome": "AS"
						}
					]
				},
				{
					"status": "BUSTED",
					"rounds": [
						{
							"roundIndex": 0,
							"roundOutcome": "2S"
						}
					]
				},
				{
					"status": "BUSTED",
					"rounds": [
						{
							"roundIndex": 0,
							"roundOutcome": "JD"
						}
					]
				},
				{
					"status": "BUSTED",
					"rounds": [
						{
							"roundIndex": 0,
							"roundOutcome": "KH"
						},
						{
							"roundIndex": 1,
							"roundOutcome": "7C"
						},
						{
							"roundIndex": 2,
							"roundOutcome": "KS"
						}
					]
				},
				{
					"status": "BUSTED",
					"rounds": [
						{
							"roundIndex": 0,
							"roundOutcome": "KC"
						}
					]
				},
				{
					"status": "BUSTED",
					"rounds": [
						{
							"roundIndex": 0,
							"roundOutcome": "9H"
						},
						{
							"roundIndex": 1,
							"roundOutcome": "3H"
						}
					]
				},
				{
					"status": "BUSTED",
					"rounds": [
						{
							"roundIndex": 0,
							"roundOutcome": "9H"
						}
					]
				},
				{
					"status": "BUSTED",
					"rounds": [
						{
							"roundIndex": 0,
							"roundOutcome": "9C"
						}
					]
				},
				{
					"status": "BUSTED",
					"rounds": [
						{
							"roundIndex": 0,
							"roundOutcome": "3C"
						}
					]
				},
				{
					"status": "BUSTED",
					"rounds": [
						{
							"roundIndex": 0,
							"roundOutcome": "6S"
						}
					]
				},
				{
					"status": "BUSTED",
					"rounds": [
						{
							"roundIndex": 0,
							"roundOutcome": "KS"
						}
					]
				},
				{
					"status": "BUSTED",
					"rounds": [
						{
							"roundIndex": 0,
							"roundOutcome": "6C"
						}
					]
				},
				{
					"status": "BUSTED",
					"rounds": [
						{
							"roundIndex": 0,
							"roundOutcome": "KS"
						}
					]
				},
				{
					"status": "BUSTED",
					"rounds": [
						{
							"roundIndex": 0,
							"roundOutcome": "10S"
						}
					]
				},
				{
					"status": "BUSTED",
					"rounds": [
						{
							"roundIndex": 0,
							"roundOutcome": "6S"
						}
					]
				},
				{
					"status": "BUSTED",
					"rounds": [
						{
							"roundIndex": 0,
							"roundOutcome": "7S"
						}
					]
				},
				{
					"status": "BUSTED",
					"rounds": [
						{
							"roundIndex": 0,
							"roundOutcome": "8C"
						}
					]
				},
				{
					"status": "BUSTED",
					"rounds": [
						{
							"roundIndex": 0,
							"roundOutcome": "KH"
						}
					]
				},
				{
					"status": "BUSTED",
					"rounds": [
						{
							"roundIndex": 0,
							"roundOutcome": "5C"
						}
					]
				},
				{
					"status": "BUSTED",
					"rounds": [
						{
							"roundIndex": 0,
							"roundOutcome": "KC"
						}
					]
				},
				{
					"status": "BUSTED",
					"rounds": [
						{
							"roundIndex": 0,
							"roundOutcome": "4D"
						},
						{
							"roundIndex": 1,
							"roundOutcome": "QH"
						},
						{
							"roundIndex": 2,
							"roundOutcome": "10S"
						}
					]
				},
				{
					"status": "BUSTED",
					"rounds": [
						{
							"roundIndex": 0,
							"roundOutcome": "QS"
						}
					]
				},
				{
					"status": "BUSTED",
					"rounds": [
						{
							"roundIndex": 0,
							"roundOutcome": "10C"
						}
					]
				},
				{
					"status": "BUSTED",
					"rounds": [
						{
							"roundIndex": 0,
							"roundOutcome": "3D"
						},
						{
							"roundIndex": 1,
							"roundOutcome": "9D"
						},
						{
							"roundIndex": 2,
							"roundOutcome": "3S"
						}
					]
				},
				{
					"status": "BUSTED",
					"rounds": [
						{
							"roundIndex": 0,
							"roundOutcome": "2D"
						},
						{
							"roundIndex": 1,
							"roundOutcome": "AS"
						}
					]
				},
				{
					"status": "BUSTED",
					"rounds": [
						{
							"roundIndex": 0,
							"roundOutcome": "9C"
						}
					]
				},
				{
					"status": "BUSTED",
					"rounds": [
						{
							"roundIndex": 0,
							"roundOutcome": "6H"
						},
						{
							"roundIndex": 1,
							"roundOutcome": "6D"
						}
					]
				},
				{
					"status": "BUSTED",
					"rounds": [
						{
							"roundIndex": 0,
							"roundOutcome": "JH"
						},
						{
							"roundIndex": 1,
							"roundOutcome": "2C"
						},
						{
							"roundIndex": 2,
							"roundOutcome": "AD"
						}
					]
				},
				{
					"status": "BUSTED",
					"rounds": [
						{
							"roundIndex": 0,
							"roundOutcome": "3C"
						}
					]
				},
				{
					"status": "BUSTED",
					"rounds": [
						{
							"roundIndex": 0,
							"roundOutcome": "8H"
						},
						{
							"roundIndex": 1,
							"roundOutcome": "KC"
						}
					]
				},
				{
					"status": "BUSTED",
					"rounds": [
						{
							"roundIndex": 0,
							"roundOutcome": "QD"
						},
						{
							"roundIndex": 1,
							"roundOutcome": "4S"
						},
						{
							"roundIndex": 2,
							"roundOutcome": "QS"
						}
					]
				},
				{
					"status": "BUSTED",
					"rounds": [
						{
							"roundIndex": 0,
							"roundOutcome": "7H"
						},
						{
							"roundIndex": 1,
							"roundOutcome": "10H"
						}
					]
				},
				{
					"status": "BUSTED",
					"rounds": [
						{
							"roundIndex": 0,
							"roundOutcome": "KH"
						},
						{
							"roundIndex": 1,
							"roundOutcome": "9D"
						},
						{
							"roundIndex": 2,
							"roundOutcome": "10S"
						}
					]
				},
				{
					"status": "BUSTED",
					"rounds": [
						{
							"roundIndex": 0,
							"roundOutcome": "QC"
						},
						{
							"roundIndex": 1,
							"roundOutcome": "2C"
						},
						{
							"roundIndex": 2,
							"roundOutcome": "8S"
						},
						{
							"roundIndex": 3,
							"roundOutcome": "7D"
						}
					]
				},
				{
					"status": "BUSTED",
					"rounds": [
						{
							"roundIndex": 0,
							"roundOutcome": "2D"
						},
						{
							"roundIndex": 1,
							"roundOutcome": "7D"
						},
						{
							"roundIndex": 2,
							"roundOutcome": "9H"
						},
						{
							"roundIndex": 3,
							"roundOutcome": "KH"
						}
					]
				},
				{
					"status": "BUSTED",
					"rounds": [
						{
							"roundIndex": 0,
							"roundOutcome": "AH"
						},
						{
							"roundIndex": 1,
							"roundOutcome": "9D"
						},
						{
							"roundIndex": 2,
							"roundOutcome": "QD"
						}
					]
				},
				{
					"status": "BUSTED",
					"rounds": [
						{
							"roundIndex": 0,
							"roundOutcome": "3C"
						}
					]
				},
				{
					"status": "BUSTED",
					"rounds": [
						{
							"roundIndex": 0,
							"roundOutcome": "4C"
						}
					]
				},
				{
					"status": "BUSTED",
					"rounds": [
						{
							"roundIndex": 0,
							"roundOutcome": "AH"
						},
						{
							"roundIndex": 1,
							"roundOutcome": "QD"
						},
						{
							"roundIndex": 2,
							"roundOutcome": "KS"
						}
					]
				},
				{
					"status": "BUSTED",
					"rounds": [
						{
							"roundIndex": 0,
							"roundOutcome": "2D"
						},
						{
							"roundIndex": 1,
							"roundOutcome": "3C"
						},
						{
							"roundIndex": 2,
							"roundOutcome": "8S"
						},
						{
							"roundIndex": 3,
							"roundOutcome": "8C"
						}
					]
				},
				{
					"status": "BUSTED",
					"rounds": [
						{
							"roundIndex": 0,
							"roundOutcome": "9D"
						}
					]
				},
				{
					"status": "BUSTED",
					"rounds": [
						{
							"roundIndex": 0,
							"roundOutcome": "9S"
						}
					]
				},
				{
					"status": "BUSTED",
					"rounds": [
						{
							"roundIndex": 0,
							"roundOutcome": "4C"
						}
					]
				},
				{
					"status": "BUSTED",
					"rounds": [
						{
							"roundIndex": 0,
							"roundOutcome": "QS"
						}
					]
				},
				{
					"status": "BUSTED",
					"rounds": [
						{
							"roundIndex": 0,
							"roundOutcome": "4H"
						},
						{
							"roundIndex": 1,
							"roundOutcome": "6D"
						}
					]
				},
				{
					"status": "BUSTED",
					"rounds": [
						{
							"roundIndex": 0,
							"roundOutcome": "4C"
						}
					]
				},
				{
					"status": "BUSTED",
					"rounds": [
						{
							"roundIndex": 0,
							"roundOutcome": "3D"
						},
						{
							"roundIndex": 1,
							"roundOutcome": "7C"
						},
						{
							"roundIndex": 2,
							"roundOutcome": "9C"
						},
						{
							"roundIndex": 3,
							"roundOutcome": "JD"
						}
					]
				},
				{
					"status": "BUSTED",
					"rounds": [
						{
							"roundIndex": 0,
							"roundOutcome": "7S"
						}
					]
				},
				{
					"status": "BUSTED",
					"rounds": [
						{
							"roundIndex": 0,
							"roundOutcome": "3H"
						}
					]
				},
				{
					"status": "BUSTED",
					"rounds": [
						{
							"roundIndex": 0,
							"roundOutcome": "4H"
						},
						{
							"roundIndex": 1,
							"roundOutcome": "9C"
						},
						{
							"roundIndex": 2,
							"roundOutcome": "JC"
						},
						{
							"roundIndex": 3,
							"roundOutcome": "5H"
						}
					]
				},
				{
					"status": "BUSTED",
					"rounds": [
						{
							"roundIndex": 0,
							"roundOutcome": "6S"
						}
					]
				},
				{
					"status": "BUSTED",
					"rounds": [
						{
							"roundIndex": 0,
							"roundOutcome": "JS"
						}
					]
				},
				{
					"status": "BUSTED",
					"rounds": [
						{
							"roundIndex": 0,
							"roundOutcome": "5S"
						}
					]
				},
				{
					"status": "BUSTED",
					"rounds": [
						{
							"roundIndex": 0,
							"roundOutcome": "JH"
						}
					]
				},
				{
					"status": "BUSTED",
					"rounds": [
						{
							"roundIndex": 0,
							"roundOutcome": "4D"
						}
					]
				},
				{
					"status": "BUSTED",
					"rounds": [
						{
							"roundIndex": 0,
							"roundOutcome": "QS"
						}
					]
				},
				{
					"status": "BUSTED",
					"rounds": [
						{
							"roundIndex": 0,
							"roundOutcome": "AH"
						},
						{
							"roundIndex": 1,
							"roundOutcome": "8D"
						},
						{
							"roundIndex": 2,
							"roundOutcome": "7S"
						}
					]
				},
				{
					"status": "BUSTED",
					"rounds": [
						{
							"roundIndex": 0,
							"roundOutcome": "QS"
						}
					]
				},
				{
					"status": "BUSTED",
					"rounds": [
						{
							"roundIndex": 0,
							"roundOutcome": "QH"
						},
						{
							"roundIndex": 1,
							"roundOutcome": "JD"
						}
					]
				}
			]
		}
	}
};

console.log('Testing busted_round_2_same_card validator');
console.log('Result:', validate(testData));
