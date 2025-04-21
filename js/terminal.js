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
    const commandHistory = []; // Array to store command history
    let historyIndex = -1; // -1 means not browsing history
  
    // Prompt symbol
    const prompt = () => {
      term.write('\r\n$ ');
    };
  
    prompt();
  
    // Helper function to clear the current input line
    const clearInputLine = () => {
        const PADDING = 2; // Length of '$ '
        const inputLength = currentInput.length;
        // Move cursor back to the start of the input
        term.write('\x1b[D'.repeat(inputLength));
        // Clear characters to the end of the line
        term.write('\x1b[K');
        currentInput = ''; // Clear the internal buffer
    };
  
    // Handle keypress input
    term.onKey(({ key, domEvent }) => {
      const printable = !domEvent.altKey && !domEvent.ctrlKey && !domEvent.metaKey;
      const keyCode = domEvent.keyCode;
  
      if (keyCode === 13) { // Enter
        term.write('\r\n');
        const trimmedInput = currentInput.trim();
        if (trimmedInput) {
            // Add to history only if it's not the same as the last command
            if (commandHistory.length === 0 || commandHistory[0] !== trimmedInput) {
                commandHistory.unshift(trimmedInput); // Add to beginning
                // Optional: Limit history size
                // if (commandHistory.length > 20) { commandHistory.pop(); }
            }
        }
        historyIndex = -1; // Reset history browsing
        handleCommand(trimmedInput); // Pass trimmed input to handler
        currentInput = ''; // Clear buffer after handling
        // handleCommand calls prompt() itself now
      } else if (keyCode === 8) { // Backspace
        if (currentInput.length > 0) {
          currentInput = currentInput.slice(0, -1);
          term.write('\b \b'); // Move back, write space, move back again
        }
      } else if (keyCode === 38) { // Arrow Up
          domEvent.preventDefault(); // Prevent cursor movement
          if (historyIndex < commandHistory.length - 1) {
              historyIndex++;
              clearInputLine();
              currentInput = commandHistory[historyIndex];
              term.write(currentInput);
          }
      } else if (keyCode === 40) { // Arrow Down
          domEvent.preventDefault(); // Prevent cursor movement
          if (historyIndex > -1) {
              historyIndex--;
              clearInputLine();
              if (historyIndex > -1) {
                  currentInput = commandHistory[historyIndex];
                  term.write(currentInput);
              } else {
                  // Reached the bottom (or start) of history, show empty prompt
                  currentInput = '';
              }
          }
      } else if (printable) {
        // Any printable character resets history browsing
        historyIndex = -1;
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
