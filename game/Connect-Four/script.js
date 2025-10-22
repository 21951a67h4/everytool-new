/**
 * Connect Four Game Implementation
 * Features: Turn indicator, game reset button, visual marker for winner
 */

class ConnectFourGame {
    constructor() {
        this.gameMode = 'two-player'; // 'two-player' or 'vs-computer'
        this.difficulty = 'medium'; // 'easy', 'medium', 'hard', 'expert'
        this.computerDifficulty = 'medium'; // 'easy', 'medium', 'hard'
        
        // Board size configurations
        this.boardConfigs = {
            easy: { rows: 6, cols: 7 },
            medium: { rows: 6, cols: 7 },
            hard: { rows: 8, cols: 9 },
            expert: { rows: 10, cols: 11 }
        };
        
        this.rows = this.boardConfigs[this.difficulty].rows;
        this.cols = this.boardConfigs[this.difficulty].cols;
        this.board = [];
        this.currentPlayer = 1;
        this.gameOver = false;
        this.winner = null;
        this.winningCells = [];
        this.player1Score = 0;
        this.player2Score = 0;
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupThemeToggle();
        this.setupBackButton();
        this.updateCopyrightYear();
        this.loadScores();
        this.createBoard();
        this.updateDisplay();
    }

    setupEventListeners() {
        // Game controls
        document.getElementById('reset-btn').addEventListener('click', () => this.resetGame());
        document.getElementById('new-game-btn').addEventListener('click', () => this.newGame());
        document.getElementById('restart-btn').addEventListener('click', () => this.newGame());

        // Game mode selector
        document.getElementById('two-player-mode').addEventListener('click', () => this.switchGameMode('two-player'));
        document.getElementById('vs-computer-mode').addEventListener('click', () => this.switchGameMode('vs-computer'));

        // Game difficulty selector (board size)
        document.getElementById('difficulty').addEventListener('change', (e) => {
            this.difficulty = e.target.value;
            this.updateBoardSize();
            this.resetGame();
        });

        // Computer difficulty selector (AI level)
        document.getElementById('computer-difficulty').addEventListener('change', (e) => {
            this.computerDifficulty = e.target.value;
        });
    }

    setupThemeToggle() {
        const themeToggle = document.getElementById('theme-toggle');
        const root = document.documentElement;
        
        // Load saved theme
        const savedTheme = localStorage.getItem('connect-four-theme');
        if (savedTheme === 'dark') {
            root.setAttribute('data-theme', 'dark');
            themeToggle.checked = true;
        }

        themeToggle.addEventListener('change', () => {
            if (themeToggle.checked) {
                root.setAttribute('data-theme', 'dark');
                localStorage.setItem('connect-four-theme', 'dark');
            } else {
                root.removeAttribute('data-theme');
                localStorage.setItem('connect-four-theme', 'light');
            }
        });
    }

    setupBackButton() {
        const backBtn = document.getElementById('back-btn');
        backBtn?.addEventListener('click', () => {
            if (document.referrer && document.referrer.indexOf(location.host) !== -1) {
                history.back();
            } else {
                window.location.href = '../index.html';
            }
        });
    }

    updateCopyrightYear() {
        const yearElement = document.getElementById('copyright-year');
        if (yearElement) {
            yearElement.textContent = new Date().getFullYear() + ' ';
        }
    }

    loadScores() {
        const savedPlayer1Score = localStorage.getItem('connect-four-player1-score');
        const savedPlayer2Score = localStorage.getItem('connect-four-player2-score');
        
        if (savedPlayer1Score) {
            this.player1Score = parseInt(savedPlayer1Score);
        }
        if (savedPlayer2Score) {
            this.player2Score = parseInt(savedPlayer2Score);
        }
    }

    saveScores() {
        localStorage.setItem('connect-four-player1-score', this.player1Score.toString());
        localStorage.setItem('connect-four-player2-score', this.player2Score.toString());
    }

