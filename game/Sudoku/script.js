// Modern Sudoku logic: enhanced validation, hint, input, and UI

document.addEventListener('DOMContentLoaded', () => {
    // Back + theme + year (template behaviors)
    const backBtn = document.getElementById('back-btn');
    backBtn?.addEventListener('click', () => {
      if (document.referrer && document.referrer.indexOf(location.host) !== -1) history.back();
      else window.location.href = '../index.html';
    });
    const yearSpan = document.getElementById('copyright-year');
    if (yearSpan) yearSpan.textContent = new Date().getFullYear().toString() + ' © ';
  
    // Theme toggle logic with improved error handling
    const root = document.documentElement;
    const getStoredTheme = () => {
      try {
        return localStorage.getItem('et-theme');
      } catch (e) {
        console.warn('Could not access localStorage for theme:', e);
        return null;
      }
    };
    
    const setStoredTheme = (theme) => {
      try {
        localStorage.setItem('et-theme', theme);
      } catch (e) {
        console.warn('Could not save theme to localStorage:', e);
      }
    };
    
    const storedTheme = getStoredTheme();
    if (storedTheme === 'dark') {
      root.setAttribute('data-theme', 'dark');
    }
    
    const themeToggle = document.getElementById('theme-toggle');
    const themeSwitch = themeToggle?.closest('.theme-switch');
    if (themeToggle && themeSwitch) {
      const isDark = root.getAttribute('data-theme') === 'dark';
      themeToggle.checked = isDark;
      themeSwitch.setAttribute('aria-checked', String(isDark));
      
      const iconElement = themeSwitch.querySelector('.switch-thumb i');
      if (iconElement) {
        iconElement.className = isDark ? 'fas fa-sun' : 'fas fa-moon';
      }
      
      themeToggle.addEventListener('change', () => {
        const checked = themeToggle.checked;
        themeSwitch.setAttribute('aria-checked', String(checked));
        
        if (checked) {
          root.setAttribute('data-theme', 'dark');
          setStoredTheme('dark');
          if (iconElement) iconElement.className = 'fas fa-sun';
        } else {
          root.removeAttribute('data-theme');
          setStoredTheme('light');
          if (iconElement) iconElement.className = 'fas fa-moon';
        }
      });
    }
  
    // Elements
    const boardEl = document.getElementById('board');
    const difficultyEl = document.getElementById('difficulty');
    const newBtn = document.getElementById('new-puzzle');
    const resetBtn = document.getElementById('reset');
    const hintBtn = document.getElementById('hint');
    const printBtn = document.getElementById('print');
    const timerEl = document.getElementById('timer');
  
    // State
    let timer = null, seconds = 0,
        solution = null,   // solved grid for hints
        givens = new Set(), // fixed cells
        remainingHints = 0;
  
    // Timer
    function formatTime(s) { const m = Math.floor(s / 60), r = s % 60; return String(m).padStart(2, '0') + ':' + String(r).padStart(2, '0'); }
    function startTimer() {
      clearInterval(timer);
      seconds = 0; timerEl.textContent = '00:00';
      timer = setInterval(() => { seconds++; timerEl.textContent = formatTime(seconds); }, 1000);
    }
  
    // Board creation
    function createBoard() {
      boardEl.innerHTML = '';
      for (let r = 0; r < 9; r++) for (let c = 0; c < 9; c++) {
        const cell = document.createElement('div');
        cell.className = 'cell';
        if ((c === 2 || c === 5)) cell.classList.add('block-right');
        if ((r === 2 || r === 5)) cell.classList.add('block-bottom');
        const input = document.createElement('input');
        input.type = 'number'; input.min = '1'; input.max = '9'; input.inputMode = 'numeric';
        input.pattern = '[1-9]';
        input.addEventListener('focus', () => selectCell(cell));
        input.addEventListener('input', () => handleInput(r, c, input));
        input.addEventListener('keydown', (e) => {
          if (['Backspace', 'Delete', '0'].includes(e.key)) {
            input.value = ''; validate();
          } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || 
                     e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
            e.preventDefault();
            navigateCell(r, c, e.key);
          }
        });
        cell.appendChild(input); boardEl.appendChild(cell);
      }
    }
  
    function setPuzzle(puz) {
      givens = new Set();
      const inputs = boardEl.querySelectorAll('.cell input');
      inputs.forEach((inp, idx) => {
        const r = Math.floor(idx / 9), c = idx % 9, v = puz[r][c];
        inp.value = v ? String(v) : ''; inp.disabled = !!v;
        inp.parentElement.classList.toggle('given', !!v);
        if (v) givens.add(r + ',' + c);
      });
      solution = solve(copyGrid(puz));
      validate(); startTimer();
    }
  
    function getGrid() {
      const cells = boardEl.querySelectorAll('.cell input');
      const g = Array.from({ length: 9 }, () => Array(9).fill(0));
      cells.forEach((inp, i) => { const r = Math.floor(i / 9), c = i % 9; g[r][c] = Number(inp.value) || 0; });
      return g;
    }
    function copyGrid(g) { return g.map(row => row.slice()); }
  
    function navigateCell(r, c, direction) {
      let newR = r, newC = c;
      
      switch (direction) {
        case 'ArrowUp': newR = Math.max(0, r - 1); break;
        case 'ArrowDown': newR = Math.min(8, r + 1); break;
        case 'ArrowLeft': newC = Math.max(0, c - 1); break;
        case 'ArrowRight': newC = Math.min(8, c + 1); break;
      }
      
      const cells = boardEl.querySelectorAll('.cell');
      const targetIdx = newR * 9 + newC;
      const targetCell = cells[targetIdx];
      const targetInput = targetCell?.querySelector('input');
      
      if (targetInput && !targetInput.disabled) {
        targetInput.focus();
        selectCell(targetCell);
      }
    }

    function selectCell(cell) {
      const cells = boardEl.querySelectorAll('.cell');
      cells.forEach(c => c.classList.remove('selected', 'rc', 'same'));
      cell.classList.add('selected');
      const idx = Array.from(cells).indexOf(cell);
      const r = Math.floor(idx / 9), c = idx % 9;
      for (let i = 0; i < 9; i++) {
        cells[r * 9 + i].classList.add('rc');
        cells[i * 9 + c].classList.add('rc');
      }
      const val = cell.querySelector('input')?.value;
      if (val) {
        cells.forEach(ci => {
          if (ci.querySelector('input')?.value === val) ci.classList.add('same');
        });
      }
    }
  
    function handleInput(r, c, input) {
      // Single digit only, block non 1-9
      let v = input.value.replace(/[^1-9]/g, '');
      if (v.length > 1) v = v.at(-1);
      input.value = v;
      validate();
      checkWin();
    }
  
    function validate() {
      const cells = boardEl.querySelectorAll('.cell');
      cells.forEach(c => c.classList.remove('conflict'));
      const grid = getGrid();
  
      // Rows
      for (let r = 0; r < 9; r++)
        markConflicts(indexesOfConflicts(grid[r]).map(ci => [r, ci]));
  
      // Columns
      for (let c = 0; c < 9; c++) {
        const col = Array.from({ length: 9 }, (_, r) => grid[r][c]);
        markConflicts(indexesOfConflicts(col).map(ri => [ri, c]));
      }
  
      // Boxes
      for (let br = 0; br < 3; br++) for (let bc = 0; bc < 3; bc++) {
        const vals = [], idxs = [];
        for (let r = 0; r < 3; r++)
          for (let c = 0; c < 3; c++) {
            const rr = br * 3 + r, cc = bc * 3 + c;
            vals.push(grid[rr][cc]); idxs.push([rr, cc]);
          }
        const bad = indexesOfConflicts(vals).map(i => idxs[i]);
        markConflicts(bad);
      }
    }
  
    function indexesOfConflicts(arr) {
      const seen = new Map(), bad = new Set();
      arr.forEach((v, i) => {
        if (!v) return;
        if (seen.has(v)) { bad.add(i); bad.add(seen.get(v)); }
        else seen.set(v, i);
      });
      return Array.from(bad.values());
    }
  
    function markConflicts(coords) {
      const cells = boardEl.querySelectorAll('.cell');
      coords.forEach(([r, c]) => { const idx = r * 9 + c; cells[idx].classList.add('conflict'); });
    }
  
    // Sudoku solver/backtracker (for hint, not for game generation).
    function findEmpty(g) { for (let r = 0; r < 9; r++) for (let c = 0; c < 9; c++) if (!g[r][c]) return [r, c]; return null; }
    function validAt(g, r, c, v) {
      for (let i = 0; i < 9; i++) if (g[r][i] === v || g[i][c] === v) return false;
      const br = Math.floor(r / 3) * 3, bc = Math.floor(c / 3) * 3;
      for (let rr = 0; rr < 3; rr++) for (let cc = 0; cc < 3; cc++)
        if (g[br + rr][bc + cc] === v) return false;
      return true;
    }
    function solve(g) {
      const empty = findEmpty(g); if (!empty) return g;
      const [r, c] = empty;
      for (let v = 1; v <= 9; v++) {
        if (validAt(g, r, c, v)) {
          g[r][c] = v;
          const res = solve(g);
          if (res) return res;
          g[r][c] = 0;
        }
      }
      return null;
    }
  
    // Board generator: base pattern, shuffle and carve.
    function generateSolved() {
      const N = 9, box = 3;
      const base = Array.from({ length: N }, (_, r) =>
        Array.from({ length: N }, (_, c) => ((r * box + Math.floor(r / box) + c) % N) + 1)
      );
      const digits = [1, 2, 3, 4, 5, 6, 7, 8, 9]; shuffle(digits);
      let g = base.map(row => row.map(v => digits[v - 1]));
      const bands = [0, 1, 2]; shuffle(bands); g = reorderRowBands(g, bands);
      for (let b = 0; b < 3; b++) {
        const start = b * 3; const order = [0, 1, 2]; shuffle(order);
        const copy = g.slice(start, start + 3);
        for (let i = 0; i < 3; i++) g[start + i] = copy[order[i]];
      }
      const stacks = [0, 1, 2]; shuffle(stacks); g = reorderColStacks(g, stacks);
      for (let s = 0; s < 3; s++) {
        const start = s * 3; const order = [0, 1, 2]; shuffle(order);
        for (let r = 0; r < 9; r++) {
          const row = g[r].slice(start, start + 3);
          for (let i = 0; i < 3; i++) g[r][start + i] = row[order[i]];
        }
      }
      return g;
    }
  
    function carveFromSolution(sol, diff) {
      const N = 9;
      const puzzle = copyGrid(sol);
      const ratios = { easy: .45, medium: .55, hard: .65 };
      const removeRatio = ratios[diff] ?? .5;
      const total = Math.floor(N * N * removeRatio);
      const pos = Array.from({ length: N * N }, (_, i) => i);
      shuffle(pos);
      for (let k = 0; k < total; k++) {
        const idx = pos[k]; const r = Math.floor(idx / N), c = idx % N;
        puzzle[r][c] = 0;
      }
      return puzzle;
    }
    function shuffle(arr) {
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    }
    function reorderRowBands(g, order) {
      const out = [];
      for (let i = 0; i < 3; i++) {
        const src = order[i]; for (let r = 0; r < 3; r++) out.push(g[src * 3 + r].slice());
      }
      return out;
    }
    function reorderColStacks(g, order) {
      const out = Array.from({ length: 9 }, () => Array(9).fill(0));
      for (let r = 0; r < 9; r++) {
        const row = [];
        for (let i = 0; i < 3; i++) {
          const src = order[i];
          row.push(...g[r].slice(src * 3, src * 3 + 3));
        }
        out[r] = row;
      }
      return out;
    }
  
    function newPuzzle() {
      const diff = difficultyEl.value || 'medium';
      const solved = generateSolved();
      const puzzle = carveFromSolution(solved, diff);
      createBoard(); setPuzzle(puzzle);
      solution = solved;
      remainingHints = diff === 'easy' ? 3 : diff === 'medium' ? 5 : 8;
      updateHintUI();
    }
  
    function resetPuzzle() {
      // Only reset cells that are not given
      const grid = getGrid();
      const givenGrid = grid.map((row, r) => row.map((v, c) => givens.has(r + ',' + c) ? v : 0));
      setPuzzle(givenGrid);
      remainingHints = difficultyEl.value === 'easy' ? 3 : difficultyEl.value === 'medium' ? 5 : 8;
      updateHintUI();
    }
  
    function applyHint() {
      if (!solution || remainingHints <= 0) return;
      const grid = getGrid();
      // Find first empty and not-given cell
      for (let r = 0; r < 9; r++) for (let c = 0; c < 9; c++) {
        if (!grid[r][c] && !givens.has(r + ',' + c)) {
          const idx = r * 9 + c;
          const inp = boardEl.querySelectorAll('.cell input')[idx];
          inp.value = String(solution[r][c]);
          inp.classList.add('hinted');
          setTimeout(() => inp.classList.remove('hinted'), 1300);
          validate();
          remainingHints--; updateHintUI();
          checkWin();
          return;
        }
      }
    }
  
    function printBoard() { window.print(); }
    function updateHintUI() {
      if (!hintBtn) return;
      
      const hintIcon = hintBtn.querySelector('i');
      const hintText = hintBtn.querySelector('span') || document.createElement('span');
      
      if (!hintBtn.querySelector('span')) {
        hintBtn.innerHTML = '';
        hintBtn.appendChild(hintIcon);
        hintBtn.appendChild(hintText);
      }
      
      hintText.textContent = ` (${remainingHints})`;
      hintBtn.disabled = remainingHints <= 0;
      
      if (remainingHints <= 0) {
        hintBtn.title = "No hints left!";
        hintBtn.classList.add('disabled');
      } else {
        hintBtn.removeAttribute('title');
        hintBtn.classList.remove('disabled');
      }
    }
  
    function checkWin() {
      // If all cells filled and no conflicts, show victory
      const grid = getGrid();
      if (grid.every(row => row.every(cell => cell))) {
        const anyConflicts = Array.from(boardEl.querySelectorAll('.cell.conflict')).length > 0;
        if (!anyConflicts) {
          setTimeout(() => {
            alert(`🎉 Congratulations! You solved the puzzle in ${formatTime(seconds)}!`);
            newPuzzle();
          }, 150);
        }
      }
    }
  
    // Event listeners
    newBtn?.addEventListener('click', newPuzzle);
    resetBtn?.addEventListener('click', resetPuzzle);
    hintBtn?.addEventListener('click', applyHint);
    printBtn?.addEventListener('click', printBoard);
    difficultyEl?.addEventListener('change', newPuzzle);
  
    // Init
    newPuzzle();
  });
  