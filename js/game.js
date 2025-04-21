// game.js
import { TerminalManager } from './terminal.js';
import { Deck } from './deck.js';
import { Player } from './player.js';
import { Storage } from './storage.js';

// Removed the example initialization code that was here.

let dealerHand = [];
let gameActive = false;
let playerStand = false;
let currentBet = 0; // Added to track the bet for the current round

export const Game = {
  startGame() {
    // Initialize and shuffle the deck using the Deck class
    Deck.initialize();
    Deck.shuffle();

    // Reset player state using the Player class
    Player.init(); // Assuming Player.init() resets hand and potentially other states
    dealerHand = [];
    gameActive = true;
    playerStand = false;
    currentBet = 0; // Reset bet for the new game

    TerminalManager.write('\n--- New Game Started ---');
    TerminalManager.write('Place your bet using "bet <amount>".');
    // Note: We don't deal cards until a bet is placed.
  },

  bet(amount) {
    if (gameActive && Player.getHand().length > 0) {
        TerminalManager.write('Bet already placed for this round.');
        return;
    }
    if (!gameActive) {
        TerminalManager.write('Start the game first using "start".');
        return;
    }
    if (isNaN(amount) || amount <= 0) {
        TerminalManager.write('Please enter a valid bet amount.');
        return;
    }

    // Use Player class for betting logic (assuming it returns true on success)
    if (Player.placeBet(amount)) {
        currentBet = amount; // Store the bet amount for payout calculation
        TerminalManager.write(`You bet $${amount}. Dealing cards...`);
        this.dealInitialCards();
    } else {
        // Assumes Player.placeBet handles writing insufficient funds message
        // Or add: TerminalManager.write('Insufficient funds.');
    }
  },

  dealInitialCards() {
    // Deal cards using Deck and Player classes
    Player.receiveCard(Deck.drawCard());
    dealerHand.push(Deck.drawCard());
    Player.receiveCard(Deck.drawCard());
    dealerHand.push(Deck.drawCard());

    TerminalManager.write(`\nYour Hand: ${this.formatHand(Player.getHand())} (Total: ${Player.getHandValue()})`);
    // Show only one dealer card
    TerminalManager.write(`Dealer shows: ${this.formatCard(dealerHand[0])}`);

    if (Player.getHandValue() === 21) {
      TerminalManager.write('🎉 Blackjack!');
      // Optionally auto-stand or handle Blackjack payout immediately
      this.stand(); // Proceed to dealer's turn
    } else {
      TerminalManager.write('Type "hit" or "stand".');
    }
  },

  hit() {
    if (!gameActive || playerStand) {
      TerminalManager.write('You cannot hit now.');
      return;
    }
    if (Player.getHand().length === 0) {
        TerminalManager.write('Place a bet first using "bet <amount>".');
        return;
    }


    const card = Deck.drawCard();
    Player.receiveCard(card); // Add card using Player class

    const total = Player.getHandValue(); // Get value using Player class
    TerminalManager.write(`You drew: ${this.formatCard(card)}`);
    TerminalManager.write(`Your Hand: ${this.formatHand(Player.getHand())} (Total: ${total})`);

    if (total > 21) {
      TerminalManager.write('💥 Bust! You lose.');
      this.endGame('losses'); // End game and record loss
    } else if (total === 21) {
      TerminalManager.write('You have 21!');
      this.stand(); // Automatically stand if player hits 21
    }
  },

  stand() {
    if (!gameActive) {
      TerminalManager.write('Game is not active.');
      return;
    }
     if (Player.getHand().length === 0) {
        TerminalManager.write('Place a bet first using "bet <amount>".');
        return;
    }

    playerStand = true;
    TerminalManager.write(`\nYou stand with ${Player.getHandValue()}. Dealer's turn...`);

    // Use internal helper for dealer's hand value
    let dealerTotal = this.calculateHandValue(dealerHand);
    TerminalManager.write(`Dealer's Full Hand: ${this.formatHand(dealerHand)} (Total: ${dealerTotal})`);

    // Dealer hits until 17 or more
    while (dealerTotal < 17) {
      TerminalManager.write('Dealer hits.');
      const card = Deck.drawCard();
      dealerHand.push(card);
      dealerTotal = this.calculateHandValue(dealerHand);
      TerminalManager.write(`Dealer draws: ${this.formatCard(card)} (Total: ${dealerTotal})`);
    }

    const playerTotal = Player.getHandValue();
    let outcome = '';

    if (dealerTotal > 21) {
      TerminalManager.write('Dealer busts! 🎉 You win!');
      outcome = 'wins';
      Player.updateBalance(currentBet * 2); // Win bet amount (1:1 payout)
    } else if (playerTotal > dealerTotal) {
      TerminalManager.write('🎉 You win!');
      outcome = 'wins';
      Player.updateBalance(currentBet * 2); // Win bet amount
    } else if (dealerTotal === playerTotal) {
      TerminalManager.write('🤝 Push! It\'s a tie.');
      outcome = 'draws';
      Player.updateBalance(currentBet); // Return original bet
    } else {
      TerminalManager.write('😢 Dealer wins.');
      outcome = 'losses';
      // Player balance already reduced by placeBet, no update needed on loss
    }

    this.endGame(outcome);
  },

  // Helper function to end the game and update stats
  endGame(outcome) {
    Storage.increment('games');
    if (outcome) {
        Storage.increment(outcome); // 'wins', 'losses', or 'draws'
    }
    gameActive = false;
    playerStand = false;
    TerminalManager.write(`Your balance: $${Player.getBalance()}`); // Show updated balance
    TerminalManager.write('--- Game Over ---');
    TerminalManager.write('Type "start" for a new game, or "stats" to see statistics.');
  },


  // Keep internal helpers for dealer logic and formatting if not in Player/Deck
  calculateHandValue(hand) {
    let total = 0;
    let aces = 0;
    hand.forEach(card => {
      // Assuming card objects have a 'value' property
      total += card.value;
      if (card.rank === 'A') aces++; // Assuming card objects have a 'rank' property
    });
    while (total > 21 && aces > 0) {
      total -= 10;
      aces--;
    }
    return total;
  },

  formatCard(card) {
    // Assuming card objects have suit and rank properties
    return `${card.rank}${card.suit}`;
  },

  formatHand(hand) {
    return hand.map(c => this.formatCard(c)).join(' ');
  }
};
