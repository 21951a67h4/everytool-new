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

    // --- Whac-A-Mole Logic ---
    const holes = document.querySelectorAll('.hole');
    const scoreBoard = document.getElementById('score');
    const timeLeftBoard = document.getElementById('time-left');
    const moles = document.querySelectorAll('.mole');
    const startBtn = document.getElementById('start-btn');
    const restartBtn = document.getElementById('restart-btn');
    const startOverlay = document.getElementById('start-overlay');
    const gameOverOverlay = document.getElementById('game-over-overlay');
    const finalScoreEl = document.getElementById('final-score');

    let lastHole;
    let timeUp = false;
    let score = 0;
    let timeLeft = 30;
    let timerId;

    function randomTime(min, max) {
        return Math.round(Math.random() * (max - min) + min);
    }

    function randomHole(holes) {
        const idx = Math.floor(Math.random() * holes.length);
        const hole = holes[idx];
        if (hole === lastHole) {
            return randomHole(holes);
        }
        lastHole = hole;
        return hole;
    }

    function peep() {
        const time = randomTime(200, 1000);
        const hole = randomHole(holes);
        hole.classList.add('up');
        setTimeout(() => {
            hole.classList.remove('up');
            if (!timeUp) peep();
        }, time);
    }

    function startGame() {
        scoreBoard.textContent = 0;
        timeUp = false;
        score = 0;
        timeLeft = 30;
        timeLeftBoard.textContent = timeLeft;
        startOverlay.classList.add('hidden');
        gameOverOverlay.classList.add('hidden');
        peep();

        timerId = setInterval(() => {
            timeLeft--;
            timeLeftBoard.textContent = timeLeft;
            if (timeLeft <= 0) {
                clearInterval(timerId);
                timeUp = true;
                gameOver();
            }
        }, 1000);
    }

    function gameOver() {
        finalScoreEl.textContent = score;
        gameOverOverlay.classList.remove('hidden');
    }

    function bonk(e) {
        if (!e.isTrusted) return; // cheater!
        score++;
        this.parentNode.classList.remove('up');
        scoreBoard.textContent = score;
    }

    moles.forEach(mole => mole.addEventListener('click', bonk));
    startBtn.addEventListener('click', startGame);
    restartBtn.addEventListener('click', startGame);
});
