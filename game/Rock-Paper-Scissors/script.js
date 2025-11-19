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

    // --- RPS Logic ---
    const playerHand = document.getElementById('player-hand');
    const cpuHand = document.getElementById('cpu-hand');
    const resultText = document.getElementById('result-text');
    const optionBtns = document.querySelectorAll('.option-btn');
    const playerScoreEl = document.getElementById('player-score');
    const cpuScoreEl = document.getElementById('cpu-score');

    let playerScore = 0;
    let cpuScore = 0;
    let isPlaying = false;

    const choices = ['rock', 'paper', 'scissors'];
    const icons = {
        rock: 'fa-hand-rock',
        paper: 'fa-hand-paper',
        scissors: 'fa-hand-scissors'
    };

    optionBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            if (isPlaying) return;
            const playerChoice = btn.dataset.choice;
            playRound(playerChoice);
        });
    });

    function playRound(playerChoice) {
        isPlaying = true;
        resultText.innerText = "Wait...";

        // Reset hands to rock for animation
        playerHand.className = `fas ${icons.rock}`;
        cpuHand.className = `fas ${icons.rock}`;

        // Add shake animation
        playerHand.parentElement.classList.add('shake-player');
        cpuHand.parentElement.classList.add('shake-cpu');

        setTimeout(() => {
            // Remove shake
            playerHand.parentElement.classList.remove('shake-player');
            cpuHand.parentElement.classList.remove('shake-cpu');

            // Generate CPU choice
            const cpuChoice = choices[Math.floor(Math.random() * 3)];

            // Update icons
            playerHand.className = `fas ${icons[playerChoice]}`;
            cpuHand.className = `fas ${icons[cpuChoice]}`;

            // Determine winner
            const winner = getWinner(playerChoice, cpuChoice);
            updateScore(winner);

            isPlaying = false;
        }, 500);
    }

    function getWinner(p, c) {
        if (p === c) {
            resultText.innerText = "It's a Draw!";
            return 'draw';
        }
        if (
            (p === 'rock' && c === 'scissors') ||
            (p === 'paper' && c === 'rock') ||
            (p === 'scissors' && c === 'paper')
        ) {
            resultText.innerText = "You Win!";
            return 'player';
        } else {
            resultText.innerText = "CPU Wins!";
            return 'cpu';
        }
    }

    function updateScore(winner) {
        if (winner === 'player') {
            playerScore++;
            playerScoreEl.innerText = playerScore;
        } else if (winner === 'cpu') {
            cpuScore++;
            cpuScoreEl.innerText = cpuScore;
        }
    }
});
