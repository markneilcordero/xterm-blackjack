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
    if (amount <= 0) {
      TerminalManager.write('❌ Bet amount must be positive.');
      return false;
    }
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

  canDoubleDown() {
    // Typically allowed only on the first two cards
    return this.hand.length === 2 && this.balance >= this.betAmount;
  },

  canSurrender() {
    // Typically allowed only on the first two cards, before hitting
    return this.hand.length === 2;
  },

  doubleBet() {
    if (this.balance < this.betAmount) {
      TerminalManager.write('❌ Not enough balance to double down.');
      return false;
    }
    this.balance -= this.betAmount;
    this.betAmount *= 2;
    this.saveBalance();
    TerminalManager.write(`💰 Bet doubled to $${this.betAmount}.`);
    return true;
  },

  surrenderBet() {
    const refund = this.betAmount / 2;
    this.balance += refund; // Get half the bet back
    this.saveBalance();
    TerminalManager.write(`🏳️ You surrendered. Half bet ($${refund}) returned. Balance: $${this.balance}`);
    // The other half is lost, which is handled by the 'lose' outcome in game.js
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
