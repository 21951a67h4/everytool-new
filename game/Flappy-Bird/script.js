// Template logic
document.addEventListener('DOMContentLoaded', () => {
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
    if (yearSpan) yearSpan.textContent = new Date().getFullYear().toString() + ' © ';

    const root = document.documentElement;
    let saved = null;
    try { saved = localStorage.getItem('et-theme'); } catch (e) { }
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
                try { localStorage.setItem('et-theme', 'dark'); } catch (e) { }
                if (thumbIcon) thumbIcon.className = 'fas fa-sun';
            } else {
                root.removeAttribute('data-theme');
                try { localStorage.setItem('et-theme', 'light'); } catch (e) { }
                if (thumbIcon) thumbIcon.className = 'fas fa-moon';
            }
        });
    }

    // --- Flappy Bird Logic ---
    const canvas = document.getElementById('flappy');
    const ctx = canvas.getContext('2d');

    const startOverlay = document.getElementById('start-overlay');
    const gameOverOverlay = document.getElementById('game-over-overlay');
    const startBtn = document.getElementById('start-btn');
    const restartBtn = document.getElementById('restart-btn');
    const scoreDisplay = document.getElementById('score-display');
    const finalScoreEl = document.getElementById('final-score');
    const bestScoreEl = document.getElementById('best-score');

    // Game variables
    let frames = 0;
    let score = 0;
    let bestScore = localStorage.getItem('flappy_best') || 0;
    let isGameRunning = false;
    let animationId;

    const DEGREE = Math.PI / 180;

    // Game State
    const state = {
        current: 0,
        getReady: 0,
        game: 1,
        over: 2
    };

    // Controls
    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space') {
            e.preventDefault();
            if (state.current === state.game) {
                bird.flap();
            }
        }
    });

    canvas.addEventListener('click', () => {
        if (state.current === state.game) {
            bird.flap();
        }
    });

    // Bird
    const bird = {
        x: 50,
        y: 150,
        w: 34,
        h: 26,
        radius: 12,
        frame: 0,
        gravity: 0.25,
        jump: 4.6,
        speed: 0,
        rotation: 0,

        draw: function () {
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.rotation);

            ctx.fillStyle = "#FFD700";
            ctx.beginPath();
            ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = "#000";
            ctx.lineWidth = 2;
            ctx.stroke();

            // Eye
            ctx.fillStyle = "#FFF";
            ctx.beginPath();
            ctx.arc(6, -6, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = "#000";
            ctx.beginPath();
            ctx.arc(8, -6, 1, 0, Math.PI * 2);
            ctx.fill();

            // Wing
            ctx.fillStyle = "#FFF";
            ctx.beginPath();
            ctx.ellipse(-5, 2, 8, 5, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // Beak
            ctx.fillStyle = "#FFA500";
            ctx.beginPath();
            ctx.moveTo(8, 2);
            ctx.lineTo(16, 6);
            ctx.lineTo(8, 10);
            ctx.fill();
            ctx.stroke();

            ctx.restore();
        },

        flap: function () {
            this.speed = -this.jump;
        },

        update: function () {
            // If the game state is get ready state, the bird must flap slowly
            this.period = state.current == state.getReady ? 10 : 5;
            // We increment the frame by 1, each period
            this.frame += frames % this.period == 0 ? 1 : 0;
            // Frame goes from 0 to 4, then again to 0
            this.frame = this.frame % 4;

            if (state.current == state.getReady) {
                this.y = 150; // Reset position
                this.rotation = 0 * DEGREE;
            } else {
                this.speed += this.gravity;
                this.y += this.speed;

                if (this.y + this.h / 2 >= canvas.height - fg.h) {
                    this.y = canvas.height - fg.h - this.h / 2;
                    if (state.current == state.game) {
                        state.current = state.over;
                        gameOver();
                    }
                }

                // If the speed is greater than the jump means the bird is falling down
                if (this.speed >= this.jump) {
                    this.rotation = 90 * DEGREE;
                    this.frame = 1;
                } else {
                    this.rotation = -25 * DEGREE;
                }
            }
        },
        reset: function () {
            this.speed = 0;
            this.rotation = 0;
            this.y = 150;
        }
    }

    // Pipes
    const pipes = {
        position: [],

        w: 53,
        h: 400,
        dx: 2,
        gap: 100, // Gap between top and bottom pipe

        draw: function () {
            for (let i = 0; i < this.position.length; i++) {
                let p = this.position[i];
                let topY = p.y;
                let bottomY = p.y + this.h + this.gap;

                // Top Pipe
                ctx.fillStyle = "#73BF2E";
                ctx.fillRect(p.x, topY, this.w, this.h);
                ctx.strokeStyle = "#558C22";
                ctx.strokeRect(p.x, topY, this.w, this.h);

                // Bottom Pipe
                ctx.fillStyle = "#73BF2E";
                ctx.fillRect(p.x, bottomY, this.w, this.h);
                ctx.strokeStyle = "#558C22";
                ctx.strokeRect(p.x, bottomY, this.w, this.h);
            }
        },

        update: function () {
            if (state.current !== state.game) return;

            // Add new pipe every 100 frames
            if (frames % 120 == 0) {
                this.position.push({
                    x: canvas.width,
                    y: -150 * (Math.random() + 1)
                });
            }

            for (let i = 0; i < this.position.length; i++) {
                let p = this.position[i];

                let bottomPipeY = p.y + this.h + this.gap;

                // Collision Detection
                // Top Pipe
                if (bird.x + bird.radius > p.x &&
                    bird.x - bird.radius < p.x + this.w &&
                    bird.y + bird.radius > p.y &&
                    bird.y - bird.radius < p.y + this.h) {
                    state.current = state.over;
                    gameOver();
                }
                // Bottom Pipe
                if (bird.x + bird.radius > p.x &&
                    bird.x - bird.radius < p.x + this.w &&
                    bird.y + bird.radius > bottomPipeY &&
                    bird.y - bird.radius < bottomPipeY + this.h) {
                    state.current = state.over;
                    gameOver();
                }

                // Move pipes
                p.x -= this.dx;

                // Remove pipes that go beyond canvas
                if (p.x + this.w <= 0) {
                    this.position.shift();
                    score++;
                    scoreDisplay.innerText = score;
                    bestScore = Math.max(score, bestScore);
                    localStorage.setItem('flappy_best', bestScore);
                }
            }
        },

        reset: function () {
            this.position = [];
        }
    }

    // Foreground
    const fg = {
        h: 112,
        draw: function () {
            ctx.fillStyle = "#ded895";
            ctx.fillRect(0, canvas.height - this.h, canvas.width, this.h);
            ctx.beginPath();
            ctx.moveTo(0, canvas.height - this.h);
            ctx.lineTo(canvas.width, canvas.height - this.h);
            ctx.strokeStyle = "#543847";
            ctx.stroke();
        }
    }

    function draw() {
        // Background
        ctx.fillStyle = root.getAttribute('data-theme') === 'dark' ? "#2c3e50" : "#70c5ce";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        pipes.draw();
        fg.draw();
        bird.draw();
    }

    function update() {
        bird.update();
        pipes.update();
    }

    function loop() {
        update();
        draw();
        frames++;

        if (isGameRunning) {
            animationId = requestAnimationFrame(loop);
        }
    }

    function gameOver() {
        isGameRunning = false;
        cancelAnimationFrame(animationId);
        finalScoreEl.innerText = score;
        bestScoreEl.innerText = bestScore;
        gameOverOverlay.classList.remove('hidden');
        scoreDisplay.classList.add('hidden');
    }

    function startGame() {
        state.current = state.game;
        bird.reset();
        pipes.reset();
        score = 0;
        frames = 0;
        scoreDisplay.innerText = score;
        scoreDisplay.classList.remove('hidden');
        startOverlay.classList.add('hidden');
        gameOverOverlay.classList.add('hidden');
        isGameRunning = true;
        loop();
    }

    startBtn.addEventListener('click', startGame);
    restartBtn.addEventListener('click', startGame);

    // Initial draw
    bird.y = 150;
    draw();
});
