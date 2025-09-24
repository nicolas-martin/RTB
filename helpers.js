import {
  Alert,
} from 'react-native';
import axios from 'axios';

const helpers = {
    rules: function() {
        Alert.alert(
            'Rules', 
            '1. Pick the color. [RED or BLACK]\n\n' +
            '2. Pick the number. [HIGHER or LOWER or SAME]\n\n' + 
            '3. Pick the range. [INSIDE or OUTSIDE or SAME]\n\n' + 
            '4. Pick the suit.\n    [HEARTS or DIAMONDS or SPADES or CLUBS]'
        );
    },
    startGame: function() {
      return new Promise((resolve, reject) => {
        axios
          .get('https://deckofcardsapi.com/api/deck/new/draw/?count=4')
          .then(response => {
            resolve(response.data.cards)
          })
          .catch(error => {
            reject(error)
          })
      })
    }
}

export default helpers;