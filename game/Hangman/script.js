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

    // --- Hangman Logic ---
    const wordDisplay = document.getElementById('word-display');
    const keyboard = document.getElementById('keyboard');
    const gameOverOverlay = document.getElementById('game-over-overlay');
    const gameResultEl = document.getElementById('game-result');
    const finalWordEl = document.getElementById('final-word');
    const restartBtn = document.getElementById('restart-btn');
    const bodyParts = document.querySelectorAll('.body-part');

    const WORDS = [
        "JAVASCRIPT", "PYTHON", "BROWSER", "DEVELOPER", "INTERFACE",
        "VARIABLE", "FUNCTION", "OBJECT", "ARRAY", "STRING",
        "BOOLEAN", "NUMBER", "ELEMENT", "DOCUMENT", "WINDOW",
        "SERVER", "CLIENT", "DATABASE", "NETWORK", "SECURITY"
    ];

    let selectedWord = "";
    let guessedLetters = [];
    let wrongGuesses = 0;
    const MAX_WRONG = 6;

    function initGame() {
        selectedWord = WORDS[Math.floor(Math.random() * WORDS.length)];
        guessedLetters = [];
        wrongGuesses = 0;

        // Reset UI
        gameOverOverlay.classList.add('hidden');
        bodyParts.forEach(part => part.classList.add('hidden-part'));
        renderWord();
        renderKeyboard();
    }

    function renderWord() {
        wordDisplay.innerHTML = selectedWord
            .split('')
            .map(letter => `
                <span class="letter-slot">
                    ${guessedLetters.includes(letter) ? letter : '&nbsp;'}
                </span>
            `)
            .join('');

        const innerWord = wordDisplay.innerText.replace(/\s/g, ''); // Remove non-breaking spaces
        // Check win
        const isWon = selectedWord.split('').every(l => guessedLetters.includes(l));
        if (isWon) {
            gameOver(true);
        }
    }

    function renderKeyboard() {
        keyboard.innerHTML = '';
        for (let i = 65; i <= 90; i++) {
            const letter = String.fromCharCode(i);
            const btn = document.createElement('button');
            btn.classList.add('key-btn');
            btn.innerText = letter;
            btn.disabled = guessedLetters.includes(letter);
            btn.addEventListener('click', () => handleGuess(letter));
            keyboard.appendChild(btn);
        }
    }

    function handleGuess(letter) {
        if (guessedLetters.includes(letter)) return;

        guessedLetters.push(letter);

        if (!selectedWord.includes(letter)) {
            wrongGuesses++;
            updateFigure();
        }

        renderWord();
        renderKeyboard();

        if (wrongGuesses >= MAX_WRONG) {
            gameOver(false);
        }
    }

    function updateFigure() {
        const parts = ['head', 'body', 'arm-l', 'arm-r', 'leg-l', 'leg-r'];
        if (wrongGuesses > 0 && wrongGuesses <= parts.length) {
            document.getElementById(parts[wrongGuesses - 1]).classList.remove('hidden-part');
        }
    }

    function gameOver(win) {
        gameResultEl.innerText = win ? "You Won!" : "Game Over";
        finalWordEl.innerText = selectedWord;
        gameOverOverlay.classList.remove('hidden');
    }

    restartBtn.addEventListener('click', initGame);

    initGame();
});
