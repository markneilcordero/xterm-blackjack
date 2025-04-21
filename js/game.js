// Game State
let deck = [];
// let playerHand = []; // Replaced by playerHands array
let dealerHand = [];
let gameInProgress = false;
let currentBet = 0; // Bet per hand after split

// State for handling splits
let playerHands = []; // Array to hold player's hands (can be more than one after split)
let bets = []; // Array to hold bet amount for each hand
let activeHandIndex = 0; // Index of the hand currently being played
let canSplit = false; // Flag to indicate if splitting is currently allowed

// Handle input command from terminal
function handleGameCommand(command, term, prompt) {
  const args = command.toLowerCase().split(' ');
  const currentStats = getStats(); // Get stats early for balance checks

  switch (args[0]) {
    case 'help':
      term.writeln("Available Commands:");
      term.writeln(" - deal <amount> : Start a new round with a bet");
      term.writeln(" - hit           : Draw a card for the current hand");
      term.writeln(" - stand         : End your turn for the current hand");
      term.writeln(" - split         : Split your hand if dealt a pair (requires additional bet)");
      term.writeln(" - stats         : View game stats and balance");
      term.writeln(" - restart       : Reset stats and balance");
      term.writeln(" - help          : Show this message");
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
      // Reset split state variables
      playerHands = [];
      bets = [];
      activeHandIndex = 0;
      canSplit = false;
      currentBet = betAmount; // Store the initial bet
      startNewGame(term, currentBet);
      break;

    case 'hit':
      if (!gameInProgress) {
        term.writeln("Start a game with 'deal <amount>' first.");
        break;
      }
      if (canSplit) {
          term.writeln("You must 'hit', 'stand', or 'split' first.");
          break;
      }
      playerHits(term);
      break;

    case 'stand':
      if (!gameInProgress) {
        term.writeln("You need to deal first.");
        break;
      }
       if (canSplit) {
          term.writeln("Decide whether to 'split' before standing.");
          // Or automatically stand if they type stand when split is possible? Let's require a choice.
          // Alternatively, disable split if they hit first.
          // For now, just prompt.
          break;
      }
      playerStands(term);
      break;

    case 'split':
        if (!gameInProgress) {
            term.writeln("Start a game with 'deal <amount>' first.");
            break;
        }
        if (!canSplit) {
            term.writeln("You can only split on your first two cards if they are a pair.");
            break;
        }
        if (currentStats.balance < currentBet) {
            term.writeln(`Insufficient balance to split. You need $${currentBet} more.`);
            break;
        }
        playerSplits(term);
        break;

    case 'stats':
      // Include balance in stats display
      term.writeln(`Balance: $${currentStats.balance}`);
      term.writeln(`Games: ${currentStats.total}, Wins: ${currentStats.wins}, Losses: ${currentStats.losses}, Draws: ${currentStats.draws}`);
      break;

    case 'restart':
      resetStats();
      term.writeln("Stats have been reset.");
      // Reset split state variables as well
      playerHands = [];
      bets = [];
      activeHandIndex = 0;
      canSplit = false;
      gameInProgress = false;
      currentBet = 0;
      break;

    default:
      term.writeln(`Unknown command: ${command}`);
      term.writeln("Type 'help' for a list of commands.");
      break;
  }

  // Only prompt if game hasn't ended automatically (e.g., Blackjack)
  if (gameInProgress || args[0] === 'help' || args[0] === 'stats' || args[0] === 'restart' || args[0] === 'deal' && !gameInProgress) {
      // Avoid double prompt after game ends
      if(!(args[0] === 'deal' && !gameInProgress && playerHands.length > 0)) { // Avoid prompt if deal failed
         prompt();
      }
  }
}

// Game Logic
function startNewGame(term, betAmount) {
  // Deduct bet from balance
  const stats = getStats();
  updateBalance(stats.balance - betAmount);

  deck = createShuffledDeck();
  // Initialize the first hand
  playerHands = [[drawCard(deck), drawCard(deck)]];
  bets = [betAmount];
  activeHandIndex = 0;
  dealerHand = [drawCard(deck), drawCard(deck)];

  gameInProgress = true;
  canSplit = false; // Reset split availability

  term.writeln(`Dealing hand... Bet: $${betAmount}`);
  term.writeln(`Your hand: ${formatHand(playerHands[0])} (${calculateScore(playerHands[0])})`);
  term.writeln(`Dealer shows: ${formatCard(dealerHand[0])}`);

  // Check for immediate Blackjack for player and dealer
  const playerScore = calculateScore(playerHands[0]);
  const dealerScore = calculateScore(dealerHand);

  if (playerScore === 21 && dealerScore === 21) {
    term.writeln("Push! Both player and dealer have Blackjack.");
    updateStats('draw', bets[0]);
    gameInProgress = false;
    displayBalance(term);
    prompt(); // Need prompt here as game ends immediately
    return;
  } else if (playerScore === 21) {
    term.writeln("💰 Blackjack! You win!");
    updateStats('blackjack', bets[0]);
    gameInProgress = false;
    displayBalance(term);
    prompt(); // Need prompt here as game ends immediately
    return;
  } else if (dealerScore === 21) {
    term.writeln(`Dealer hand: ${formatHand(dealerHand)} (${dealerScore})`);
    term.writeln("Dealer has Blackjack. You lose.");
    updateStats('loss', bets[0]); // Loss already accounted for bet deduction
    gameInProgress = false;
    displayBalance(term);
    prompt(); // Need prompt here as game ends immediately
    return;
  }

  // Check if the player can split
  if (playerHands[0].length === 2 && getCardRank(playerHands[0][0]) === getCardRank(playerHands[0][1])) {
      if (stats.balance >= betAmount) { // Check if they *can* afford to split
        term.writeln("You have a pair! Type 'split' to split your hand.");
        canSplit = true;
      } else {
        term.writeln("You have a pair, but not enough balance to split.");
        canSplit = false;
      }
  }
}

