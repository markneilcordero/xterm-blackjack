// player.js
import { Deck } from './deck.js';
import { TerminalManager } from './terminal.js';

export const Player = {
  balance: 1000,
  hand: [],
  betAmount: 0,

  init() {
    this.balance = this.loadBalance();
    this.resetHand();
  },

  resetHand() {
    this.hand = [];
    this.betAmount = 0;
  },

  placeBet(amount) {
    if (amount > this.balance) {
      TerminalManager.write(`❌ Not enough balance. Your current balance is $${this.balance}`);
      return false;
    }

    this.betAmount = amount;
    this.balance -= amount;
    this.saveBalance();
    return true;
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

  win() {
    const winnings = this.betAmount * 2;
    this.balance += winnings;
    this.saveBalance();
    TerminalManager.write(`🎉 You win $${winnings}! New balance: $${this.balance}`);
  },

  push() {
    this.balance += this.betAmount;
    this.saveBalance();
    TerminalManager.write(`🤝 It's a push. Bet returned. Balance: $${this.balance}`);
  },

  lose() {
    TerminalManager.write(`😢 You lost $${this.betAmount}. Balance: $${this.balance}`);
  },

  saveBalance() {
    localStorage.setItem('blackjack_balance', this.balance);
  },

  loadBalance() {
    const saved = localStorage.getItem('blackjack_balance');
    return saved ? parseInt(saved) : 1000;
  },

  resetBalance() {
    this.balance = 1000;
    this.saveBalance();
    TerminalManager.write('🔄 Balance reset to $1000.');
  }
};
