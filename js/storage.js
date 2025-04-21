// LocalStorage key
const STATS_KEY = 'blackjack_stats';

// Get current stats (or default if none)
function getStats() {
  const data = localStorage.getItem(STATS_KEY);
  if (data) {
    return JSON.parse(data);
  }
  return {
    wins: 0,
    losses: 0,
    draws: 0,
    total: 0
  };
}

// Save stats to LocalStorage
function saveStats(stats) {
  localStorage.setItem(STATS_KEY, JSON.stringify(stats));
}

// Update stats based on result: 'win' | 'loss' | 'draw'
function updateStats(result) {
  const stats = getStats();
  stats.total++;

  if (result === 'win') stats.wins++;
  else if (result === 'loss') stats.losses++;
  else if (result === 'draw') stats.draws++;

  saveStats(stats);
}

// Reset all stats
function resetStats() {
  localStorage.removeItem(STATS_KEY);
}
