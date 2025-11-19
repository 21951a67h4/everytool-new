// Inherit template logic
// Note: We need to manually include the template script functionality or just copy it.
// Since we can't easily import, we'll copy the relevant parts from the template script.

document.addEventListener('DOMContentLoaded', () => {
    // --- Template Logic Start ---
    const backBtn = document.getElementById('back-btn');
    const themeToggle = document.getElementById('theme-toggle');
    const themeSwitch = themeToggle?.closest('.theme-switch');
    
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            if (document.referrer && document.referrer.indexOf(location.host) !== -1) {
                history.back();
            } else {
                window.location.href = '../index.html';
            }
        });
    }

    const yearSpan = document.getElementById('copyright-year');
    if (yearSpan) {
        yearSpan.textContent = new Date().getFullYear().toString() + ' © ';
    }

    const root = document.documentElement;
    let saved = null;
    try { saved = localStorage.getItem('et-theme'); } catch (e) {}
    if (saved === 'dark') { root.setAttribute('data-theme', 'dark'); }

    if (themeToggle && themeSwitch) {
        const isDark = root.getAttribute('data-theme') === 'dark';
        themeToggle.checked = isDark;
        themeSwitch.setAttribute('aria-checked', String(isDark));
        const thumbIcon = themeSwitch.querySelector('.switch-thumb i');
        if (thumbIcon) thumbIcon.className = isDark ? 'fas fa-sun' : 'fas fa-moon';

        themeToggle.addEventListener('change', () => {
            const checked = themeToggle.checked;
            themeSwitch.setAttribute('aria-checked', String(checked));
            if (checked) {
                root.setAttribute('data-theme', 'dark');
                try { localStorage.setItem('et-theme', 'dark'); } catch (e) {}
                if (thumbIcon) thumbIcon.className = 'fas fa-sun';
            } else {
                root.removeAttribute('data-theme');
                try { localStorage.setItem('et-theme', 'light'); } catch (e) {}
                if (thumbIcon) thumbIcon.className = 'fas fa-moon';
            }
        });
    }
    // --- Template Logic End ---

    // --- Tetris Game Logic ---
    const canvas = document.getElementById('tetris');
    const context = canvas.getContext('2d');
    const nextCanvas = document.getElementById('next-piece');
    const nextContext = nextCanvas.getContext('2d');
    
    const scoreElement = document.getElementById('score');
    const levelElement = document.getElementById('level');
    const startBtn = document.getElementById('start-btn');
    const pauseBtn = document.getElementById('pause-btn'); // Add pause button to HTML if not present
    const gameOverOverlay = document.getElementById('game-over-overlay');
    const finalScoreElement = document.getElementById('final-score');
    const restartBtn = document.getElementById('restart-btn');

    context.scale(20, 20);
    nextContext.scale(20, 20);

    const COLORS = [
        null,
        '#FF0D72', // T
        '#0DC2FF', // O
        '#0DFF72', // L
        '#F538FF', // J
        '#FF8E0D', // I
        '#FFE138', // S
        '#3877FF', // Z
    ];

    const ARENA_WIDTH = 12;
    const ARENA_HEIGHT = 20;

    function createPiece(type) {
        if (type === 'I') {
            return [
                [0, 1, 0, 0],
                [0, 1, 0, 0],
                [0, 1, 0, 0],
                [0, 1, 0, 0],
            ];
        } else if (type === 'L') {
            return [
                [0, 2, 0],
                [0, 2, 0],
                [0, 2, 2],
            ];
        } else if (type === 'J') {
            return [
                [0, 3, 0],
                [0, 3, 0],
                [3, 3, 0],
            ];
        } else if (type === 'O') {
            return [
                [4, 4],
                [4, 4],
            ];
        } else if (type === 'Z') {
            return [
                [5, 5, 0],
                [0, 5, 5],
                [0, 0, 0],
            ];
        } else if (type === 'S') {
            return [
                [0, 6, 6],
                [6, 6, 0],
                [0, 0, 0],
            ];
        } else if (type === 'T') {
            return [
                [0, 7, 0],
                [7, 7, 7],
                [0, 0, 0],
            ];
        }
    }

    function createMatrix(w, h) {
        const matrix = [];
        while (h--) {
            matrix.push(new Array(w).fill(0));
        }
        return matrix;
    }

    let arena = createMatrix(ARENA_WIDTH, ARENA_HEIGHT);

    const player = {
        pos: {x: 0, y: 0},
        matrix: null,
        score: 0,
        level: 1,
        lines: 0,
        next: null,
    };

    let dropCounter = 0;
    let dropInterval = 1000;
    let lastTime = 0;
    let isPaused = false;
    let isGameOver = false;
    let requestId = null;

    function drawMatrix(matrix, offset, ctx) {
        matrix.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value !== 0) {
                    ctx.fillStyle = COLORS[value];
                    ctx.fillRect(x + offset.x, y + offset.y, 1, 1);
                    
                    // Add a slight bevel effect
                    ctx.lineWidth = 0.05;
                    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
                    ctx.strokeRect(x + offset.x, y + offset.y, 1, 1);
                }
            });
        });
    }

    function draw() {
        context.fillStyle = '#000';
        context.fillRect(0, 0, canvas.width, canvas.height);

        drawMatrix(arena, {x: 0, y: 0}, context);
        drawMatrix(player.matrix, player.pos, context);
    }

    function drawNext() {
        nextContext.fillStyle = '#000';
        nextContext.fillRect(0, 0, nextCanvas.width, nextCanvas.height);
        
        // Center the piece
        const offsetX = (4 - player.next[0].length) / 2;
        const offsetY = (4 - player.next.length) / 2;
        
        drawMatrix(player.next, {x: offsetX, y: offsetY}, nextContext);
    }

    function merge(arena, player) {
        player.matrix.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value !== 0) {
                    arena[y + player.pos.y][x + player.pos.x] = value;
                }
            });
        });
    }

    function rotate(matrix, dir) {
        for (let y = 0; y < matrix.length; ++y) {
            for (let x = 0; x < y; ++x) {
                [
                    matrix[x][y],
                    matrix[y][x],
                ] = [
                    matrix[y][x],
                    matrix[x][y],
                ];
            }
        }

        if (dir > 0) {
            matrix.forEach(row => row.reverse());
        } else {
            matrix.reverse();
        }
    }

    function playerDrop() {
        player.pos.y++;
        if (collide(arena, player)) {
            player.pos.y--;
            merge(arena, player);
            playerReset();
            arenaSweep();
            updateScore();
        }
        dropCounter = 0;
    }

    function playerMove(offset) {
        player.pos.x += offset;
        if (collide(arena, player)) {
            player.pos.x -= offset;
        }
    }

    function playerRotate(dir) {
        const pos = player.pos.x;
        let offset = 1;
        rotate(player.matrix, dir);
        while (collide(arena, player)) {
            player.pos.x += offset;
            offset = -(offset + (offset > 0 ? 1 : -1));
            if (offset > player.matrix[0].length) {
                rotate(player.matrix, -dir);
                player.pos.x = pos;
                return;
            }
        }
    }

    function playerReset() {
        if (player.next === null) {
            player.next = createPiece('ILJOTSZ'[Math.floor(Math.random() * 7)]);
        }
        player.matrix = player.next;
        player.next = createPiece('ILJOTSZ'[Math.floor(Math.random() * 7)]);
        drawNext();
        
        player.pos.y = 0;
        player.pos.x = (arena[0].length / 2 | 0) - (player.matrix[0].length / 2 | 0);

        if (collide(arena, player)) {
            gameOver();
        }
    }

    function collide(arena, player) {
        const m = player.matrix;
        const o = player.pos;
        for (let y = 0; y < m.length; ++y) {
            for (let x = 0; x < m[y].length; ++x) {
                if (m[y][x] !== 0 &&
                   (arena[y + o.y] && arena[y + o.y][x + o.x]) !== 0) {
                    return true;
                }
            }
        }
        return false;
    }

    function arenaSweep() {
        let rowCount = 1;
        outer: for (let y = arena.length -1; y > 0; --y) {
            for (let x = 0; x < arena[y].length; ++x) {
                if (arena[y][x] === 0) {
                    continue outer;
                }
            }

            const row = arena.splice(y, 1)[0].fill(0);
            arena.unshift(row);
            ++y;

            player.score += rowCount * 10;
            player.lines += 1;
            rowCount *= 2;
        }
        
        // Level up every 10 lines
        player.level = Math.floor(player.lines / 10) + 1;
        dropInterval = Math.max(100, 1000 - (player.level - 1) * 100);
    }

    function updateScore() {
        scoreElement.innerText = player.score;
        levelElement.innerText = player.level;
    }

    function gameOver() {
        isGameOver = true;
        cancelAnimationFrame(requestId);
        finalScoreElement.innerText = player.score;
        gameOverOverlay.classList.remove('hidden');
        startBtn.classList.remove('hidden');
        pauseBtn.classList.add('hidden');
    }

    function update(time = 0) {
        if (isPaused || isGameOver) return;

        const deltaTime = time - lastTime;
        lastTime = time;

        dropCounter += deltaTime;
        if (dropCounter > dropInterval) {
            playerDrop();
        }

        draw();
        requestId = requestAnimationFrame(update);
    }

    function startGame() {
        arena.forEach(row => row.fill(0));
        player.score = 0;
        player.lines = 0;
        player.level = 1;
        dropInterval = 1000;
        updateScore();
        isGameOver = false;
        isPaused = false;
        gameOverOverlay.classList.add('hidden');
        startBtn.classList.add('hidden');
        pauseBtn.classList.remove('hidden');
        pauseBtn.innerText = 'Pause';
        
        playerReset();
        update();
    }

    function togglePause() {
        if (isGameOver) return;
        isPaused = !isPaused;
        if (isPaused) {
            pauseBtn.innerText = 'Resume';
            cancelAnimationFrame(requestId);
        } else {
            pauseBtn.innerText = 'Pause';
            lastTime = performance.now();
            update();
        }
    }

    document.addEventListener('keydown', event => {
        if (isGameOver || isPaused) return;
        
        if (event.keyCode === 37) { // Left
            playerMove(-1);
        } else if (event.keyCode === 39) { // Right
            playerMove(1);
        } else if (event.keyCode === 40) { // Down
            playerDrop();
        } else if (event.keyCode === 38) { // Up
            playerRotate(1);
        }
    });

    startBtn.addEventListener('click', startGame);
    restartBtn.addEventListener('click', startGame);
    if (pauseBtn) pauseBtn.addEventListener('click', togglePause);
});
