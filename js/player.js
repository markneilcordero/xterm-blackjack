// Player Module

const Player = {
    hand: [],
  
    addCard(card) {
      this.hand.push(card);
    },
  
    getHand() {
      return this.hand;
    },
  
    resetHand() {
      this.hand = [];
    },
  
    getScore() {
      return calculateScore(this.hand); // from utils.js
    },
  
    displayHand() {
      return `${formatHand(this.hand)} (${this.getScore()})`; // from utils.js
    }
  };
  