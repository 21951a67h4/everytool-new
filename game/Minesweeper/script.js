/**
 * Minesweeper Game Implementation
 * Features: Grid size options, timer, mines counter, flag markers, restart and reveal all
 */

class MinesweeperGame {
    constructor() {
        this.board = [];
        this.mines = [];
        this.revealed = [];
        this.flagged = [];
        this.gameStarted = false;
        this.gameOver = false;
        this.gameWon = false;
        this.timer = 0;
        this.timerInterval = null;
        this.difficulty = 'medium';
        this.difficultySettings = {
            easy: { rows: 9, cols: 9, mines: 10 },
            medium: { rows: 16, cols: 16, mines: 40 },
            hard: { rows: 16, cols: 30, mines: 99 }
        };
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupThemeToggle();
        this.setupBackButton();
        this.updateCopyrightYear();
        this.newGame();
    }

    setupEventListeners() {
        // Difficulty selector
        document.getElementById('difficulty').addEventListener('change', (e) => {
            this.difficulty = e.target.value;
            this.newGame();
        });

        // Game buttons
        document.getElementById('new-game').addEventListener('click', () => this.newGame());
        document.getElementById('restart-btn').addEventListener('click', () => this.restart());
        document.getElementById('reveal-all').addEventListener('click', () => this.revealAll());

        // Modal controls
        document.getElementById('play-again').addEventListener('click', () => {
            this.closeModal('game-over-modal');
            this.newGame();
        });

        document.getElementById('close-modal').addEventListener('click', () => {
            this.closeModal('game-over-modal');
        });

        document.getElementById('new-game-win').addEventListener('click', () => {
            this.closeModal('win-modal');
            this.newGame();
        });

        document.getElementById('close-win-modal').addEventListener('click', () => {
            this.closeModal('win-modal');
        });

        // Context menu prevention
        document.addEventListener('contextmenu', (e) => {
            if (e.target.classList.contains('cell')) {
                e.preventDefault();
            }
        });
    }

    setupThemeToggle() {
        const themeToggle = document.getElementById('theme-toggle');
        const root = document.documentElement;
        
        // Load saved theme
        const savedTheme = localStorage.getItem('minesweeper-theme');
        if (savedTheme === 'dark') {
            root.setAttribute('data-theme', 'dark');
            themeToggle.checked = true;
        }

        themeToggle.addEventListener('change', () => {
            if (themeToggle.checked) {
                root.setAttribute('data-theme', 'dark');
                localStorage.setItem('minesweeper-theme', 'dark');
            } else {
                root.removeAttribute('data-theme');
                localStorage.setItem('minesweeper-theme', 'light');
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

    newGame() {
        this.stopTimer();
        this.gameStarted = false;
        this.gameOver = false;
        this.gameWon = false;
        this.timer = 0;
        
        const settings = this.difficultySettings[this.difficulty];
        this.rows = settings.rows;
        this.cols = settings.cols;
        this.mineCount = settings.mines;
        
        this.initializeBoard();
        this.render();
        this.updateStats();
        this.closeAllModals();
    }

    restart() {
        this.newGame();
    }

    initializeBoard() {
        this.board = Array(this.rows).fill().map(() => Array(this.cols).fill(0));
        this.mines = Array(this.rows).fill().map(() => Array(this.cols).fill(false));
        this.revealed = Array(this.rows).fill().map(() => Array(this.cols).fill(false));
        this.flagged = Array(this.rows).fill().map(() => Array(this.cols).fill(false));
    }

    placeMines(excludeRow, excludeCol) {
        let minesPlaced = 0;
        
        while (minesPlaced < this.mineCount) {
            const row = Math.floor(Math.random() * this.rows);
            const col = Math.floor(Math.random() * this.cols);
            
            // Don't place mine on first click or if already has mine
            if ((row === excludeRow && col === excludeCol) || this.mines[row][col]) {
                continue;
            }
            
            this.mines[row][col] = true;
            minesPlaced++;
        }
        
        this.calculateNumbers();
    }

    calculateNumbers() {
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                if (!this.mines[row][col]) {
                    this.board[row][col] = this.countAdjacentMines(row, col);
                }
            }
        }
    }

    countAdjacentMines(row, col) {
        let count = 0;
        for (let r = row - 1; r <= row + 1; r++) {
            for (let c = col - 1; c <= col + 1; c++) {
                if (r >= 0 && r < this.rows && c >= 0 && c < this.cols) {
                    if (this.mines[r][c]) {
                        count++;
                    }
                }
            }
        }
        return count;
    }

    handleCellClick(row, col, isRightClick = false) {
        if (this.gameOver || this.gameWon || this.flagged[row][col]) {
            return;
        }

        if (isRightClick) {
            this.toggleFlag(row, col);
            return;
        }

        if (!this.gameStarted) {
            this.gameStarted = true;
            this.placeMines(row, col);
            this.startTimer();
        }

        this.revealCell(row, col);
        this.render();
        this.updateStats();
        this.checkWinCondition();
    }

    revealCell(row, col) {
        if (this.revealed[row][col] || this.flagged[row][col]) {
            return;
        }

        this.revealed[row][col] = true;

        if (this.mines[row][col]) {
            this.gameOver = true;
            this.stopTimer();
            this.revealAllMines();
            this.showGameOverModal();
            return;
        }

        // If cell is empty, reveal adjacent cells
        if (this.board[row][col] === 0) {
            for (let r = row - 1; r <= row + 1; r++) {
                for (let c = col - 1; c <= col + 1; c++) {
                    if (r >= 0 && r < this.rows && c >= 0 && c < this.cols) {
                        if (!this.revealed[r][c] && !this.flagged[r][c]) {
                            this.revealCell(r, c);
                        }
                    }
                }
            }
        }
    }

    toggleFlag(row, col) {
        if (this.revealed[row][col] || this.gameOver || this.gameWon) {
            return;
        }

        this.flagged[row][col] = !this.flagged[row][col];
        this.render();
        this.updateStats();
    }

    revealAll() {
        if (this.gameOver || this.gameWon) {
            return;
        }

        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                if (!this.mines[row][col]) {
                    this.revealed[row][col] = true;
                }
            }
        }

        this.gameOver = true;
        this.stopTimer();
        this.render();
        this.showGameOverModal();
    }

