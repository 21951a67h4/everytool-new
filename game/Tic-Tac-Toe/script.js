/**
 * Enhanced Tic-Tac-Toe Game Implementation
 * Features: Two-player mode, vs computer mode, player names, difficulty levels
 */

class TicTacToeGame {
    constructor() {
        this.board = Array(9).fill('');
        this.currentPlayer = 'X';
        this.gameActive = true;
        this.gameMode = 'two-player'; // 'two-player' or 'vs-computer'
        this.difficulty = 'medium'; // 'easy', 'medium', 'hard'
        this.playerNames = { X: 'Player X', O: 'Player O' };
        this.scores = { X: 0, O: 0 };
        this.winningCombinations = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
            [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
            [0, 4, 8], [2, 4, 6] // Diagonals
        ];
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupThemeToggle();
        this.setupBackButton();
        this.updateCopyrightYear();
        this.loadSettings();
        this.newGame();
    }

    setupEventListeners() {
        // Game mode buttons
        document.getElementById('two-player-mode').addEventListener('click', () => this.setGameMode('two-player'));
        document.getElementById('vs-computer-mode').addEventListener('click', () => this.setGameMode('vs-computer'));

        // Player name inputs
        document.getElementById('player-x-name').addEventListener('input', (e) => this.updatePlayerName('X', e.target.value));
        document.getElementById('player-o-name').addEventListener('input', (e) => this.updatePlayerName('O', e.target.value));

        // Difficulty selector
        document.getElementById('difficulty').addEventListener('change', (e) => this.setDifficulty(e.target.value));

        // Game buttons
        document.getElementById('new-game').addEventListener('click', () => this.newGame());
        document.getElementById('reset-scores').addEventListener('click', () => this.resetScores());

        // Modal controls
        document.getElementById('play-again').addEventListener('click', () => {
            this.closeModal('win-modal');
            this.newGame();
        });

        document.getElementById('close-modal').addEventListener('click', () => {
            this.closeModal('win-modal');
        });

        document.getElementById('play-again-tie').addEventListener('click', () => {
            this.closeModal('tie-modal');
            this.newGame();
        });

        document.getElementById('close-tie-modal').addEventListener('click', () => {
            this.closeModal('tie-modal');
        });
    }

