// terminal.js
let term;

export const TerminalManager = {
  init() {
    term = new Terminal({
      theme: {
        background: '#1e1e1e',
        foreground: '#ffffff'
      },
      cursorBlink: true,
      fontSize: 14,
      rows: 20,
    });

    const terminalContainer = document.getElementById('terminal-container');
    term.open(terminalContainer);
    term.write('Welcome to Blackjack Terminal! Type "help" to begin.\r\n\n> ');

    let commandBuffer = '';

    // Listen for user key input
    term.onKey(({ key, domEvent }) => {
      const printable = !domEvent.altKey && !domEvent.ctrlKey && !domEvent.metaKey;

      if (domEvent.key === 'Enter') {
        const command = commandBuffer.trim();
        term.write('\r\n');
        this.handleCommand(command);
        commandBuffer = '';
        term.write('\n> ');
      } else if (domEvent.key === 'Backspace') {
        if (commandBuffer.length > 0) {
          commandBuffer = commandBuffer.slice(0, -1);
          term.write('\b \b');
        }
      } else if (printable) {
        commandBuffer += key;
        term.write(key);
      }
    });
  },

  handleCommand(command) {
    if (!command) return;

    const args = command.split(' ');
    const cmd = args[0].toLowerCase();

    switch (cmd) {
      case 'help':
        this.printHelp();
        break;
      case 'clear':
        term.clear();
        break;
      case 'start':
        term.writeln('Game started! Type "bet <amount>" to place a bet.');
        // Call game start logic here
        break;
      case 'bet':
        if (args[1]) {
          const amount = parseInt(args[1]);
          if (!isNaN(amount)) {
            term.writeln(`You bet $${amount}. Type "hit" or "stand".`);
            // Call bet logic here
          } else {
            term.writeln('Invalid bet amount.');
          }
        } else {
          term.writeln('Usage: bet <amount>');
        }
        break;
      case 'hit':
        term.writeln('You chose to hit.');
        // Call hit logic here
        break;
      case 'stand':
        term.writeln('You chose to stand.');
        // Call stand logic here
        break;
      case 'exit':
        term.writeln('Exiting game. See you again!');
        break;
      default:
        term.writeln(`Unknown command: "${cmd}". Type "help" for a list of commands.`);
    }
  },

  printHelp() {
    term.writeln('\r\nAvailable Commands:');
    term.writeln('  start               - Start a new game');
    term.writeln('  bet <amount>        - Place your bet');
    term.writeln('  hit                 - Draw another card');
    term.writeln('  stand               - Hold your total');
    term.writeln('  clear               - Clear the terminal screen');
    term.writeln('  exit                - Exit the game');
    term.writeln('  help                - Show this help menu');
  },

  write(message) {
    term.writeln(message);
  }
};