    revealAllMines() {
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                if (this.mines[row][col]) {
                    this.revealed[row][col] = true;
                }
            }
        }
    }

    checkWinCondition() {
        let revealedCount = 0;
        let flaggedMines = 0;

        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                if (this.revealed[row][col] && !this.mines[row][col]) {
                    revealedCount++;
                }
                if (this.flagged[row][col] && this.mines[row][col]) {
                    flaggedMines++;
                }
            }
        }

        const totalSafeCells = this.rows * this.cols - this.mineCount;
        
        if (revealedCount === totalSafeCells || flaggedMines === this.mineCount) {
            this.gameWon = true;
            this.stopTimer();
            this.showWinModal();
        }
    }

    startTimer() {
        this.timerInterval = setInterval(() => {
            this.timer++;
            this.updateStats();
        }, 1000);
    }

    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    render() {
        const gameBoard = document.getElementById('game-board');
        gameBoard.innerHTML = '';
        gameBoard.style.gridTemplateColumns = `repeat(${this.cols}, 1fr)`;
        gameBoard.style.gridTemplateRows = `repeat(${this.rows}, 1fr)`;

        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.row = row;
                cell.dataset.col = col;

                if (this.revealed[row][col]) {
                    cell.classList.add('revealed');
                    
                    if (this.mines[row][col]) {
                        cell.classList.add('mine');
                        if (this.gameOver) {
                            cell.classList.add('exploded');
                        }
                        cell.innerHTML = '<i class="fas fa-bomb"></i>';
                    } else if (this.board[row][col] > 0) {
                        cell.textContent = this.board[row][col];
                        cell.classList.add(`number-${this.board[row][col]}`);
                    }
                } else if (this.flagged[row][col]) {
                    cell.classList.add('flagged');
                    cell.innerHTML = '<i class="fas fa-flag"></i>';
                }

                // Add click event listeners
                cell.addEventListener('click', () => {
                    this.handleCellClick(row, col, false);
                });

                cell.addEventListener('contextmenu', (e) => {
                    e.preventDefault();
                    this.handleCellClick(row, col, true);
                });

                // Add touch events for mobile
                cell.addEventListener('touchstart', (e) => {
                    e.preventDefault();
                    this.handleTouchStart(e, row, col);
                });

                gameBoard.appendChild(cell);
            }
        }
    }

    handleTouchStart(e, row, col) {
        const touch = e.touches[0];
        const startTime = Date.now();
        const startX = touch.clientX;
        const startY = touch.clientY;

        const handleTouchEnd = (e) => {
            const touch = e.changedTouches[0];
            const endTime = Date.now();
            const endX = touch.clientX;
            const endY = touch.clientY;
            const duration = endTime - startTime;
            const distance = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));

            // Long press or small movement = right click (flag)
            if (duration > 500 || distance < 10) {
                this.handleCellClick(row, col, true);
            } else {
                this.handleCellClick(row, col, false);
            }

            document.removeEventListener('touchend', handleTouchEnd);
        };

        document.addEventListener('touchend', handleTouchEnd);
    }

    updateStats() {
        document.getElementById('timer').textContent = this.timer.toString().padStart(3, '0');
        document.getElementById('mines-count').textContent = this.mineCount;
        
        const flaggedCount = this.flagged.flat().filter(Boolean).length;
        document.getElementById('flags-count').textContent = flaggedCount;
    }

    showGameOverModal() {
        document.getElementById('game-over-message').textContent = 'You hit a mine!';
        document.getElementById('modal-time').textContent = this.timer.toString().padStart(3, '0');
        document.getElementById('modal-difficulty').textContent = this.difficulty.charAt(0).toUpperCase() + this.difficulty.slice(1);
        document.getElementById('game-over-modal').style.display = 'flex';
    }

    showWinModal() {
        document.getElementById('win-time').textContent = this.timer.toString().padStart(3, '0');
        document.getElementById('win-difficulty').textContent = this.difficulty.charAt(0).toUpperCase() + this.difficulty.slice(1);
        document.getElementById('win-modal').style.display = 'flex';
    }

    closeModal(modalId) {
        document.getElementById(modalId).style.display = 'none';
    }

    closeAllModals() {
        document.getElementById('game-over-modal').style.display = 'none';
        document.getElementById('win-modal').style.display = 'none';
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const game = new MinesweeperGame();
    console.log('💣 Minesweeper Game initialized successfully!');
});
