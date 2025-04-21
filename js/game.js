// Game State
let deck = [];
let playerHand = [];
let dealerHand = [];
let gameInProgress = false;
let currentBet = 0; // Add variable to track the current bet

// Handle input command from terminal
function handleGameCommand(command, term, prompt) {
  const args = command.toLowerCase().split(' ');
  const currentStats = getStats(); // Get stats early for balance checks

  switch (args[0]) {
    case 'help':
      term.writeln("Available Commands:");
      term.writeln(" - deal     : Start a new round");
      term.writeln(" - hit      : Draw a card");
      term.writeln(" - stand    : End your turn");
      term.writeln(" - stats    : View game stats");
      term.writeln(" - restart  : Reset stats");
      term.writeln(" - help     : Show this message");
      break;

    case 'deal':
      if (gameInProgress) {
        term.writeln("Game already in progress. Finish the current hand first.");
        break;
      }
      const betAmount = parseInt(args[1]);
      if (isNaN(betAmount) || betAmount <= 0) {
        term.writeln("Invalid bet amount. Usage: deal <amount>");
        break;
      }
      if (betAmount > currentStats.balance) {
        term.writeln(`Insufficient balance. Your balance is $${currentStats.balance}.`);
        break;
      }
      currentBet = betAmount; // Store the bet for this round
      startNewGame(term, currentBet);
      break;

    case 'hit':
      if (!gameInProgress) {
        term.writeln("Start a game with 'deal <amount>' first.");
        break;
      }
      playerHits(term);
      break;

    case 'stand':
      if (!gameInProgress) {
        term.writeln("You need to deal first.");
        break;
      }
      playerStands(term);
      break;

    case 'stats':
      // Include balance in stats display
      term.writeln(`Balance: $${currentStats.balance}`);
      term.writeln(`Games: ${currentStats.total}, Wins: ${currentStats.wins}, Losses: ${currentStats.losses}, Draws: ${currentStats.draws}`);
      break;

    case 'restart':
      resetStats();
      term.writeln("Stats have been reset.");
      break;

    default:
      term.writeln(`Unknown command: ${command}`);
      term.writeln("Type 'help' for a list of commands.");
  }

  prompt();
}

// Game Logic
function startNewGame(term, betAmount) {
  // Deduct bet from balance
  const stats = getStats();
  updateBalance(stats.balance - betAmount);

  deck = createShuffledDeck();
  playerHand = [drawCard(deck), drawCard(deck)];
  dealerHand = [drawCard(deck), drawCard(deck)];

  gameInProgress = true;

  term.writeln(`Dealing hand... Bet: $${betAmount}`);
  term.writeln(`Your hand: ${formatHand(playerHand)} (${calculateScore(playerHand)})`);
  term.writeln(`Dealer shows: ${formatCard(dealerHand[0])}`);

  // Check for immediate Blackjack
  const playerScore = calculateScore(playerHand);
  const dealerScore = calculateScore(dealerHand);

  if (playerScore === 21 && dealerScore === 21) {
    term.writeln("Push! Both player and dealer have Blackjack.");
    updateStats('draw', currentBet);
    gameInProgress = false;
    displayBalance(term);
  } else if (playerScore === 21) {
    term.writeln("💰 Blackjack! You win!");
    updateStats('blackjack', currentBet);
    gameInProgress = false;
    displayBalance(term);
  } else if (dealerScore === 21) {
    term.writeln(`Dealer hand: ${formatHand(dealerHand)} (${dealerScore})`);
    term.writeln("Dealer has Blackjack. You lose.");
    updateStats('loss', currentBet); // Loss already accounted for bet deduction
    gameInProgress = false;
    displayBalance(term);
  }
}

function playerHits(term) {
  playerHand.push(drawCard(deck));
  const playerScore = calculateScore(playerHand);
  term.writeln(`You drew: ${formatCard(playerHand[playerHand.length - 1])}`);
  term.writeln(`Your hand: ${formatHand(playerHand)} (${playerScore})`);

  if (playerScore > 21) {
    term.writeln("💥 You busted! Dealer wins.");
    gameInProgress = false;
    updateStats('loss', currentBet); // Loss already accounted for bet deduction
    displayBalance(term);
  }
}

function playerStands(term) {
  const playerScore = calculateScore(playerHand);
  let dealerScore = calculateScore(dealerHand);

  // Dealer draws until >= 17
  while (dealerScore < 17) {
    const card = drawCard(deck);
    dealerHand.push(card);
    dealerScore = calculateScore(dealerHand);
  }

  term.writeln(`Dealer hand: ${formatHand(dealerHand)} (${dealerScore})`);

  // Decide outcome
  if (dealerScore > 21 || playerScore > dealerScore) {
    term.writeln("✅ You win!");
    updateStats('win', currentBet);
  } else if (playerScore < dealerScore) {
    term.writeln("❌ You lose.");
    updateStats('loss', currentBet); // Loss already accounted for bet deduction
  } else {
    term.writeln("🤝 It's a draw (push).");
    updateStats('draw', currentBet);
  }

  gameInProgress = false;
  displayBalance(term);
}

// Helper function to display current balance
function displayBalance(term) {
    const stats = getStats();
    term.writeln(`Current Balance: $${stats.balance}`);
}
