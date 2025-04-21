// Game State
let deck = [];
let playerHand = [];
let dealerHand = [];
let gameInProgress = false;

// Handle input command from terminal
function handleGameCommand(command, term, prompt) {
  const args = command.toLowerCase().split(' ');

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
      startNewGame(term);
      break;

    case 'hit':
      if (!gameInProgress) {
        term.writeln("Start a game with 'deal' first.");
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
      const stats = getStats();
      term.writeln(`Games: ${stats.total}, Wins: ${stats.wins}, Losses: ${stats.losses}, Draws: ${stats.draws}`);
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
function startNewGame(term) {
  deck = createShuffledDeck();
  playerHand = [drawCard(deck), drawCard(deck)];
  dealerHand = [drawCard(deck), drawCard(deck)];

  gameInProgress = true;

  term.writeln(`Your hand: ${formatHand(playerHand)} (${calculateScore(playerHand)})`);
  term.writeln(`Dealer shows: ${formatCard(dealerHand[0])}`);
}

function playerHits(term) {
  playerHand.push(drawCard(deck));
  const playerScore = calculateScore(playerHand);
  term.writeln(`You drew: ${formatCard(playerHand[playerHand.length - 1])}`);
  term.writeln(`Your hand: ${formatHand(playerHand)} (${playerScore})`);

  if (playerScore > 21) {
    term.writeln("💥 You busted! Dealer wins.");
    gameInProgress = false;
    updateStats('loss');
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
    updateStats('win');
  } else if (playerScore < dealerScore) {
    term.writeln("❌ You lose.");
    updateStats('loss');
  } else {
    term.writeln("🤝 It's a draw.");
    updateStats('draw');
  }

  gameInProgress = false;
}
