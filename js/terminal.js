// Ensure this runs after the DOM is ready
$(document).ready(() => {
    // Initialize the terminal
    const term = new Terminal({
      cursorBlink: true,
      theme: {
        background: '#000000',
        foreground: '#00ff00',
      }
    });
  
    term.open(document.getElementById('terminal-container'));
    term.focus();
  
    // Welcome message
    term.writeln("🃏 Welcome to Blackjack Terminal!");
    term.writeln("Type 'help' to see available commands.\r\n");
  
    let currentInput = '';
  
    // Prompt symbol
    const prompt = () => {
      term.write('\r\n$ ');
    };
  
    prompt();
  
    // Handle keypress input
    term.onKey(({ key, domEvent }) => {
      const printable = !domEvent.altKey && !domEvent.ctrlKey && !domEvent.metaKey;
  
      if (domEvent.key === 'Enter') {
        term.write('\r\n');
        handleCommand(currentInput.trim());
        currentInput = '';
      } else if (domEvent.key === 'Backspace') {
        if (currentInput.length > 0) {
          currentInput = currentInput.slice(0, -1);
          term.write('\b \b');
        }
      } else if (printable) {
        currentInput += key;
        term.write(key);
      }
    });
  
    // Command parser (delegates to game logic)
    function handleCommand(input) {
      if (!input) {
        prompt();
        return;
      }
  
      // Send command to game.js
      if (typeof handleGameCommand === 'function') {
        handleGameCommand(input, term, prompt);
      } else {
        term.writeln("Game logic not loaded.");
        prompt();
      }
    }
  });
  