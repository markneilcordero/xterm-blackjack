// game.js
import { TerminalManager } from './terminal.js';
import { Deck } from './deck.js';
import { Player } from './player.js';
import { Storage } from './storage.js';

// After each game ends
Storage.increment('games');
Storage.increment('wins'); // or 'losses' / 'draws'

// To show stats
Storage.printStats(TerminalManager);

// To reset stats
Storage.resetStats();


Player.init();
Player.placeBet(100);
Player.receiveCard(Deck.drawCard());
Player.getHandValue();

Deck.initialize();
const card = Deck.drawCard();


const suits = ['♠', '♥', '♦', '♣'];
const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

let deck = [];
let playerHand = [];
let dealerHand = [];
let gameActive = false;
let playerStand = false;

export const Game = {
  startGame() {
    deck = this.shuffleDeck(this.createDeck());
    playerHand = [];
    dealerHand = [];
    gameActive = true;
    playerStand = false;

    playerHand.push(this.drawCard());
    dealerHand.push(this.drawCard());
    playerHand.push(this.drawCard());
    dealerHand.push(this.drawCard());

    TerminalManager.write(`\nYour Hand: ${this.formatHand(playerHand)} (Total: ${this.calculateHandValue(playerHand)})`);
    TerminalManager.write(`Dealer shows: ${dealerHand[0].label}`);

    if (this.calculateHandValue(playerHand) === 21) {
      TerminalManager.write('🎉 Blackjack! You win!');
      gameActive = false;
    }
  },

  bet(amount) {
    if (!gameActive) {
      TerminalManager.write('Start the game first using "start".');
      return;
    }
    TerminalManager.write(`You bet $${amount}. Type "hit" or "stand" to continue.`);
  },

  hit() {
    if (!gameActive || playerStand) {
      TerminalManager.write('You cannot hit now.');
      return;
    }

    const card = this.drawCard();
    playerHand.push(card);

    const total = this.calculateHandValue(playerHand);
    TerminalManager.write(`You drew: ${card.label}`);
    TerminalManager.write(`Your Hand: ${this.formatHand(playerHand)} (Total: ${total})`);

    if (total > 21) {
      TerminalManager.write('💥 Bust! You lose.');
      gameActive = false;
    } else if (total === 21) {
      this.stand();
    }
  },

  stand() {
    if (!gameActive) {
      TerminalManager.write('Game is not active.');
      return;
    }

    playerStand = true;
    TerminalManager.write(`\nYou stand. Dealer's turn...`);

    let dealerTotal = this.calculateHandValue(dealerHand);
    TerminalManager.write(`Dealer's Hand: ${this.formatHand(dealerHand)} (Total: ${dealerTotal})`);

    while (dealerTotal < 17) {
      const card = this.drawCard();
      dealerHand.push(card);
      dealerTotal = this.calculateHandValue(dealerHand);
      TerminalManager.write(`Dealer draws: ${card.label} (Total: ${dealerTotal})`);
    }

    const playerTotal = this.calculateHandValue(playerHand);

    if (dealerTotal > 21 || playerTotal > dealerTotal) {
      TerminalManager.write('🎉 You win!');
    } else if (dealerTotal === playerTotal) {
      TerminalManager.write('🤝 Push! It\'s a tie.');
    } else {
      TerminalManager.write('😢 Dealer wins.');
    }

    gameActive = false;
  },

  createDeck() {
    const deck = [];
    for (const suit of suits) {
      for (const rank of ranks) {
        let value = parseInt(rank);
        if (['J', 'Q', 'K'].includes(rank)) value = 10;
        if (rank === 'A') value = 11; // Will handle dynamic Ace logic later
        deck.push({ suit, rank, value, label: `${rank}${suit}` });
      }
    }
    return deck;
  },

  shuffleDeck(deck) {
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
  },

  drawCard() {
    return deck.pop();
  },

  calculateHandValue(hand) {
    let total = 0;
    let aces = 0;

    hand.forEach(card => {
      total += card.value;
      if (card.rank === 'A') aces++;
    });

    // Adjust Aces from 11 to 1 if bust
    while (total > 21 && aces > 0) {
      total -= 10;
      aces--;
    }

    return total;
  },

  formatHand(hand) {
    return hand.map(c => c.label).join(' ');
  }
};