// Function to handle player splitting
function playerSplits(term) {
    canSplit = false; // Can only split once

    // Deduct bet for the second hand
    const stats = getStats();
    updateBalance(stats.balance - currentBet);

    // Create two hands
    const card1 = playerHands[0][0];
    const card2 = playerHands[0][1];
    playerHands = [[card1], [card2]];
    bets = [currentBet, currentBet]; // Bets for each hand
    activeHandIndex = 0;

    // Deal one card to each new hand
    playerHands[0].push(drawCard(deck));
    playerHands[1].push(drawCard(deck));

    term.writeln(`Splitting hand. Bet $${currentBet} on each hand.`);
    term.writeln(`Hand 1: ${formatHand(playerHands[0])} (${calculateScore(playerHands[0])})`);
    term.writeln(`Hand 2: ${formatHand(playerHands[1])} (${calculateScore(playerHands[1])})`);

    // Check for Blackjack on split hands (counts as 21, not Blackjack payout)
    // Handle Ace + 10/J/Q/K immediately (player stands automatically on these)
    let hand1Score = calculateScore(playerHands[0]);
    let hand2Score = calculateScore(playerHands[1]);

    if (hand1Score === 21) {
        term.writeln(`Hand 1 has 21!`);
        // Move to next hand if hand 1 got 21
        activeHandIndex++;
        if (hand2Score === 21) {
             term.writeln(`Hand 2 has 21!`);
             // Both hands are 21, proceed to dealer
             finishPlayerTurn(term);
             return;
        }
        term.writeln(`Now playing Hand 2: ${formatHand(playerHands[activeHandIndex])} (${calculateScore(playerHands[activeHandIndex])})`);

    } else {
         term.writeln(`Now playing Hand 1: ${formatHand(playerHands[activeHandIndex])} (${calculateScore(playerHands[activeHandIndex])})`);
    }
    // If hand 2 got 21 but hand 1 didn't, active index is already 0, player plays hand 1.
    // If hand 1 got 21, active index becomes 1. Player plays hand 2.
    // If neither got 21, active index is 0. Player plays hand 1.
}


function playerHits(term) {
  canSplit = false; // Cannot split after hitting
  const currentHand = playerHands[activeHandIndex];
  currentHand.push(drawCard(deck));
  const playerScore = calculateScore(currentHand);

  term.writeln(`Hand ${activeHandIndex + 1} drew: ${formatCard(currentHand[currentHand.length - 1])}`);
  term.writeln(`Hand ${activeHandIndex + 1}: ${formatHand(currentHand)} (${playerScore})`);

  if (playerScore > 21) {
    term.writeln(`💥 Hand ${activeHandIndex + 1} busted!`);
    // Move to the next hand if available, otherwise finish turn
    if (activeHandIndex < playerHands.length - 1) {
      activeHandIndex++;
      term.writeln(`Now playing Hand ${activeHandIndex + 1}: ${formatHand(playerHands[activeHandIndex])} (${calculateScore(playerHands[activeHandIndex])})`);
    } else {
      finishPlayerTurn(term);
    }
  }
}

function playerStands(term) {
  canSplit = false; // Cannot split after standing
  term.writeln(`Standing on Hand ${activeHandIndex + 1} with score ${calculateScore(playerHands[activeHandIndex])}`);

  // Move to the next hand if available
  if (activeHandIndex < playerHands.length - 1) {
    activeHandIndex++;
    term.writeln(`Now playing Hand ${activeHandIndex + 1}: ${formatHand(playerHands[activeHandIndex])} (${calculateScore(playerHands[activeHandIndex])})`);
  } else {
    // All player hands are finished, proceed to dealer's turn
    finishPlayerTurn(term);
  }
}

// Renamed original playerStands to finishPlayerTurn, handles dealer logic
function finishPlayerTurn(term) {
  let dealerScore = calculateScore(dealerHand);

  // Dealer draws until >= 17
  term.writeln(`Dealer reveals: ${formatCard(dealerHand[1])}`);
  while (dealerScore < 17) {
    const card = drawCard(deck);
    dealerHand.push(card);
    dealerScore = calculateScore(dealerHand);
    term.writeln(`Dealer hits and draws: ${formatCard(card)}`);
  }

  term.writeln(`Dealer final hand: ${formatHand(dealerHand)} (${dealerScore})`);

  // Determine outcome for each player hand
  for (let i = 0; i < playerHands.length; i++) {
    const hand = playerHands[i];
    const bet = bets[i];
    const playerScore = calculateScore(hand);
    term.write(`Hand ${i + 1} (${playerScore}): `);

    if (playerScore > 21) {
      term.writeln("Busted. ❌ You lose.");
      updateStats('loss', bet); // Loss already accounted for bet deduction
    } else if (dealerScore > 21 || playerScore > dealerScore) {
      term.writeln("✅ You win!");
      updateStats('win', bet);
    } else if (playerScore < dealerScore) {
      term.writeln("❌ You lose.");
      updateStats('loss', bet); // Loss already accounted for bet deduction
    } else { // playerScore === dealerScore
      term.writeln("🤝 It's a draw (push).");
      updateStats('draw', bet);
    }
  }

  gameInProgress = false;
  displayBalance(term);
  prompt(); // Prompt for next command after results
}

// Helper function to display current balance
function displayBalance(term) {
    const stats = getStats();
    term.writeln(`Current Balance: $${stats.balance}`);
}
