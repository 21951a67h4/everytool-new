/**
 * Snake Game Implementation
 * Features: Real-time score, speed/difficulty selection, restart after losing
 */

class SnakeGame {
    constructor() {
        this.boardSize = 20;
        this.gameBoard = null;
        this.snake = [];
        this.food = null;
        this.direction = { x: 0, y: 0 };
        this.nextDirection = { x: 0, y: 0 };
        this.gameRunning = false;
        this.gamePaused = false;
        this.score = 0;
        this.highScore = 0;
        this.gameSpeed = 150;
        this.difficultySettings = {
            slow: { speed: 200, points: 10 },
            medium: { speed: 150, points: 20 },
            fast: { speed: 100, points: 30 },
            insane: { speed: 80, points: 50 }
        };
        this.currentDifficulty = 'medium';
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupThemeToggle();
        this.setupBackButton();
        this.updateCopyrightYear();
        this.loadHighScore();
        this.createBoard();
        this.updateDisplay();
    }

    setupEventListeners() {
        // Game controls
        document.getElementById('start-btn').addEventListener('click', () => this.startGame());
        document.getElementById('pause-btn').addEventListener('click', () => this.togglePause());
        document.getElementById('reset-btn').addEventListener('click', () => this.resetGame());
        document.getElementById('restart-btn').addEventListener('click', () => this.restartGame());

        // Difficulty selector
        document.getElementById('difficulty').addEventListener('change', (e) => {
            this.setDifficulty(e.target.value);
        });

        // Keyboard controls
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));
    }

    setupThemeToggle() {
        const themeToggle = document.getElementById('theme-toggle');
        const root = document.documentElement;
        
        // Load saved theme
        const savedTheme = localStorage.getItem('snake-theme');
        if (savedTheme === 'dark') {
            root.setAttribute('data-theme', 'dark');
            themeToggle.checked = true;
        }

        themeToggle.addEventListener('change', () => {
            if (themeToggle.checked) {
                root.setAttribute('data-theme', 'dark');
                localStorage.setItem('snake-theme', 'dark');
            } else {
                root.removeAttribute('data-theme');
                localStorage.setItem('snake-theme', 'light');
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

    loadHighScore() {
        const savedHighScore = localStorage.getItem('snake-high-score');
        if (savedHighScore) {
            this.highScore = parseInt(savedHighScore);
        }
    }

    saveHighScore() {
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('snake-high-score', this.highScore.toString());
        }
    }

    createBoard() {
        this.gameBoard = document.getElementById('game-board');
        this.gameBoard.innerHTML = '';

        for (let i = 0; i < this.boardSize * this.boardSize; i++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.dataset.index = i;
            this.gameBoard.appendChild(cell);
        }
    }

    initializeSnake() {
        const center = Math.floor(this.boardSize / 2);
        this.snake = [
            { x: center, y: center }
        ];
        this.direction = { x: 0, y: 0 };
        this.nextDirection = { x: 0, y: 0 };
    }

    generateFood() {
        let foodPosition;
        do {
            foodPosition = {
                x: Math.floor(Math.random() * this.boardSize),
                y: Math.floor(Math.random() * this.boardSize)
            };
        } while (this.snake.some(segment => 
            segment.x === foodPosition.x && segment.y === foodPosition.y
        ));
        
        this.food = foodPosition;
    }

    updateDisplay() {
        // Clear board
        document.querySelectorAll('.cell').forEach(cell => {
            cell.className = 'cell';
        });

        // Draw snake
        this.snake.forEach((segment, index) => {
            const cellIndex = segment.y * this.boardSize + segment.x;
            const cell = document.querySelector(`[data-index="${cellIndex}"]`);
            if (cell) {
                cell.classList.add(index === 0 ? 'snake-head' : 'snake');
            }
        });

        // Draw food
        if (this.food) {
            const foodIndex = this.food.y * this.boardSize + this.food.x;
            const foodCell = document.querySelector(`[data-index="${foodIndex}"]`);
            if (foodCell) {
                foodCell.classList.add('food');
            }
        }

        // Update stats
        document.getElementById('score').textContent = this.score;
        document.getElementById('high-score').textContent = this.highScore;
        document.getElementById('length').textContent = this.snake.length;
    }

    moveSnake() {
        if (!this.gameRunning || this.gamePaused) return;

        // Update direction
        this.direction = { ...this.nextDirection };

        // Calculate new head position
        const head = { ...this.snake[0] };
        head.x += this.direction.x;
        head.y += this.direction.y;

        // Check wall collision
        if (head.x < 0 || head.x >= this.boardSize || 
            head.y < 0 || head.y >= this.boardSize) {
            this.gameOver();
            return;
        }

        // Check self collision
        if (this.snake.some(segment => 
            segment.x === head.x && segment.y === head.y)) {
            this.gameOver();
            return;
        }

        // Add new head
        this.snake.unshift(head);

        // Check food collision
        if (this.food && head.x === this.food.x && head.y === this.food.y) {
            this.eatFood();
        } else {
            // Remove tail if no food eaten
            this.snake.pop();
        }

        this.updateDisplay();
    }

    eatFood() {
        this.score += this.difficultySettings[this.currentDifficulty].points;
        this.generateFood();
        this.saveHighScore();
    }

    startGame() {
        if (this.gameRunning) return;

        this.gameRunning = true;
        this.gamePaused = false;
        this.score = 0;
        
        this.initializeSnake();
        this.generateFood();
        this.updateDisplay();
        
        // Don't start the game loop until player makes first move
        this.updateGameMessage('Use arrow keys or WASD to start moving!', 'playing');
        this.updateButtons();
        
        // Hide game over overlay
        document.getElementById('game-over').classList.add('hidden');
    }

    togglePause() {
        if (!this.gameRunning) return;

        this.gamePaused = !this.gamePaused;
        
        if (this.gamePaused) {
            clearInterval(this.gameLoop);
            this.updateGameMessage('Game Paused', 'paused');
        } else {
            this.gameLoop = setInterval(() => this.moveSnake(), this.gameSpeed);
            this.updateGameMessage('Game Running!', 'playing');
        }
        
        this.updateButtons();
    }

    resetGame() {
        this.stopGame();
        this.score = 0;
        this.snake = [];
        this.food = null;
        this.direction = { x: 0, y: 0 };
        this.nextDirection = { x: 0, y: 0 };
        
        this.updateDisplay();
        this.updateGameMessage('Press Start to begin!', '');
        this.updateButtons();
        
        // Hide game over overlay
        document.getElementById('game-over').classList.add('hidden');
    }

    restartGame() {
        this.startGame();
    }

    stopGame() {
        this.gameRunning = false;
        this.gamePaused = false;
        
        if (this.gameLoop) {
            clearInterval(this.gameLoop);
            this.gameLoop = null;
        }
        
        this.updateButtons();
    }

    gameOver() {
        this.stopGame();
        this.updateGameMessage('Game Over!', '');
        
        // Show game over overlay
        document.getElementById('final-score').textContent = this.score;
        document.getElementById('final-length').textContent = this.snake.length;
        document.getElementById('game-over').classList.remove('hidden');
        
        this.updateButtons();
    }

    setDifficulty(difficulty) {
        this.currentDifficulty = difficulty;
        this.gameSpeed = this.difficultySettings[difficulty].speed;
        
        // Restart game loop with new speed if game is running
        if (this.gameRunning && !this.gamePaused) {
            clearInterval(this.gameLoop);
            this.gameLoop = setInterval(() => this.moveSnake(), this.gameSpeed);
        }
    }

    handleKeyPress(e) {
        if (!this.gameRunning) return;

        // Prevent default behavior for arrow keys and space
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
            e.preventDefault();
        }

        // Pause/Resume with spacebar
        if (e.code === 'Space') {
            this.togglePause();
            return;
        }

        // Movement controls
        const directions = {
            'ArrowUp': { x: 0, y: -1 },
            'ArrowDown': { x: 0, y: 1 },
            'ArrowLeft': { x: -1, y: 0 },
            'ArrowRight': { x: 1, y: 0 },
            'KeyW': { x: 0, y: -1 },
            'KeyS': { x: 0, y: 1 },
            'KeyA': { x: -1, y: 0 },
            'KeyD': { x: 1, y: 0 }
        };

        const newDirection = directions[e.code];
        if (newDirection) {
            // Prevent reversing into self
            if (this.direction.x !== -newDirection.x || this.direction.y !== -newDirection.y) {
                this.nextDirection = newDirection;
                
                // Start the game loop on first move
                if (!this.gameLoop) {
                    this.gameLoop = setInterval(() => this.moveSnake(), this.gameSpeed);
                    this.updateGameMessage('Game Running!', 'playing');
                }
            }
        }
    }

    updateGameMessage(message, className = '') {
        const messageElement = document.getElementById('game-message');
        messageElement.textContent = message;
        messageElement.className = `game-message ${className}`;
    }

    updateButtons() {
        const startBtn = document.getElementById('start-btn');
        const pauseBtn = document.getElementById('pause-btn');
        const resetBtn = document.getElementById('reset-btn');

        if (this.gameRunning) {
            startBtn.disabled = true;
            pauseBtn.disabled = false;
            pauseBtn.innerHTML = this.gamePaused ? 
                '<i class="fas fa-play"></i> Resume' : 
                '<i class="fas fa-pause"></i> Pause';
        } else {
            startBtn.disabled = false;
            pauseBtn.disabled = true;
            pauseBtn.innerHTML = '<i class="fas fa-pause"></i> Pause';
        }
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const game = new SnakeGame();
    console.log('🐍 Snake Game initialized successfully!');
});
