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

    // --- Wordle Logic ---
    const tileContainer = document.getElementById('tile-container');
    const keyboardContainer = document.getElementById('keyboard-container');
    const messageContainer = document.getElementById('message-container');
    const gameOverOverlay = document.getElementById('game-over-overlay');
    const gameResultEl = document.getElementById('game-result');
    const secretWordEl = document.getElementById('secret-word');
    const restartBtn = document.getElementById('restart-btn');

    // Simple word list
    const WORDS = [
        "APPLE", "BEACH", "BRAIN", "BREAD", "BRUSH", "CHAIR", "CHEST", "CHORD",
        "CLICK", "CLOCK", "CLOUD", "DANCE", "DIARY", "DRINK", "DRIVE", "EARTH",
        "FEAST", "FIELD", "FRUIT", "GLASS", "GRAPE", "GREEN", "GHOST", "HEART",
        "HOUSE", "JUICE", "LIGHT", "LEMON", "MELON", "MONEY", "MUSIC", "NIGHT",
        "OCEAN", "PARTY", "PIZZA", "PHONE", "PILOT", "PLANE", "PLANT", "PLATE",
        "POWER", "RADIO", "RIVER", "ROBOT", "SHIRT", "SHOES", "SMILE", "SNAKE",
        "SPACE", "SPOON", "STORM", "TABLE", "TOAST", "TIGER", "TOOTH", "TOUCH",
        "TOWEL", "TRAIN", "TRUCK", "VOICE", "WATER", "WATCH", "WHALE", "WORLD",
        "WRITE", "YOUTH", "ZEBRA", "SMART", "START", "STARE", "STORE", "STONE"
    ];

    const rows = 6;
    const cols = 5;
    let currentRow = 0;
    let currentTile = 0;
    let secretWord = WORDS[Math.floor(Math.random() * WORDS.length)];
    let guessRows = [
        ["", "", "", "", ""],
        ["", "", "", "", ""],
        ["", "", "", "", ""],
        ["", "", "", "", ""],
        ["", "", "", "", ""],
        ["", "", "", "", ""]
    ];
    let isGameOver = false;

    const keys = [
        "QWERTYUIOP",
        "ASDFGHJKL",
        "ZXCVBNM"
    ];

    function initGame() {
        tileContainer.innerHTML = '';
        keyboardContainer.innerHTML = '';
        currentRow = 0;
        currentTile = 0;
        secretWord = WORDS[Math.floor(Math.random() * WORDS.length)];
        guessRows = Array(6).fill().map(() => Array(5).fill(""));
        isGameOver = false;
        gameOverOverlay.classList.add('hidden');
        messageContainer.innerText = '';

        // Create Grid
        guessRows.forEach((row, rowIndex) => {
            const rowElement = document.createElement('div');
            rowElement.classList.add('tile-row');
            rowElement.setAttribute('id', 'row-' + rowIndex);
            row.forEach((tile, tileIndex) => {
                const tileElement = document.createElement('div');
                tileElement.classList.add('tile');
                tileElement.setAttribute('id', 'row-' + rowIndex + '-tile-' + tileIndex);
                rowElement.appendChild(tileElement);
            });
            tileContainer.appendChild(rowElement);
        });

        // Create Keyboard
        keys.forEach((row, index) => {
            const rowElement = document.createElement('div');
            rowElement.classList.add('keyboard-row');

            if (index === 2) {
                // Enter key
                const enterKey = document.createElement('button');
                enterKey.classList.add('key', 'large');
                enterKey.innerText = 'ENTER';
                enterKey.addEventListener('click', () => handleKey('ENTER'));
                rowElement.appendChild(enterKey);
            }

            row.split('').forEach(key => {
                const keyElement = document.createElement('button');
                keyElement.classList.add('key');
                keyElement.innerText = key;
                keyElement.setAttribute('id', 'key-' + key);
                keyElement.addEventListener('click', () => handleKey(key));
                rowElement.appendChild(keyElement);
            });

            if (index === 2) {
                // Backspace key
                const bsKey = document.createElement('button');
                bsKey.classList.add('key', 'large');
                bsKey.innerHTML = '<i class="fas fa-backspace"></i>';
                bsKey.addEventListener('click', () => handleKey('BACKSPACE'));
                rowElement.appendChild(bsKey);
            }

            keyboardContainer.appendChild(rowElement);
        });
    }

    function handleKey(key) {
        if (isGameOver) return;

        if (key === 'BACKSPACE') {
            deleteLetter();
            return;
        }
        if (key === 'ENTER') {
            checkRow();
            return;
        }
        addLetter(key);
    }

    function addLetter(letter) {
        if (currentTile < 5 && currentRow < 6) {
            const tile = document.getElementById('row-' + currentRow + '-tile-' + currentTile);
            tile.innerText = letter;
            tile.setAttribute('data-state', 'active');
            guessRows[currentRow][currentTile] = letter;
            currentTile++;
        }
    }

    function deleteLetter() {
        if (currentTile > 0) {
            currentTile--;
            const tile = document.getElementById('row-' + currentRow + '-tile-' + currentTile);
            tile.innerText = '';
            tile.removeAttribute('data-state');
            guessRows[currentRow][currentTile] = '';
        }
    }

    function checkRow() {
        const guess = guessRows[currentRow].join('');
        if (currentTile < 5) {
            showMessage('Not enough letters');
            return;
        }

        // In a real app, check if word exists in dictionary here

        flipTiles();

        if (guess === secretWord) {
            isGameOver = true;
            showMessage('Magnificent!');
            setTimeout(() => showGameOver(true), 2000);
        } else {
            if (currentRow >= 5) {
                isGameOver = true;
                showMessage('Game Over');
                setTimeout(() => showGameOver(false), 2000);
            } else {
                currentRow++;
                currentTile = 0;
            }
        }
    }

    function showMessage(msg) {
        messageContainer.innerText = msg;
        setTimeout(() => messageContainer.innerText = '', 2000);
    }

    function flipTiles() {
        const rowTiles = document.getElementById('row-' + currentRow).children;
        const guess = guessRows[currentRow];
        const checkWord = secretWord;
        const guessArray = [];

        // First pass: Check for correct spots
        guess.forEach((letter, index) => {
            guessArray.push({ letter: letter, color: 'absent' });
        });

        guessArray.forEach((guessObj, index) => {
            if (guessObj.letter === secretWord[index]) {
                guessObj.color = 'correct';
                // Replace matched letter in checkWord to handle duplicates correctly
                // This logic is simplified; a robust implementation needs frequency counting
            }
        });

        // Second pass: Check for present spots (simplified)
        guessArray.forEach((guessObj, index) => {
            if (guessObj.color !== 'correct' && secretWord.includes(guessObj.letter)) {
                guessObj.color = 'present';
            }
        });

        // Apply colors with animation delay
        guessArray.forEach((guessObj, index) => {
            setTimeout(() => {
                const tile = rowTiles[index];
                tile.setAttribute('data-state', guessObj.color);

                const key = document.getElementById('key-' + guessObj.letter);
                const oldColor = key.getAttribute('data-state');

                if (guessObj.color === 'correct') {
                    key.setAttribute('data-state', 'correct');
                } else if (guessObj.color === 'present' && oldColor !== 'correct') {
                    key.setAttribute('data-state', 'present');
                } else if (guessObj.color === 'absent' && oldColor !== 'correct' && oldColor !== 'present') {
                    key.setAttribute('data-state', 'absent');
                }

                tile.classList.add('flip');
            }, 200 * index);
        });
    }

    function showGameOver(win) {
        gameResultEl.innerText = win ? 'You Won!' : 'Game Over';
        secretWordEl.innerText = secretWord;
        gameOverOverlay.classList.remove('hidden');
    }

    document.addEventListener('keydown', (e) => {
        if (isGameOver) return;
        const key = e.key.toUpperCase();
        if (key === 'ENTER' || key === 'BACKSPACE') {
            handleKey(key);
        } else if (key.length === 1 && key >= 'A' && key <= 'Z') {
            handleKey(key);
        }
    });

    restartBtn.addEventListener('click', initGame);

    initGame();
});
