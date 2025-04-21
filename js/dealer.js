// dealer.js
import { Deck } from './deck.js';
import { TerminalManager } from './terminal.js';

export const Dealer = {
  hand: [],

  resetHand() {
    this.hand = [];
  },

  receiveCard(card) {
    this.hand.push(card);
  },

  getHandValue() {
    let total = 0;
    let aces = 0;

    this.hand.forEach(card => {
      total += card.value;
      if (card.rank === 'A') aces++;
    });

    while (total > 21 && aces > 0) {
      total -= 10;
      aces--;
    }

    return total;
  },

  showInitialCard() {
    if (this.hand.length > 0) {
      return this.hand[0].label;
    }
    return '';
  },

  showFullHand() {
    return this.hand.map(c => c.label).join(' ');
  },

  playTurn() {
    let value = this.getHandValue();

    TerminalManager.write(`Dealer's hand: ${this.showFullHand()} (Total: ${value})`);

    while (value < 17) {
      const card = Deck.drawCard();
      this.receiveCard(card);
      value = this.getHandValue();
      TerminalManager.write(`Dealer draws: ${card.label} (Total: ${value})`);
    }

    return value;
  }
};
