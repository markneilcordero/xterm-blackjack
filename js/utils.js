// Calculate hand score (Aces count as 11 or 1)
function calculateScore(hand) {
    let total = 0;
    let aces = 0;
  
    hand.forEach(card => {
      const value = card.value;
      if (value === 'A') {
        total += 11;
        aces++;
      } else if (['K', 'Q', 'J'].includes(value)) {
        total += 10;
      } else {
        total += parseInt(value);
      }
    });
  
    // Reduce Ace value from 11 to 1 if needed
    while (total > 21 && aces > 0) {
      total -= 10;
      aces--;
    }
  
    return total;
  }
  
  // Format a single card for display (e.g., A♠)
  function formatCard(card) {
    return `${card.value}${card.suit}`;
  }
  
  // Format an entire hand as text
  function formatHand(hand) {
    return hand.map(formatCard).join(', ');
  }
  