    setupThemeToggle() {
        const themeToggle = document.getElementById('theme-toggle');
        const root = document.documentElement;
        
        // Load saved theme
        const savedTheme = localStorage.getItem('tic-tac-toe-theme');
        if (savedTheme === 'dark') {
            root.setAttribute('data-theme', 'dark');
            themeToggle.checked = true;
        }

        themeToggle.addEventListener('change', () => {
            if (themeToggle.checked) {
                root.setAttribute('data-theme', 'dark');
                localStorage.setItem('tic-tac-toe-theme', 'dark');
            } else {
                root.removeAttribute('data-theme');
                localStorage.setItem('tic-tac-toe-theme', 'light');
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

    loadSettings() {
        // Load saved player names
        const savedNames = localStorage.getItem('tic-tac-toe-player-names');
        if (savedNames) {
            this.playerNames = JSON.parse(savedNames);
            document.getElementById('player-x-name').value = this.playerNames.X;
            document.getElementById('player-o-name').value = this.playerNames.O;
        }

        // Load saved game mode
        const savedMode = localStorage.getItem('tic-tac-toe-game-mode');
        if (savedMode) {
            this.setGameMode(savedMode);
        }

        // Load saved difficulty
        const savedDifficulty = localStorage.getItem('tic-tac-toe-difficulty');
        if (savedDifficulty) {
            this.difficulty = savedDifficulty;
            document.getElementById('difficulty').value = savedDifficulty;
        }
    }

    saveSettings() {
        localStorage.setItem('tic-tac-toe-player-names', JSON.stringify(this.playerNames));
        localStorage.setItem('tic-tac-toe-game-mode', this.gameMode);
        localStorage.setItem('tic-tac-toe-difficulty', this.difficulty);
    }

    setGameMode(mode) {
        this.gameMode = mode;
        
        // Update UI
        document.querySelectorAll('.mode-btn').forEach(btn => btn.classList.remove('active'));
        document.getElementById(`${mode}-mode`).classList.add('active');
        
        // Show/hide difficulty selector
        const difficultySelector = document.getElementById('difficulty-selector');
        if (mode === 'vs-computer') {
            difficultySelector.style.display = 'block';
        } else {
            difficultySelector.style.display = 'none';
        }

        // Update player names for computer mode
        if (mode === 'vs-computer') {
            this.playerNames.O = 'Computer';
            document.getElementById('player-o-name').value = 'Computer';
            document.getElementById('player-o-name').disabled = true;
        } else {
            document.getElementById('player-o-name').disabled = false;
            if (this.playerNames.O === 'Computer') {
                this.playerNames.O = 'Player O';
                document.getElementById('player-o-name').value = 'Player O';
            }
        }

        this.updatePlayerLabels();
        this.saveSettings();
        this.newGame();
    }

    setDifficulty(difficulty) {
        this.difficulty = difficulty;
        this.saveSettings();
    }

    updatePlayerName(player, name) {
        this.playerNames[player] = name || `Player ${player}`;
        this.updatePlayerLabels();
        this.saveSettings();
    }

    updatePlayerLabels() {
        document.getElementById('player-x-label').textContent = this.playerNames.X;
        document.getElementById('player-o-label').textContent = this.playerNames.O;
    }

    newGame() {
        this.board = Array(9).fill('');
        this.currentPlayer = 'X';
        this.gameActive = true;
        this.render();
        this.updateGameMessage();
        this.closeAllModals();
    }

    resetScores() {
        this.scores = { X: 0, O: 0 };
        this.updateScores();
        this.newGame();
    }

    makeMove(index) {
        if (!this.gameActive || this.board[index] !== '') {
            return;
        }

        this.board[index] = this.currentPlayer;
        this.render();

        if (this.checkWinner()) {
            this.handleWin();
        } else if (this.checkTie()) {
            this.handleTie();
        } else {
            this.switchPlayer();
            this.updateGameMessage();
            
            // Computer move in vs-computer mode
            if (this.gameMode === 'vs-computer' && this.currentPlayer === 'O' && this.gameActive) {
                setTimeout(() => this.makeComputerMove(), 500);
            }
        }
    }

    makeComputerMove() {
        if (!this.gameActive) return;

        const move = this.getComputerMove();
        if (move !== -1) {
            this.board[move] = 'O';
            this.render();

            if (this.checkWinner()) {
                this.handleWin();
            } else if (this.checkTie()) {
                this.handleTie();
            } else {
                this.switchPlayer();
                this.updateGameMessage();
            }
        }
    }

    getComputerMove() {
        // Check for winning move
        let move = this.findWinningMove('O');
        if (move !== -1) return move;

        // Check for blocking move
        move = this.findWinningMove('X');
        if (move !== -1) return move;

        // Difficulty-based strategy
        switch (this.difficulty) {
            case 'easy':
                return this.getEasyMove();
            case 'medium':
                return this.getMediumMove();
            case 'hard':
                return this.getHardMove();
            default:
                return this.getMediumMove();
        }
    }

    findWinningMove(player) {
        for (let combination of this.winningCombinations) {
            const [a, b, c] = combination;
            const cells = [this.board[a], this.board[b], this.board[c]];
            
            // Count player symbols and empty cells
            const playerCount = cells.filter(cell => cell === player).length;
            const emptyCount = cells.filter(cell => cell === '').length;
            
            if (playerCount === 2 && emptyCount === 1) {
                // Find the empty cell
                for (let i = 0; i < 3; i++) {
                    if (cells[i] === '') {
                        return combination[i];
                    }
                }
            }
        }
        return -1;
    }

    getEasyMove() {
        // Random move with some intelligence
        const emptyCells = this.board.map((cell, index) => cell === '' ? index : -1).filter(index => index !== -1);
        
        // 70% chance to make a random move, 30% chance to make a smart move
        if (Math.random() < 0.7) {
            return emptyCells[Math.floor(Math.random() * emptyCells.length)];
        } else {
            return this.getMediumMove();
        }
    }

    getMediumMove() {
        // Prefer center, then corners, then edges
        const emptyCells = this.board.map((cell, index) => cell === '' ? index : -1).filter(index => index !== -1);
        
        // Try center first
        if (this.board[4] === '') return 4;
        
        // Try corners
        const corners = [0, 2, 6, 8];
        for (let corner of corners) {
            if (this.board[corner] === '') return corner;
        }
        
        // Try edges
        const edges = [1, 3, 5, 7];
        for (let edge of edges) {
            if (this.board[edge] === '') return edge;
        }
        
        return emptyCells[0];
    }

    getHardMove() {
        // Use minimax algorithm for optimal play
        return this.minimax(this.board, 'O').index;
    }

    minimax(board, player) {
        const emptyCells = board.map((cell, index) => cell === '' ? index : -1).filter(index => index !== -1);
        
        // Check for terminal states
        if (this.checkWinnerForBoard(board, 'X')) {
            return { score: -10 };
        } else if (this.checkWinnerForBoard(board, 'O')) {
            return { score: 10 };
        } else if (emptyCells.length === 0) {
            return { score: 0 };
        }

        const moves = [];
        
        for (let i = 0; i < emptyCells.length; i++) {
            const move = {};
            move.index = emptyCells[i];
            
            board[move.index] = player;
            
            if (player === 'O') {
                const result = this.minimax(board, 'X');
                move.score = result.score;
            } else {
                const result = this.minimax(board, 'O');
                move.score = result.score;
            }
            
            board[move.index] = '';
            moves.push(move);
        }

        let bestMove;
        if (player === 'O') {
            let bestScore = -10000;
            for (let i = 0; i < moves.length; i++) {
                if (moves[i].score > bestScore) {
                    bestScore = moves[i].score;
                    bestMove = i;
                }
            }
        } else {
            let bestScore = 10000;
            for (let i = 0; i < moves.length; i++) {
                if (moves[i].score < bestScore) {
                    bestScore = moves[i].score;
                    bestMove = i;
                }
            }
        }

        return moves[bestMove];
    }

    checkWinnerForBoard(board, player) {
        for (let combination of this.winningCombinations) {
            const [a, b, c] = combination;
            if (board[a] === player && board[a] === board[b] && board[a] === board[c]) {
                return true;
            }
        }
        return false;
    }

    switchPlayer() {
        this.currentPlayer = this.currentPlayer === 'X' ? 'O' : 'X';
    }

    checkWinner() {
        for (let combination of this.winningCombinations) {
            const [a, b, c] = combination;
            if (this.board[a] && this.board[a] === this.board[b] && this.board[a] === this.board[c]) {
                this.winningCombination = combination;
                return true;
            }
        }
        return false;
    }

    checkTie() {
        return this.board.every(cell => cell !== '');
    }

    handleWin() {
        this.gameActive = false;
        this.scores[this.currentPlayer]++;
        this.updateScores();
        this.highlightWinningCells();
        this.updateGameMessage(true);
        this.showWinModal();
    }

    handleTie() {
        this.gameActive = false;
        this.updateGameMessage(false, true);
        this.showTieModal();
    }

    highlightWinningCells() {
        if (this.winningCombination) {
            this.winningCombination.forEach(index => {
                const cell = document.querySelector(`[data-index="${index}"]`);
                if (cell) {
                    cell.classList.add('winning');
                }
            });
        }
        
        // Add winner animation to the board
        const gameBoard = document.getElementById('game-board');
        gameBoard.classList.add('winner');
        setTimeout(() => {
            gameBoard.classList.remove('winner');
        }, 500);
    }

    render() {
        const gameBoard = document.getElementById('game-board');
        gameBoard.innerHTML = '';

        this.board.forEach((cell, index) => {
            const cellElement = document.createElement('div');
            cellElement.className = 'cell';
            cellElement.dataset.index = index;
            
            if (cell) {
                cellElement.textContent = cell;
                cellElement.classList.add(cell.toLowerCase());
                cellElement.classList.add('occupied');
            }

            cellElement.addEventListener('click', () => {
                this.makeMove(index);
            });

            gameBoard.appendChild(cellElement);
        });
    }

    updateGameMessage(isWinner = false, isTie = false) {
        const messageElement = document.getElementById('game-message');
        
        if (isWinner) {
            messageElement.textContent = `${this.playerNames[this.currentPlayer]} wins!`;
            messageElement.className = 'game-message winner';
        } else if (isTie) {
            messageElement.textContent = "It's a tie!";
            messageElement.className = 'game-message tie';
        } else {
            messageElement.textContent = `${this.playerNames[this.currentPlayer]}'s turn`;
            messageElement.className = 'game-message';
        }
    }

    updateScores() {
        document.getElementById('score-x').textContent = this.scores.X;
        document.getElementById('score-o').textContent = this.scores.O;
        document.getElementById('current-player').textContent = this.currentPlayer;
    }

    showWinModal() {
        document.getElementById('win-message').textContent = `${this.playerNames[this.currentPlayer]} wins!`;
        document.getElementById('winner-name').textContent = this.playerNames[this.currentPlayer];
        document.getElementById('winner-score').textContent = this.scores[this.currentPlayer];
        document.getElementById('win-modal').style.display = 'flex';
    }

    showTieModal() {
        document.getElementById('tie-score-x').textContent = this.scores.X;
        document.getElementById('tie-score-o').textContent = this.scores.O;
        document.getElementById('tie-modal').style.display = 'flex';
    }

    closeModal(modalId) {
        document.getElementById(modalId).style.display = 'none';
    }

    closeAllModals() {
        document.getElementById('win-modal').style.display = 'none';
        document.getElementById('tie-modal').style.display = 'none';
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const game = new TicTacToeGame();
    console.log('⭕ Enhanced Tic-Tac-Toe Game initialized successfully!');
});