    createBoard() {
        this.gameBoard = document.getElementById('game-board');
        this.gameBoard.innerHTML = '';

        // Initialize board array
        this.board = Array(this.rows).fill().map(() => Array(this.cols).fill(0));

        // Set dynamic grid sizing
        this.gameBoard.style.gridTemplateColumns = `repeat(${this.cols}, 1fr)`;
        this.gameBoard.style.gridTemplateRows = `repeat(${this.rows}, 1fr)`;
        
        // Set dynamic width and height based on board size
        const cellSize = Math.min(50, Math.floor(400 / Math.max(this.rows, this.cols)));
        const boardWidth = this.cols * cellSize + (this.cols - 1) * 4 + 24; // 4px gap + 12px padding each side
        const boardHeight = this.rows * cellSize + (this.rows - 1) * 4 + 24;
        
        this.gameBoard.style.width = `${boardWidth}px`;
        this.gameBoard.style.height = `${boardHeight}px`;

        // Create cells
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.row = row;
                cell.dataset.col = col;
                cell.addEventListener('click', () => this.handleCellClick(col));
                this.gameBoard.appendChild(cell);
            }
        }
    }

    handleCellClick(col) {
        if (this.gameOver) return;

        const row = this.getLowestEmptyRow(col);
        if (row === -1) return; // Column is full

        // Make the move
        this.board[row][col] = this.currentPlayer;
        this.updateDisplay();

        // Check for win
        if (this.checkWin(row, col)) {
            this.gameOver = true;
            this.winner = this.currentPlayer;
            this.highlightWinningCells();
            this.updateScores();
            this.showGameOver();
            return;
        }

        // Check for tie
        if (this.isBoardFull()) {
            this.gameOver = true;
            this.winner = 0; // Tie
            this.showGameOver();
            return;
        }

        // Switch player
        this.currentPlayer = this.currentPlayer === 1 ? 2 : 1;
        this.updateDisplay();

        // If vs computer mode and it's computer's turn, make computer move
        if (this.gameMode === 'vs-computer' && this.currentPlayer === 2 && !this.gameOver) {
            setTimeout(() => this.makeComputerMove(), 500); // Small delay for better UX
        }
    }

    getLowestEmptyRow(col) {
        for (let row = this.rows - 1; row >= 0; row--) {
            if (this.board[row][col] === 0) {
                return row;
            }
        }
        return -1; // Column is full
    }

    checkWin(row, col) {
        const player = this.board[row][col];
        
        // Check all four directions
        const directions = [
            [0, 1],   // horizontal
            [1, 0],   // vertical
            [1, 1],   // diagonal \
            [1, -1]   // diagonal /
        ];

        for (const [dr, dc] of directions) {
            const line = this.getLine(row, col, dr, dc, player);
            if (line.length >= 4) {
                this.winningCells = line.slice(0, 4);
                return true;
            }
        }

        return false;
    }

    getLine(row, col, dr, dc, player) {
        const line = [{ row, col }];
        
        // Check in positive direction
        let r = row + dr;
        let c = col + dc;
        while (r >= 0 && r < this.rows && c >= 0 && c < this.cols && this.board[r][c] === player) {
            line.push({ row: r, col: c });
            r += dr;
            c += dc;
        }

        // Check in negative direction
        r = row - dr;
        c = col - dc;
        while (r >= 0 && r < this.rows && c >= 0 && c < this.cols && this.board[r][c] === player) {
            line.unshift({ row: r, col: c });
            r -= dr;
            c -= dc;
        }

        return line;
    }

    isBoardFull() {
        return this.board[0].every(cell => cell !== 0);
    }

    highlightWinningCells() {
        this.winningCells.forEach(({ row, col }) => {
            const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
            if (cell) {
                cell.classList.add('winning');
            }
        });
    }

    updateScores() {
        if (this.winner === 1) {
            this.player1Score++;
        } else if (this.winner === 2) {
            this.player2Score++;
        }
        this.saveScores();
    }

    switchGameMode(mode) {
        this.gameMode = mode;
        
        // Update UI
        document.querySelectorAll('.mode-btn').forEach(btn => btn.classList.remove('active'));
        document.getElementById(`${mode}-mode`).classList.add('active');
        
        // Show/hide difficulty selectors
        const difficultySelector = document.getElementById('difficulty-selector');
        const computerDifficultySelector = document.getElementById('computer-difficulty-selector');
        
        if (mode === 'vs-computer') {
            computerDifficultySelector.style.display = 'block';
        } else {
            computerDifficultySelector.style.display = 'none';
        }
        
        // Reset game when switching modes
        this.resetGame();
    }

    updateBoardSize() {
        const config = this.boardConfigs[this.difficulty];
        this.rows = config.rows;
        this.cols = config.cols;
        this.createBoard();
    }

    makeComputerMove() {
        if (this.gameOver) return;

        let col;
        switch (this.computerDifficulty) {
            case 'easy':
                col = this.getEasyMove();
                break;
            case 'medium':
                col = this.getMediumMove();
                break;
            case 'hard':
                col = this.getHardMove();
                break;
            default:
                col = this.getMediumMove();
        }

        if (col !== -1) {
            this.handleCellClick(col);
        }
    }

    getEasyMove() {
        // Easy: Random move
        const availableCols = [];
        for (let col = 0; col < this.cols; col++) {
            if (this.getLowestEmptyRow(col) !== -1) {
                availableCols.push(col);
            }
        }
        return availableCols.length > 0 ? availableCols[Math.floor(Math.random() * availableCols.length)] : -1;
    }

    getMediumMove() {
        // Medium: Block opponent wins, try to win, otherwise random
        const availableCols = [];
        for (let col = 0; col < this.cols; col++) {
            if (this.getLowestEmptyRow(col) !== -1) {
                availableCols.push(col);
            }
        }

        if (availableCols.length === 0) return -1;

        // Try to win
        for (const col of availableCols) {
            const row = this.getLowestEmptyRow(col);
            this.board[row][col] = 2; // Computer is player 2
            if (this.checkWin(row, col)) {
                this.board[row][col] = 0; // Undo move
                return col;
            }
            this.board[row][col] = 0; // Undo move
        }

        // Try to block opponent
        for (const col of availableCols) {
            const row = this.getLowestEmptyRow(col);
            this.board[row][col] = 1; // Opponent is player 1
            if (this.checkWin(row, col)) {
                this.board[row][col] = 0; // Undo move
                return col;
            }
            this.board[row][col] = 0; // Undo move
        }

        // Random move
        return availableCols[Math.floor(Math.random() * availableCols.length)];
    }

    getHardMove() {
        // Hard: Use minimax algorithm
        const availableCols = [];
        for (let col = 0; col < this.cols; col++) {
            if (this.getLowestEmptyRow(col) !== -1) {
                availableCols.push(col);
            }
        }

        if (availableCols.length === 0) return -1;

        let bestScore = -Infinity;
        let bestCol = availableCols[0];

        for (const col of availableCols) {
            const row = this.getLowestEmptyRow(col);
            this.board[row][col] = 2; // Computer is player 2
            const score = this.minimax(0, false, -Infinity, Infinity);
            this.board[row][col] = 0; // Undo move

            if (score > bestScore) {
                bestScore = score;
                bestCol = col;
            }
        }

        return bestCol;
    }

    minimax(depth, isMaximizing, alpha, beta) {
        // Check for terminal states
        if (this.isBoardFull()) return 0; // Tie
        
        // Check if computer wins
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                if (this.board[row][col] === 2 && this.checkWin(row, col)) {
                    return 100 - depth;
                }
            }
        }
        
        // Check if player wins
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                if (this.board[row][col] === 1 && this.checkWin(row, col)) {
                    return -100 + depth;
                }
            }
        }

        if (depth >= 4) return 0; // Limit depth for performance

        if (isMaximizing) {
            let maxEval = -Infinity;
            for (let col = 0; col < this.cols; col++) {
                const row = this.getLowestEmptyRow(col);
                if (row !== -1) {
                    this.board[row][col] = 2;
                    const evaluation = this.minimax(depth + 1, false, alpha, beta);
                    this.board[row][col] = 0;
                    maxEval = Math.max(maxEval, evaluation);
                    alpha = Math.max(alpha, evaluation);
                    if (beta <= alpha) break;
                }
            }
            return maxEval;
        } else {
            let minEval = Infinity;
            for (let col = 0; col < this.cols; col++) {
                const row = this.getLowestEmptyRow(col);
                if (row !== -1) {
                    this.board[row][col] = 1;
                    const evaluation = this.minimax(depth + 1, true, alpha, beta);
                    this.board[row][col] = 0;
                    minEval = Math.min(minEval, evaluation);
                    beta = Math.min(beta, evaluation);
                    if (beta <= alpha) break;
                }
            }
            return minEval;
        }
    }

    updateDisplay() {
        // Update board
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
                if (cell) {
                    cell.className = 'cell';
                    if (this.board[row][col] === 1) {
                        cell.classList.add('player1');
                    } else if (this.board[row][col] === 2) {
                        cell.classList.add('player2');
                    }
                }
            }
        }

        // Update stats
        document.getElementById('player1-score').textContent = this.player1Score;
        document.getElementById('player2-score').textContent = this.player2Score;
        
        const currentPlayerElement = document.getElementById('current-player');
        if (this.currentPlayer === 1) {
            currentPlayerElement.textContent = 'Player 1';
            currentPlayerElement.className = 'stat-value player1-turn';
        } else {
            if (this.gameMode === 'vs-computer') {
                currentPlayerElement.textContent = 'Computer';
            } else {
                currentPlayerElement.textContent = 'Player 2';
            }
            currentPlayerElement.className = 'stat-value player2-turn';
        }

        // Update game message
        this.updateGameMessage();
    }

    updateGameMessage() {
        const messageElement = document.getElementById('game-message');
        
        if (this.gameOver) {
            if (this.winner === 0) {
                messageElement.textContent = "It's a tie!";
                messageElement.className = 'game-message tie';
            } else {
                if (this.gameMode === 'vs-computer') {
                    if (this.winner === 1) {
                        messageElement.textContent = "You win!";
                        messageElement.className = 'game-message player1-turn';
                    } else {
                        messageElement.textContent = "Computer wins!";
                        messageElement.className = 'game-message player2-turn';
                    }
                } else {
                    messageElement.textContent = `Player ${this.winner} wins!`;
                    messageElement.className = `game-message player${this.winner}-turn`;
                }
            }
        } else {
            if (this.gameMode === 'vs-computer') {
                if (this.currentPlayer === 1) {
                    messageElement.textContent = "Your turn - Click a column!";
                    messageElement.className = 'game-message player1-turn';
                } else {
                    messageElement.textContent = "Computer is thinking...";
                    messageElement.className = 'game-message player2-turn';
                }
            } else {
                messageElement.textContent = `Player ${this.currentPlayer}'s turn - Click a column!`;
                messageElement.className = `game-message player${this.currentPlayer}-turn`;
            }
        }
    }

    showGameOver() {
        const gameOverElement = document.getElementById('game-over');
        const winnerMessageElement = document.getElementById('winner-message');
        const winnerDetailsElement = document.getElementById('winner-details');

        if (this.winner === 0) {
            winnerMessageElement.textContent = "It's a Tie!";
            winnerDetailsElement.textContent = "The board is full!";
        } else {
            if (this.gameMode === 'vs-computer') {
                if (this.winner === 1) {
                    winnerMessageElement.textContent = "You Win!";
                    winnerDetailsElement.textContent = "Congratulations! You beat the computer!";
                } else {
                    winnerMessageElement.textContent = "Computer Wins!";
                    winnerDetailsElement.textContent = "The computer outsmarted you this time!";
                }
            } else {
                winnerMessageElement.textContent = `Player ${this.winner} Wins!`;
                winnerDetailsElement.textContent = `Congratulations Player ${this.winner}!`;
            }
        }

        gameOverElement.classList.remove('hidden');
    }

    resetGame() {
        this.gameOver = false;
        this.winner = null;
        this.winningCells = [];
        this.currentPlayer = 1;
        
        // Clear board
        this.board = Array(this.rows).fill().map(() => Array(this.cols).fill(0));
        
        this.updateDisplay();
        
        // Hide game over overlay
        document.getElementById('game-over').classList.add('hidden');
    }

    newGame() {
        this.resetGame();
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const game = new ConnectFourGame();
    console.log('🔴🟡 Connect Four Game initialized successfully!');
});
