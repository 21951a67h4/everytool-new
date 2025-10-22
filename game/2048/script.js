/**
 * 2048 Game Implementation
 * Features: Tile animations, responsive controls, real-time score, undo/restart, keyboard/mobile controls, visual feedback
 */

class Game2048 {
    constructor() {
        this.board = [];
        this.score = 0;
        this.bestScore = 0;
        this.moves = 0;
        this.gameWon = false;
        this.gameOver = false;
        this.history = [];
        this.isAnimating = false;
        
        this.init();
    }

    init() {
        this.loadBestScore();
        this.setupEventListeners();
        this.setupTouchControls();
        this.setupThemeToggle();
        this.setupBackButton();
        this.updateCopyrightYear();
        this.newGame();
    }

    setupEventListeners() {
        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            if (this.isAnimating || this.gameOver) return;
            
            const keyMap = {
                'ArrowUp': 'up',
                'ArrowDown': 'down',
                'ArrowLeft': 'left',
                'ArrowRight': 'right',
                'KeyW': 'up',
                'KeyS': 'down',
                'KeyA': 'left',
                'KeyD': 'right'
            };
            
            const direction = keyMap[e.code];
            if (direction) {
                e.preventDefault();
                this.move(direction);
            }
        });

        // Button controls
        document.getElementById('new-game').addEventListener('click', () => this.newGame());
        document.getElementById('undo-btn').addEventListener('click', () => this.undo());
        document.getElementById('restart-btn').addEventListener('click', () => this.restart());

        // Modal controls
        document.getElementById('play-again').addEventListener('click', () => {
            this.closeModal('game-over-modal');
            this.newGame();
        });

        document.getElementById('close-modal').addEventListener('click', () => {
            this.closeModal('game-over-modal');
        });

        document.getElementById('continue-game').addEventListener('click', () => {
            this.closeModal('win-modal');
        });

        document.getElementById('new-game-win').addEventListener('click', () => {
            this.closeModal('win-modal');
            this.newGame();
        });

        // Touch controls
        this.setupSwipeControls();
    }

    setupTouchControls() {
        const touchControls = document.createElement('div');
        touchControls.className = 'touch-controls';
        touchControls.innerHTML = `
            <button class="touch-btn up" data-direction="up"><i class="fas fa-chevron-up"></i></button>
            <button class="touch-btn left" data-direction="left"><i class="fas fa-chevron-left"></i></button>
            <button class="touch-btn right" data-direction="right"><i class="fas fa-chevron-right"></i></button>
            <button class="touch-btn down" data-direction="down"><i class="fas fa-chevron-down"></i></button>
        `;
        document.body.appendChild(touchControls);

        // Show touch controls on mobile
        if (window.innerWidth <= 600) {
            touchControls.classList.add('active');
        }

        // Touch button events
        touchControls.addEventListener('click', (e) => {
            if (e.target.classList.contains('touch-btn')) {
                const direction = e.target.dataset.direction;
                if (direction && !this.isAnimating && !this.gameOver) {
                    this.move(direction);
                }
            }
        });

        // Update touch controls on resize
        window.addEventListener('resize', () => {
            if (window.innerWidth <= 600) {
                touchControls.classList.add('active');
            } else {
                touchControls.classList.remove('active');
            }
        });
    }

    setupSwipeControls() {
        let startX, startY, endX, endY;
        const minSwipeDistance = 50;

        document.addEventListener('touchstart', (e) => {
            if (this.isAnimating || this.gameOver) return;
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
        });

        document.addEventListener('touchend', (e) => {
            if (this.isAnimating || this.gameOver) return;
            endX = e.changedTouches[0].clientX;
            endY = e.changedTouches[0].clientY;

            const deltaX = endX - startX;
            const deltaY = endY - startY;

            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                // Horizontal swipe
                if (Math.abs(deltaX) > minSwipeDistance) {
                    if (deltaX > 0) {
                        this.move('right');
                    } else {
                        this.move('left');
                    }
                }
            } else {
                // Vertical swipe
                if (Math.abs(deltaY) > minSwipeDistance) {
                    if (deltaY > 0) {
                        this.move('down');
                    } else {
                        this.move('up');
                    }
                }
            }
        });
    }

    setupThemeToggle() {
        const themeToggle = document.getElementById('theme-toggle');
        const root = document.documentElement;
        
        // Load saved theme
        const savedTheme = localStorage.getItem('2048-theme');
        if (savedTheme === 'dark') {
            root.setAttribute('data-theme', 'dark');
            themeToggle.checked = true;
        }

        themeToggle.addEventListener('change', () => {
            if (themeToggle.checked) {
                root.setAttribute('data-theme', 'dark');
                localStorage.setItem('2048-theme', 'dark');
            } else {
                root.removeAttribute('data-theme');
                localStorage.setItem('2048-theme', 'light');
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
        this.board = Array(4).fill().map(() => Array(4).fill(0));
        this.score = 0;
        this.moves = 0;
        this.gameWon = false;
        this.gameOver = false;
        this.history = [];
        this.isAnimating = false;
        
        this.addRandomTile();
        this.addRandomTile();
        this.render();
        this.updateScore();
        this.closeAllModals();
    }

    restart() {
        this.newGame();
    }

    undo() {
        if (this.history.length === 0) return;
        
        const lastState = this.history.pop();
        this.board = lastState.board;
        this.score = lastState.score;
        this.moves = lastState.moves;
        this.gameWon = lastState.gameWon;
        this.gameOver = lastState.gameOver;
        
        this.render();
        this.updateScore();
    }

    saveState() {
        this.history.push({
            board: this.board.map(row => [...row]),
            score: this.score,
            moves: this.moves,
            gameWon: this.gameWon,
            gameOver: this.gameOver
        });
        
        // Limit history to prevent memory issues
        if (this.history.length > 10) {
            this.history.shift();
        }
    }

    addRandomTile() {
        const emptyCells = [];
        for (let row = 0; row < 4; row++) {
            for (let col = 0; col < 4; col++) {
                if (this.board[row][col] === 0) {
                    emptyCells.push({ row, col });
                }
            }
        }

        if (emptyCells.length > 0) {
            const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
            this.board[randomCell.row][randomCell.col] = Math.random() < 0.9 ? 2 : 4;
            
            // Add animation delay for new tile
            setTimeout(() => {
                this.render();
                this.animateNewTile(randomCell.row, randomCell.col);
            }, 100);
        }
    }
    
    animateNewTile(row, col) {
        const tiles = document.querySelectorAll('.tile');
        const tileIndex = row * 4 + col;
        if (tiles[tileIndex]) {
            tiles[tileIndex].classList.add('new');
            setTimeout(() => {
                tiles[tileIndex].classList.remove('new');
            }, 300);
        }
    }

    move(direction) {
        if (this.isAnimating) return;
        
        this.saveState();
        const oldBoard = this.board.map(row => [...row]);
        let moved = false;
        let scoreIncrease = 0;

        switch (direction) {
            case 'left':
                ({ moved, scoreIncrease } = this.moveLeft());
                break;
            case 'right':
                ({ moved, scoreIncrease } = this.moveRight());
                break;
            case 'up':
                ({ moved, scoreIncrease } = this.moveUp());
                break;
            case 'down':
                ({ moved, scoreIncrease } = this.moveDown());
                break;
        }

        if (moved) {
            this.moves++;
            this.score += scoreIncrease;
            this.addRandomTile();
            this.render();
            this.updateScore();
            this.animateScoreIncrease(scoreIncrease);
            
            if (this.score > this.bestScore) {
                this.bestScore = this.score;
                this.saveBestScore();
            }

            // Check for win condition
            if (!this.gameWon && this.hasWon()) {
                this.gameWon = true;
                setTimeout(() => this.showWinModal(), 300);
            }

            // Check for game over
            if (this.isGameOver()) {
                this.gameOver = true;
                setTimeout(() => this.showGameOverModal(), 300);
            }
        }
    }

    moveLeft() {
        let moved = false;
        let scoreIncrease = 0;

        for (let row = 0; row < 4; row++) {
            const line = this.board[row].filter(cell => cell !== 0);
            const newLine = [];
            
            for (let i = 0; i < line.length; i++) {
                if (i < line.length - 1 && line[i] === line[i + 1]) {
                    const mergedValue = line[i] * 2;
                    newLine.push(mergedValue);
                    scoreIncrease += mergedValue;
                    i++; // Skip next element
                } else {
                    newLine.push(line[i]);
                }
            }
            
            while (newLine.length < 4) {
                newLine.push(0);
            }
            
            if (JSON.stringify(newLine) !== JSON.stringify(this.board[row])) {
                moved = true;
            }
            
            this.board[row] = newLine;
        }

        return { moved, scoreIncrease };
    }

    moveRight() {
        let moved = false;
        let scoreIncrease = 0;

        for (let row = 0; row < 4; row++) {
            const line = this.board[row].filter(cell => cell !== 0);
            const newLine = [];
            
            for (let i = line.length - 1; i >= 0; i--) {
                if (i > 0 && line[i] === line[i - 1]) {
                    const mergedValue = line[i] * 2;
                    newLine.unshift(mergedValue);
                    scoreIncrease += mergedValue;
                    i--; // Skip previous element
                } else {
                    newLine.unshift(line[i]);
                }
            }
            
            while (newLine.length < 4) {
                newLine.unshift(0);
            }
            
            if (JSON.stringify(newLine) !== JSON.stringify(this.board[row])) {
                moved = true;
            }
            
            this.board[row] = newLine;
        }

        return { moved, scoreIncrease };
    }

    moveUp() {
        let moved = false;
        let scoreIncrease = 0;

        for (let col = 0; col < 4; col++) {
            const line = [];
            for (let row = 0; row < 4; row++) {
                if (this.board[row][col] !== 0) {
                    line.push(this.board[row][col]);
                }
            }
            
            const newLine = [];
            for (let i = 0; i < line.length; i++) {
                if (i < line.length - 1 && line[i] === line[i + 1]) {
                    const mergedValue = line[i] * 2;
                    newLine.push(mergedValue);
                    scoreIncrease += mergedValue;
                    i++; // Skip next element
                } else {
                    newLine.push(line[i]);
                }
            }
            
            while (newLine.length < 4) {
                newLine.push(0);
            }
            
            const oldColumn = [];
            for (let row = 0; row < 4; row++) {
                oldColumn.push(this.board[row][col]);
            }
            
            if (JSON.stringify(newLine) !== JSON.stringify(oldColumn)) {
                moved = true;
            }
            
            for (let row = 0; row < 4; row++) {
                this.board[row][col] = newLine[row];
            }
        }

        return { moved, scoreIncrease };
    }

    moveDown() {
        let moved = false;
        let scoreIncrease = 0;

        for (let col = 0; col < 4; col++) {
            const line = [];
            for (let row = 3; row >= 0; row--) {
                if (this.board[row][col] !== 0) {
                    line.push(this.board[row][col]);
                }
            }
            
            const newLine = [];
            for (let i = 0; i < line.length; i++) {
                if (i < line.length - 1 && line[i] === line[i + 1]) {
                    const mergedValue = line[i] * 2;
                    newLine.push(mergedValue);
                    scoreIncrease += mergedValue;
                    i++; // Skip next element
                } else {
                    newLine.push(line[i]);
                }
            }
            
            while (newLine.length < 4) {
                newLine.push(0);
            }
            
            const oldColumn = [];
            for (let row = 0; row < 4; row++) {
                oldColumn.push(this.board[row][col]);
            }
            
            if (JSON.stringify(newLine) !== JSON.stringify(oldColumn)) {
                moved = true;
            }
            
            for (let row = 0; row < 4; row++) {
                this.board[row][col] = newLine[3 - row];
            }
        }

        return { moved, scoreIncrease };
    }

    hasWon() {
        for (let row = 0; row < 4; row++) {
            for (let col = 0; col < 4; col++) {
                if (this.board[row][col] === 2048) {
                    return true;
                }
            }
        }
        return false;
    }

    isGameOver() {
        // Check for empty cells
        for (let row = 0; row < 4; row++) {
            for (let col = 0; col < 4; col++) {
                if (this.board[row][col] === 0) {
                    return false;
                }
            }
        }

        // Check for possible merges
        for (let row = 0; row < 4; row++) {
            for (let col = 0; col < 4; col++) {
                const current = this.board[row][col];
                
                // Check right neighbor
                if (col < 3 && this.board[row][col + 1] === current) {
                    return false;
                }
                
                // Check bottom neighbor
                if (row < 3 && this.board[row + 1][col] === current) {
                    return false;
                }
            }
        }

        return true;
    }

    render() {
        const gameBoard = document.getElementById('game-board');
        gameBoard.innerHTML = '';

        for (let row = 0; row < 4; row++) {
            for (let col = 0; col < 4; col++) {
                const tile = document.createElement('div');
                tile.className = 'tile';
                
                const value = this.board[row][col];
                if (value !== 0) {
                    tile.textContent = value;
                    tile.classList.add(`tile-${value}`);
                    
                    // Add special class for tiles >= 2048
                    if (value >= 2048) {
                        tile.classList.add('tile-super');
                    }
                    
                    // Add pulse animation for high-value tiles
                    if (value >= 512) {
                        tile.classList.add('pulse');
                    }
                }
                
                gameBoard.appendChild(tile);
            }
        }
        
        // Add entrance animation to the board
        gameBoard.style.animation = 'slideIn 0.5s ease-out';
    }

    updateScore() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('best-score').textContent = this.bestScore;
        document.getElementById('moves').textContent = this.moves;
    }

    animateScoreIncrease(scoreIncrease) {
        if (scoreIncrease > 0) {
            const scoreElement = document.getElementById('score');
            scoreElement.classList.add('score-increase');
            
            // Add visual feedback for high scores
            if (scoreIncrease >= 1000) {
                const gameBoard = document.getElementById('game-board');
                gameBoard.classList.add('shake');
                setTimeout(() => {
                    gameBoard.classList.remove('shake');
                }, 500);
            }
            
            setTimeout(() => {
                scoreElement.classList.remove('score-increase');
            }, 600);
        }
    }

    showGameOverModal() {
        document.getElementById('final-score').textContent = this.score;
        document.getElementById('modal-final-score').textContent = this.score;
        document.getElementById('modal-moves').textContent = this.moves;
        document.getElementById('game-over-modal').style.display = 'flex';
    }

    showWinModal() {
        document.getElementById('win-score').textContent = this.score;
        document.getElementById('win-modal').style.display = 'flex';
    }

    closeModal(modalId) {
        document.getElementById(modalId).style.display = 'none';
    }

    closeAllModals() {
        document.getElementById('game-over-modal').style.display = 'none';
        document.getElementById('win-modal').style.display = 'none';
    }

    loadBestScore() {
        const saved = localStorage.getItem('2048-best-score');
        if (saved) {
            this.bestScore = parseInt(saved);
        }
    }

    saveBestScore() {
        localStorage.setItem('2048-best-score', this.bestScore.toString());
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const game = new Game2048();
    console.log('🎮 2048 Game initialized successfully!');
});
