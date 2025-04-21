// ANSI Color Codes
const ANSI_RESET = "\x1b[0m";
const ANSI_BRIGHT = "\x1b[1m";
const ANSI_RED = "\x1b[31m";
const ANSI_GREEN = "\x1b[32m";
const ANSI_YELLOW = "\x1b[33m";
const ANSI_CYAN = "\x1b[36m";
const ANSI_WHITE = "\x1b[37m";

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
      term.writeln(`${ANSI_CYAN}Available Commands:${ANSI_RESET}`);
      term.writeln(` - ${ANSI_BRIGHT}deal <amount>${ANSI_RESET} : Start a new round with a bet`);
      term.writeln(` - ${ANSI_BRIGHT}hit${ANSI_RESET}           : Draw a card for the current hand`);
      term.writeln(` - ${ANSI_BRIGHT}stand${ANSI_RESET}         : End your turn for the current hand`);
      term.writeln(` - ${ANSI_BRIGHT}split${ANSI_RESET}         : Split your hand if dealt a pair (requires additional bet)`);
      term.writeln(` - ${ANSI_BRIGHT}stats${ANSI_RESET}         : View game stats and balance`);
      term.writeln(` - ${ANSI_BRIGHT}restart${ANSI_RESET}       : Reset stats and balance`);
      term.writeln(` - ${ANSI_BRIGHT}help${ANSI_RESET}          : Show this message`);
      break;

    case 'deal':
      if (gameInProgress) {
        term.writeln(`${ANSI_YELLOW}Game already in progress. Finish the current hand first.${ANSI_RESET}`);
        break;
      }
      const betAmount = parseInt(args[1]);
      if (isNaN(betAmount) || betAmount <= 0) {
        term.writeln(`${ANSI_RED}Invalid bet amount. Usage: deal <amount>${ANSI_RESET}`);
        break;
      }
      if (betAmount > currentStats.balance) {
        term.writeln(`${ANSI_RED}Insufficient balance. Your balance is $${currentStats.balance}.${ANSI_RESET}`);
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
      term.writeln(`${ANSI_BRIGHT}Balance: $${currentStats.balance}${ANSI_RESET}`);
      term.writeln(`Games: ${currentStats.total}, Wins: ${ANSI_GREEN}${currentStats.wins}${ANSI_RESET}, Losses: ${ANSI_RED}${currentStats.losses}${ANSI_RESET}, Draws: ${ANSI_YELLOW}${currentStats.draws}${ANSI_RESET}`);
      break;

    case 'restart':
      resetStats();
      term.writeln(`${ANSI_YELLOW}Stats have been reset.${ANSI_RESET}`);
      // Reset split state variables as well
      playerHands = [];
      bets = [];
      activeHandIndex = 0;
      canSplit = false;
      gameInProgress = false;
      currentBet = 0;
      break;

    default:
      term.writeln(`${ANSI_RED}Unknown command: ${command}${ANSI_RESET}`);
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
  term.clear(); // Clear the terminal screen
  term.writeln(`${ANSI_BRIGHT}--- New Hand ---${ANSI_RESET}`);

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

  term.writeln(`Dealing hand... Bet: ${ANSI_YELLOW}$${betAmount}${ANSI_RESET}`);
  term.writeln(`Your hand: ${ANSI_BRIGHT}${formatHand(playerHands[0])}${ANSI_RESET} (${calculateScore(playerHands[0])})`);
  term.writeln(`Dealer shows: ${ANSI_BRIGHT}${formatCard(dealerHand[0])}${ANSI_RESET}`);

  // Check for immediate Blackjack for player and dealer
  const playerScore = calculateScore(playerHands[0]);
  const dealerScore = calculateScore(dealerHand);

  if (playerScore === 21 && dealerScore === 21) {
    term.writeln(`${ANSI_YELLOW}Push! Both player and dealer have Blackjack.${ANSI_RESET}`);
    updateStats('draw', bets[0]);
    gameInProgress = false;
    displayBalance(term);
    prompt(); // Need prompt here as game ends immediately
    return;
  } else if (playerScore === 21) {
    term.writeln(`${ANSI_GREEN}${ANSI_BRIGHT}💰 Blackjack! You win!${ANSI_RESET}`);
    updateStats('blackjack', bets[0]);
    gameInProgress = false;
    displayBalance(term);
    prompt(); // Need prompt here as game ends immediately
    return;
  } else if (dealerScore === 21) {
    term.writeln(`Dealer hand: ${formatHand(dealerHand)} (${dealerScore})`);
    term.writeln(`${ANSI_RED}Dealer has Blackjack. You lose.${ANSI_RESET}`);
    updateStats('loss', bets[0]); // Loss already accounted for bet deduction
    gameInProgress = false;
    displayBalance(term);
    prompt(); // Need prompt here as game ends immediately
    return;
  }

  // Check if the player can split
  if (playerHands[0].length === 2 && getCardRank(playerHands[0][0]) === getCardRank(playerHands[0][1])) {
      if (stats.balance >= betAmount) { // Check if they *can* afford to split
        term.writeln(`${ANSI_CYAN}You have a pair! Type 'split' to split your hand.${ANSI_RESET}`);
        canSplit = true;
      } else {
        term.writeln(`${ANSI_YELLOW}You have a pair, but not enough balance to split.${ANSI_RESET}`);
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

    term.writeln(`Splitting hand. Bet ${ANSI_YELLOW}$${currentBet}${ANSI_RESET} on each hand.`);
    term.writeln(`Hand 1: ${ANSI_BRIGHT}${formatHand(playerHands[0])}${ANSI_RESET} (${calculateScore(playerHands[0])})`);
    term.writeln(`Hand 2: ${ANSI_BRIGHT}${formatHand(playerHands[1])}${ANSI_RESET} (${calculateScore(playerHands[1])})`);

    // Check for Blackjack on split hands (counts as 21, not Blackjack payout)
    // Handle Ace + 10/J/Q/K immediately (player stands automatically on these)
    let hand1Score = calculateScore(playerHands[0]);
    let hand2Score = calculateScore(playerHands[1]);

    if (hand1Score === 21) {
        term.writeln(`${ANSI_GREEN}Hand 1 has 21!${ANSI_RESET}`);
        // Move to next hand if hand 1 got 21
        activeHandIndex++;
        if (hand2Score === 21) {
             term.writeln(`${ANSI_GREEN}Hand 2 has 21!${ANSI_RESET}`);
             // Both hands are 21, proceed to dealer
             finishPlayerTurn(term);
             return;
        }
        term.writeln(`Now playing Hand 2: ${ANSI_BRIGHT}${formatHand(playerHands[activeHandIndex])}${ANSI_RESET} (${calculateScore(playerHands[activeHandIndex])})`);

    } else {
         term.writeln(`Now playing Hand 1: ${ANSI_BRIGHT}${formatHand(playerHands[activeHandIndex])}${ANSI_RESET} (${calculateScore(playerHands[activeHandIndex])})`);
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
  term.writeln(`Hand ${activeHandIndex + 1}: ${ANSI_BRIGHT}${formatHand(currentHand)}${ANSI_RESET} (${playerScore})`);

  if (playerScore > 21) {
    term.writeln(`${ANSI_RED}${ANSI_BRIGHT}💥 Hand ${activeHandIndex + 1} busted!${ANSI_RESET}`);
    // Move to the next hand if available, otherwise finish turn
    if (activeHandIndex < playerHands.length - 1) {
      activeHandIndex++;
      term.writeln(`Now playing Hand ${activeHandIndex + 1}: ${ANSI_BRIGHT}${formatHand(playerHands[activeHandIndex])}${ANSI_RESET} (${calculateScore(playerHands[activeHandIndex])})`);
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
    term.writeln(`Now playing Hand ${activeHandIndex + 1}: ${ANSI_BRIGHT}${formatHand(playerHands[activeHandIndex])}${ANSI_RESET} (${calculateScore(playerHands[activeHandIndex])})`);
  } else {
    // All player hands are finished, proceed to dealer's turn
    finishPlayerTurn(term);
  }
}

// Renamed original playerStands to finishPlayerTurn, handles dealer logic
function finishPlayerTurn(term) {
  term.writeln(`${ANSI_BRIGHT}------------------------------${ANSI_RESET}`); // Separator
  term.writeln(`${ANSI_CYAN}Dealer's turn...${ANSI_RESET}`);
  let dealerScore = calculateScore(dealerHand);

  // Reveal dealer's hidden card first
  term.writeln(`Dealer reveals: ${ANSI_BRIGHT}${formatCard(dealerHand[1])}${ANSI_RESET}`);
  term.writeln(`Dealer initial hand: ${ANSI_BRIGHT}${formatHand(dealerHand)}${ANSI_RESET} (${dealerScore})`);

  // Dealer draws until >= 17
  while (dealerScore < 17) {
    term.writeln(`Dealer hits...`);
    const card = drawCard(deck);
    dealerHand.push(card);
    dealerScore = calculateScore(dealerHand);
    term.writeln(`Dealer draws: ${formatCard(card)}`);
    term.writeln(`Dealer hand: ${ANSI_BRIGHT}${formatHand(dealerHand)}${ANSI_RESET} (${dealerScore})`);
  }

  if (dealerScore > 21) {
      term.writeln(`${ANSI_GREEN}Dealer busts!${ANSI_RESET}`);
  } else {
      term.writeln(`Dealer stands with ${dealerScore}.`);
  }
  term.writeln(`${ANSI_BRIGHT}------------------------------${ANSI_RESET}`); // Separator
  term.writeln(`${ANSI_BRIGHT}Results:${ANSI_RESET}`);

  // Determine outcome for each player hand
  for (let i = 0; i < playerHands.length; i++) {
    const hand = playerHands[i];
    const bet = bets[i];
    const playerScore = calculateScore(hand);
    term.write(`Hand ${i + 1} (${playerScore}) vs Dealer (${dealerScore}): `);

    if (playerScore > 21) {
      term.writeln(`${ANSI_RED}${ANSI_BRIGHT}Busted. You lose.${ANSI_RESET}`);
      updateStats('loss', bet); // Loss already accounted for bet deduction
    } else if (dealerScore > 21 || playerScore > dealerScore) {
      term.writeln(`${ANSI_GREEN}${ANSI_BRIGHT}You win!${ANSI_RESET}`);
      updateStats('win', bet);
    } else if (playerScore < dealerScore) {
      term.writeln(`${ANSI_RED}You lose.${ANSI_RESET}`);
      updateStats('loss', bet); // Loss already accounted for bet deduction
    } else { // playerScore === dealerScore
      term.writeln(`${ANSI_YELLOW}It's a draw (push).${ANSI_RESET}`);
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
    term.writeln(`${ANSI_BRIGHT}Current Balance: $${stats.balance}${ANSI_RESET}`);
}
