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
    if (Player.hand.length === 0) { // Use Player.hand directly or add Player.getHand()
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
     if (Player.hand.length === 0) { // Use Player.hand directly or add Player.getHand()
        TerminalManager.write('Place a bet first using "bet <amount>".');
        return;
    }

    playerStand = true;
    TerminalManager.write(`\nYou stand with ${Player.getHandValue()}. Dealer's turn...`);

    // Use internal helper for dealer's hand value
    let dealerTotal = this.calculateHandValue(dealerHand);
    TerminalManager.write(`Dealer's Full Hand: ${this.formatHand(dealerHand)} (Total: ${dealerTotal})`);

    // Dealer hits until 17 or more (including soft 17)
    while (dealerTotal < 17 || (dealerTotal === 17 && dealerHand.some(card => card.rank === 'A' && card.value === 11))) {
      TerminalManager.write('Dealer hits.');
      const card = Deck.drawCard();
      dealerHand.push(card);
      // Recalculate dealer total *after* potentially changing Ace value
      dealerTotal = this.calculateHandValue(dealerHand);
      TerminalManager.write(`Dealer draws: ${this.formatCard(card)} (New Total: ${dealerTotal})`);
    }

    const playerTotal = Player.getHandValue();
    let outcome = '';

    if (dealerTotal > 21) {
      TerminalManager.write('Dealer busts! 🎉 You win!');
      outcome = 'wins';
      Player.win(); // Use Player.win() which includes balance update
    } else if (playerTotal > dealerTotal) {
      TerminalManager.write('🎉 You win!');
      outcome = 'wins';
      Player.win(); // Use Player.win()
    } else if (dealerTotal === playerTotal) {
      TerminalManager.write('🤝 Push! It\'s a tie.');
      outcome = 'draws';
      Player.push(); // Use Player.push()
    } else {
      TerminalManager.write('😢 Dealer wins.');
      outcome = 'losses';
      Player.lose(); // Use Player.lose()
    }

    this.endGame(outcome);
  },

  doubleDown() {
    if (!gameActive || playerStand) {
      TerminalManager.write('You cannot double down now.');
      return;
    }
    if (!Player.canDoubleDown()) {
      TerminalManager.write('❌ Cannot double down. Must have exactly two cards and sufficient balance.');
      return;
    }

    if (Player.doubleBet()) {
      TerminalManager.write('Receiving one more card...');
      const card = Deck.drawCard();
      Player.receiveCard(card);
      const total = Player.getHandValue();
      TerminalManager.write(`You drew: ${this.formatCard(card)}`);
      TerminalManager.write(`Your Hand: ${this.formatHand(Player.hand)} (Total: ${total})`); // Use Player.hand

      if (total > 21) {
        TerminalManager.write('💥 Bust! You lose.');
        this.endGame('losses');
      } else {
        // Doubling down forces a stand
        this.stand();
      }
    }
  },

  surrender() {
    if (!gameActive || playerStand) {
      TerminalManager.write('You cannot surrender now.');
      return;
    }
    if (!Player.canSurrender()) {
      TerminalManager.write('❌ Cannot surrender. Must have exactly two cards.');
      return;
    }

    Player.surrenderBet();
    this.endGame('losses'); // Surrender counts as a loss for stats, balance adjusted in Player
  },

  // Helper function to end the game and update stats
  endGame(outcome) {
    Storage.increment('games');
    if (outcome) {
        Storage.increment(outcome); // 'wins', 'losses', or 'draws'
    }
    gameActive = false;
    playerStand = false;
    // Balance message is now handled by Player.win/push/lose/surrenderBet
    // TerminalManager.write(`Your balance: $${Player.getBalance()}`); // Remove this line
    TerminalManager.write('\n--- Game Over ---');
    TerminalManager.write('Type "start" for a new game, "stats" for statistics, or "help" for commands.');
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
    // Crucial part: Adjust Ace value from 11 to 1 if total > 21
    while (total > 21 && aces > 0) {
      total -= 10;
      aces--;
      // Find an Ace currently valued at 11 and conceptually change its value to 1
      // This doesn't require changing the card object itself, just the calculation
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
