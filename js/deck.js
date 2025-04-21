// deck.js

let deck = [];

const suits = ['♠', '♥', '♦', '♣'];
const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

export const Deck = {
  initialize() {
    deck = [];

    for (const suit of suits) {
      for (const rank of ranks) {
        let value = parseInt(rank);
        if (['J', 'Q', 'K'].includes(rank)) value = 10;
        if (rank === 'A') value = 11;

        deck.push({
          suit,
          rank,
          value,
          label: `${rank}${suit}`
        });
      }
    }

    this.shuffle();
  },

  shuffle() {
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
  },

  drawCard() {
    if (deck.length === 0) {
      this.initialize(); // Auto re-shuffle if empty
    }
    return deck.pop();
  },

  getRemainingCount() {
    return deck.length;
  }
};
