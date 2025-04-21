// LocalStorage key
const STATS_KEY = 'blackjack_stats';
const STARTING_BALANCE = 100; // Define a starting balance

// Get current stats (or default if none)
function getStats() {
  const data = localStorage.getItem(STATS_KEY);
  if (data) {
    const stats = JSON.parse(data);
    // Ensure balance exists for older saved stats
    if (stats.balance === undefined) {
        stats.balance = STARTING_BALANCE;
    }
    return stats;
  }
  // Default stats including balance
  return {
    wins: 0,
    losses: 0,
    draws: 0,
    total: 0,
    balance: STARTING_BALANCE
  };
}

// Save stats to LocalStorage
function saveStats(stats) {
  localStorage.setItem(STATS_KEY, JSON.stringify(stats));
}

// Update stats based on result and bet amount
function updateStats(result, betAmount) {
  const stats = getStats();
  stats.total++;

  if (result === 'win') {
    stats.wins++;
    stats.balance += betAmount * 2; // Win pays double the bet
  } else if (result === 'loss') {
    stats.losses++;
    // Balance already reduced when bet was placed
  } else if (result === 'draw') {
    stats.draws++;
    stats.balance += betAmount; // Return the bet on a draw
  } else if (result === 'blackjack') {
    stats.wins++;
    // Blackjack typically pays 3:2, so win 1.5 times the bet + original bet back
    stats.balance += betAmount + (betAmount * 1.5);
  }

  saveStats(stats);
}

// Function to directly update balance (e.g., when placing a bet)
function updateBalance(newBalance) {
    const stats = getStats();
    stats.balance = newBalance;
    saveStats(stats);
}

// Reset all stats, including balance
function resetStats() {
  localStorage.removeItem(STATS_KEY);
  // Optionally, re-initialize with default stats after reset
  saveStats({
    wins: 0,
    losses: 0,
    draws: 0,
    total: 0,
    balance: STARTING_BALANCE
  });
}
