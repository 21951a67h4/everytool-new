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

    // --- Memory Match Logic ---
    const grid = document.getElementById('memory-grid');
    const movesEl = document.getElementById('moves');
    const timeEl = document.getElementById('time');
    const restartBtn = document.getElementById('restart-btn');
    const playAgainBtn = document.getElementById('play-again-btn');
    const gameOverOverlay = document.getElementById('game-over-overlay');
    const finalMovesEl = document.getElementById('final-moves');
    const finalTimeEl = document.getElementById('final-time');

    const icons = [
        'fa-ghost', 'fa-heart', 'fa-star', 'fa-moon',
        'fa-cloud', 'fa-bolt', 'fa-fire', 'fa-snowflake'
    ];

    // Duplicate icons to create pairs
    let cards = [...icons, ...icons];

    let flippedCards = [];
    let matchedPairs = 0;
    let moves = 0;
    let timer = null;
    let seconds = 0;
    let isGameActive = false;
    let isLocked = false;

    function shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    function formatTime(secs) {
        const mins = Math.floor(secs / 60);
        const remainingSecs = secs % 60;
        return `${mins}:${remainingSecs.toString().padStart(2, '0')}`;
    }

    function startTimer() {
        if (timer) clearInterval(timer);
        seconds = 0;
        timeEl.innerText = '0:00';
        timer = setInterval(() => {
            seconds++;
            timeEl.innerText = formatTime(seconds);
        }, 1000);
    }

    function createCard(icon) {
        const card = document.createElement('div');
        card.classList.add('card');
        card.dataset.icon = icon;

        card.innerHTML = `
            <div class="card-face card-front">
                <i class="fas fa-question"></i>
            </div>
            <div class="card-face card-back">
                <i class="fas ${icon}"></i>
            </div>
        `;

        card.addEventListener('click', flipCard);
        return card;
    }

    function flipCard() {
        if (isLocked || !isGameActive) return;
        if (this === flippedCards[0]) return; // Can't click same card twice
        if (this.classList.contains('matched')) return;

        this.classList.add('flipped');
        flippedCards.push(this);

        if (flippedCards.length === 2) {
            moves++;
            movesEl.innerText = moves;
            checkForMatch();
        }
    }

    function checkForMatch() {
        isLocked = true;
        const [card1, card2] = flippedCards;
        const match = card1.dataset.icon === card2.dataset.icon;

        if (match) {
            disableCards();
        } else {
            unflipCards();
        }
    }

    function disableCards() {
        flippedCards.forEach(card => {
            card.classList.add('matched');
        });
        matchedPairs++;
        flippedCards = [];
        isLocked = false;

        if (matchedPairs === icons.length) {
            gameOver();
        }
    }

    function unflipCards() {
        setTimeout(() => {
            flippedCards.forEach(card => {
                card.classList.remove('flipped');
            });
            flippedCards = [];
            isLocked = false;
        }, 1000);
    }

    function gameOver() {
        clearInterval(timer);
        isGameActive = false;
        finalMovesEl.innerText = moves;
        finalTimeEl.innerText = formatTime(seconds);
        setTimeout(() => {
            gameOverOverlay.classList.remove('hidden');
        }, 500);
    }

    function initGame() {
        grid.innerHTML = '';
        cards = shuffle([...icons, ...icons]);
        cards.forEach(icon => {
            grid.appendChild(createCard(icon));
        });

        moves = 0;
        matchedPairs = 0;
        flippedCards = [];
        movesEl.innerText = '0';
        isGameActive = true;
        isLocked = false;
        gameOverOverlay.classList.add('hidden');
        startTimer();
    }

    restartBtn.addEventListener('click', initGame);
    playAgainBtn.addEventListener('click', initGame);

    // Start game on load
    initGame();
});
