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

    // --- Simon Says Logic ---
    const buttons = {
        green: document.getElementById('green'),
        red: document.getElementById('red'),
        yellow: document.getElementById('yellow'),
        blue: document.getElementById('blue')
    };

    const startBtn = document.getElementById('start-btn');
    const statusText = document.getElementById('status-text');
    const levelEl = document.getElementById('level');
    const highScoreEl = document.getElementById('high-score');
    const gameOverOverlay = document.getElementById('game-over-overlay');
    const finalLevelEl = document.getElementById('final-level');
    const restartBtn = document.getElementById('restart-btn');

    const colors = ['green', 'red', 'yellow', 'blue'];
    let sequence = [];
    let playerSequence = [];
    let level = 0;
    let highScore = localStorage.getItem('simon_highscore') || 0;
    let isGameActive = false;
    let isPlayerTurn = false;

    highScoreEl.innerText = highScore;

    // Sound frequencies
    const sounds = {
        green: 261.63, // C4
        red: 329.63,   // E4
        yellow: 392.00, // G4
        blue: 523.25   // C5
    };

    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

    function playSound(color) {
        if (audioCtx.state === 'suspended') audioCtx.resume();

        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        oscillator.type = 'sine';
        oscillator.frequency.value = sounds[color];
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        oscillator.start();
        gainNode.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + 0.5);
        setTimeout(() => oscillator.stop(), 500);
    }

    function activateButton(color) {
        const btn = buttons[color];
        btn.classList.add('active');
        playSound(color);
        setTimeout(() => btn.classList.remove('active'), 300);
    }

    function nextRound() {
        level++;
        levelEl.innerText = level;
        playerSequence = [];
        sequence.push(colors[Math.floor(Math.random() * 4)]);
        playSequence();
    }

    function playSequence() {
        isPlayerTurn = false;
        statusText.innerText = "Watch...";
        let i = 0;
        const interval = setInterval(() => {
            activateButton(sequence[i]);
            i++;
            if (i >= sequence.length) {
                clearInterval(interval);
                setTimeout(() => {
                    isPlayerTurn = true;
                    statusText.innerText = "Your Turn!";
                }, 500);
            }
        }, 800); // Speed of sequence
    }

    function handleInput(color) {
        if (!isPlayerTurn || !isGameActive) return;

        activateButton(color);
        playerSequence.push(color);

        // Check correctness
        if (playerSequence[playerSequence.length - 1] !== sequence[playerSequence.length - 1]) {
            gameOver();
            return;
        }

        // Check completion
        if (playerSequence.length === sequence.length) {
            isPlayerTurn = false;
            statusText.innerText = "Good!";
            setTimeout(nextRound, 1000);
        }
    }

    function gameOver() {
        isGameActive = false;
        finalLevelEl.innerText = level;
        if (level > highScore) {
            highScore = level;
            localStorage.setItem('simon_highscore', highScore);
            highScoreEl.innerText = highScore;
        }
        gameOverOverlay.classList.remove('hidden');
    }

    function startGame() {
        sequence = [];
        level = 0;
        isGameActive = true;
        gameOverOverlay.classList.add('hidden');
        startBtn.style.display = 'none'; // Hide start button during game
        nextRound();
    }

    // Event Listeners
    Object.keys(buttons).forEach(color => {
        buttons[color].addEventListener('click', () => handleInput(color));
    });

    startBtn.addEventListener('click', startGame);
    restartBtn.addEventListener('click', startGame);
});
