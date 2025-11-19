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

    // --- Pong Game Logic ---
    const canvas = document.getElementById('pong');
    const context = canvas.getContext('2d');

    const startOverlay = document.getElementById('start-overlay');
    const gameOverOverlay = document.getElementById('game-over-overlay');
    const startBtn = document.getElementById('start-btn');
    const restartBtn = document.getElementById('restart-btn');
    const winnerText = document.getElementById('winner-text');
    const playerScoreEl = document.getElementById('player-score');
    const cpuScoreEl = document.getElementById('cpu-score');
    const diffBtns = document.querySelectorAll('.btn-difficulty');

    // Game objects
    const ball = {
        x: canvas.width / 2,
        y: canvas.height / 2,
        radius: 10,
        velocityX: 5,
        velocityY: 5,
        speed: 7,
        color: "WHITE"
    };

    const user = {
        x: 0,
        y: (canvas.height - 100) / 2,
        width: 10,
        height: 100,
        score: 0,
        color: "#4361EE"
    };

    const com = {
        x: canvas.width - 10,
        y: (canvas.height - 100) / 2,
        width: 10,
        height: 100,
        score: 0,
        color: "#ef4444",
        level: 0.1 // Default easy
    };

    const net = {
        x: (canvas.width - 2) / 2,
        y: 0,
        height: 10,
        width: 2,
        color: "WHITE"
    };

    let isGameRunning = false;
    let animationId;

    // Difficulty selection
    diffBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            diffBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const diff = btn.dataset.diff;
            if (diff === 'easy') com.level = 0.1;
            if (diff === 'medium') com.level = 0.2;
            if (diff === 'hard') com.level = 0.3;
        });
    });

    function drawRect(x, y, w, h, color) {
        context.fillStyle = color;
        context.fillRect(x, y, w, h);
    }

    function drawArc(x, y, r, color) {
        context.fillStyle = color;
        context.beginPath();
        context.arc(x, y, r, 0, Math.PI * 2, true);
        context.closePath();
        context.fill();
    }

    function drawNet() {
        for (let i = 0; i <= canvas.height; i += 15) {
            drawRect(net.x, net.y + i, net.width, net.height, net.color);
        }
    }

    function resetBall() {
        ball.x = canvas.width / 2;
        ball.y = canvas.height / 2;
        ball.velocityX = -ball.velocityX;
        ball.speed = 7;
    }

    function update() {
        // Move the ball
        ball.x += ball.velocityX;
        ball.y += ball.velocityY;

        // Simple AI
        com.y += (ball.y - (com.y + com.height / 2)) * com.level;

        // Wall collision (top/bottom)
        if (ball.y - ball.radius < 0 || ball.y + ball.radius > canvas.height) {
            ball.velocityY = -ball.velocityY;
        }

        // Paddle collision
        let player = (ball.x + ball.radius < canvas.width / 2) ? user : com;

        if (collision(ball, player)) {
            // Where the ball hit the player
            let collidePoint = (ball.y - (player.y + player.height / 2));
            // Normalize the value of collidePoint, we need to get numbers between -1 and 1.
            // -player.height/2 < collide Point < player.height/2
            collidePoint = collidePoint / (player.height / 2);

            // When the ball hits the top of a paddle we want the ball, to take a -45degees angle
            // When the ball hits the center of the paddle we want the ball to take a 0degrees angle
            // When the ball hits the bottom of the paddle we want the ball to take a 45degrees
            // Math.PI/4 = 45degrees
            let angleRad = (Math.PI / 4) * collidePoint;

            // Change the X and Y velocity direction
            let direction = (ball.x + ball.radius < canvas.width / 2) ? 1 : -1;
            ball.velocityX = direction * ball.speed * Math.cos(angleRad);
            ball.velocityY = ball.speed * Math.sin(angleRad);

            // Speed up the ball everytime a paddle hits it.
            ball.speed += 0.1;
        }

        // Score update
        if (ball.x - ball.radius < 0) {
            com.score++;
            cpuScoreEl.innerText = com.score;
            resetBall();
        } else if (ball.x + ball.radius > canvas.width) {
            user.score++;
            playerScoreEl.innerText = user.score;
            resetBall();
        }

        // Check win condition
        if (user.score >= 5 || com.score >= 5) {
            isGameRunning = false;
            cancelAnimationFrame(animationId);
            winnerText.innerText = user.score >= 5 ? "You Win!" : "CPU Wins!";
            gameOverOverlay.classList.remove('hidden');
        }
    }

    function collision(b, p) {
        p.top = p.y;
        p.bottom = p.y + p.height;
        p.left = p.x;
        p.right = p.x + p.width;

        b.top = b.y - b.radius;
        b.bottom = b.y + b.radius;
        b.left = b.x - b.radius;
        b.right = b.x + b.radius;

        return p.left < b.right && p.top < b.bottom && p.right > b.left && p.bottom > b.top;
    }

    function render() {
        // Clear canvas
        drawRect(0, 0, canvas.width, canvas.height, "#000");

        drawNet();
        drawRect(user.x, user.y, user.width, user.height, user.color);
        drawRect(com.x, com.y, com.width, com.height, com.color);
        drawArc(ball.x, ball.y, ball.radius, ball.color);
    }

    function gameLoop() {
        if (!isGameRunning) return;
        update();
        render();
        animationId = requestAnimationFrame(gameLoop);
    }

    // Controls
    canvas.addEventListener("mousemove", getMousePos);

    function getMousePos(evt) {
        let rect = canvas.getBoundingClientRect();
        user.y = evt.clientY - rect.top - user.height / 2;
    }

    // Keyboard controls
    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowUp') {
            user.y -= 20;
        } else if (e.key === 'ArrowDown') {
            user.y += 20;
        }
        // Keep paddle in bounds
        if (user.y < 0) user.y = 0;
        if (user.y + user.height > canvas.height) user.y = canvas.height - user.height;
    });

    startBtn.addEventListener('click', () => {
        startOverlay.classList.add('hidden');
        isGameRunning = true;
        user.score = 0;
        com.score = 0;
        playerScoreEl.innerText = '0';
        cpuScoreEl.innerText = '0';
        resetBall();
        gameLoop();
    });

    restartBtn.addEventListener('click', () => {
        gameOverOverlay.classList.add('hidden');
        isGameRunning = true;
        user.score = 0;
        com.score = 0;
        playerScoreEl.innerText = '0';
        cpuScoreEl.innerText = '0';
        resetBall();
        gameLoop();
    });

    // Initial render
    render();
});
