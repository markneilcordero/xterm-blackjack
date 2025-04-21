// storage.js

const STORAGE_KEY = 'blackjack_stats';

export const Storage = {
  defaultStats: {
    games: 0,
    wins: 0,
    losses: 0,
    draws: 0
  },

  loadStats() {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : { ...this.defaultStats };
  },

  saveStats(stats) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
  },

  increment(key) {
    const stats = this.loadStats();
    if (stats.hasOwnProperty(key)) {
      stats[key]++;
      this.saveStats(stats);
    }
  },

  resetStats() {
    this.saveStats({ ...this.defaultStats });
  },

  printStats(term) {
    const stats = this.loadStats();
    term.write('\n📊 Game Stats:');
    term.write(`\n  Games Played : ${stats.games}`);
    term.write(`\n  Wins         : ${stats.wins}`);
    term.write(`\n  Losses       : ${stats.losses}`);
    term.write(`\n  Draws        : ${stats.draws}`);
  }
};
