// Create a standard 52-card deck
function createShuffledDeck() {
    const suits = ['♠', '♥', '♦', '♣'];
    const values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
  
    let deck = [];
  
    for (let suit of suits) {
      for (let value of values) {
        deck.push({ value, suit });
      }
    }
  
    return shuffleDeck(deck);
  }
  
  // Fisher-Yates Shuffle
  function shuffleDeck(deck) {
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
  }
  
  // Draw one card from the deck
  function drawCard(deck) {
    return deck.shift(); // Removes and returns the first card
  }
  