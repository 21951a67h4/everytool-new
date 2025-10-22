// Import shared behaviors from template-like approach
document.addEventListener('DOMContentLoaded', () => {
    // Back button
    const backBtn = document.getElementById('back-btn');
    backBtn?.addEventListener('click', () => {
        if (document.referrer && document.referrer.indexOf(location.host) !== -1) {
            history.back();
        } else {
            window.location.href = '../index.html';
        }
    });

    // Dynamic year
    const yearSpan = document.getElementById('copyright-year');
    if (yearSpan) yearSpan.textContent = new Date().getFullYear().toString() + ' © ';

    // Theme init
    const root = document.documentElement;
    try {
        const saved = localStorage.getItem('et-theme');
        if (saved === 'dark') root.setAttribute('data-theme', 'dark');
    } catch (e) {}

    // Theme switch
    const themeToggle = document.getElementById('theme-toggle');
    const themeSwitch = themeToggle?.closest('.theme-switch');
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

    // Chess implementation
    const boardEl = document.getElementById('board');
    const turnIndicator = document.getElementById('turn-indicator');
    const moveCounterEl = document.getElementById('move-counter');
    const historyList = document.getElementById('history-list');
    const undoBtn = document.getElementById('undo');
    const resetBtn = document.getElementById('reset');
    const newGameBtn = document.getElementById('new-game');
    const vsComputerCheckbox = document.getElementById('vs-computer');
    const difficultySelect = document.getElementById('difficulty');
    const winsEl = document.getElementById('score-wins');
    const lossesEl = document.getElementById('score-losses');
    const drawsEl = document.getElementById('score-draws');
    const celebrateEl = document.getElementById('celebrate');
    const scoreWhiteEl = document.getElementById('score-white');
    const scoreBlackEl = document.getElementById('score-black');
    const rulesModal = document.getElementById('rules-modal');
    const rulesAccept = document.getElementById('rules-accept');
    const promotionModal = document.getElementById('promotion-modal');
    const promotionButtons = document.querySelectorAll('.promo');

    const PIECES = {
        wK: '♔', wQ: '♕', wR: '♖', wB: '♗', wN: '♘', wP: '♙',
        bK: '♚', bQ: '♛', bR: '♜', bB: '♝', bN: '♞', bP: '♟'
    };

    const files = ['a','b','c','d','e','f','g','h'];
    const ranks = [8,7,6,5,4,3,2,1];

    let board = [];
    let selected = null; // {r,c}
    let turn = 'w';
    let moveCounter = 0;
    let history = [];
    let lastMove = null; // {from:{r,c}, to:{r,c}}
    let gameOver = false;
    let scoreWhite = 0;
    let scoreBlack = 0;
    let canInteract = false; // locked until rules accepted
    let canPromote = null; // {color, to:{r,c}}
    let epTarget = null; // en-passant target square like {r,c}
    let castling = { w: {K:true, Q:true}, b: {K:true, Q:true} };
    let halfmoveClock = 0; // for 50-move rule
    const positionHistory = new Map(); // for threefold repetition

    function resetBoard() {
        board = [
            ['bR','bN','bB','bQ','bK','bB','bN','bR'],
            ['bP','bP','bP','bP','bP','bP','bP','bP'],
            [null,null,null,null,null,null,null,null],
            [null,null,null,null,null,null,null,null],
            [null,null,null,null,null,null,null,null],
            [null,null,null,null,null,null,null,null],
            ['wP','wP','wP','wP','wP','wP','wP','wP'],
            ['wR','wN','wB','wQ','wK','wB','wN','wR']
        ];
        selected = null;
        turn = 'w';
        moveCounter = 0;
        history = [];
        lastMove = null;
        gameOver = false;
        updateUI();
    }

    function showRulesModal() {
        if (rulesModal) { rulesModal.style.display = 'flex'; canInteract = false; }
    }
    function hideRulesModal() {
        if (rulesModal) { rulesModal.style.display = 'none'; canInteract = true; }
    }

    function posToAlg(r,c) {
        return files[c] + (8 - r);
    }

    function renderBoard() {
        if (!boardEl) return;
        boardEl.innerHTML = '';
        // Add rank labels on the left side by pseudo overlay; we render within squares
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const sq = document.createElement('div');
                sq.className = 'square ' + (((r + c) % 2 === 0) ? 'light' : 'dark');
                sq.setAttribute('role', 'gridcell');
                sq.dataset.r = String(r);
                sq.dataset.c = String(c);

                // rank/file labels on corners
                if (c === 0) {
                    const rank = document.createElement('span');
                    rank.className = 'rank-label';
                    rank.textContent = String(8 - r);
                    sq.appendChild(rank);
                }
                if (r === 7) {
                    const file = document.createElement('span');
                    file.className = 'file-label';
                    file.textContent = files[c].toUpperCase();
                    sq.appendChild(file);
                }

                const piece = board[r][c];
                if (piece) {
                    const span = document.createElement('span');
                    span.className = 'piece ' + (colorOf(piece) === 'w' ? 'white' : 'black');
                    span.textContent = PIECES[piece];
                    sq.appendChild(span);
                }

                if (lastMove && lastMove.to.r === r && lastMove.to.c === c) {
                    sq.classList.add('last-move');
                }

                sq.addEventListener('click', onSquareClick);
                boardEl.appendChild(sq);
            }
        }
    }

    function isInside(r,c) { return r >= 0 && r < 8 && c >= 0 && c < 8; }

    function colorOf(piece) { return piece ? piece.charAt(0) : null; }

    function legalMoves(r,c) {
        const piece = board[r][c];
        if (!piece) return [];
        const color = colorOf(piece);
        const kind = piece.charAt(1);
        const moves = [];
        const pushIfLegal = (nr,nc) => {
            if (!isInside(nr,nc)) return false;
            const target = board[nr][nc];
            if (!target || colorOf(target) !== color) {
                moves.push({r:nr,c:nc});
                return !target; // for sliders: continue only if empty
            }
            return false;
        };

        if (kind === 'P') {
            const dir = color === 'w' ? -1 : 1;
            const startRow = color === 'w' ? 6 : 1;
            // forward
            if (!board[r+dir]?.[c]) moves.push({r:r+dir,c});
            if (r === startRow && !board[r+dir]?.[c] && !board[r+2*dir]?.[c]) moves.push({r:r+2*dir,c});
            // captures
            for (const dc of [-1,1]) {
                const nr = r+dir, nc = c+dc;
                if (isInside(nr,nc) && board[nr][nc] && colorOf(board[nr][nc]) !== color) moves.push({r:nr,c:nc});
            }
            // en passant capture
            if (epTarget) {
                for (const dc of [-1,1]) {
                    const nr = r+dir, nc = c+dc;
                    if (epTarget.r === nr && epTarget.c === nc) moves.push({r:nr,c:nc, ep:true});
                }
            }
        }
        if (kind === 'N') {
            const deltas = [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]];
            deltas.forEach(([dr,dc]) => pushIfLegal(r+dr,c+dc));
        }
        if (kind === 'B' || kind === 'R' || kind === 'Q') {
            const dirs = [];
            if (kind !== 'B') dirs.push([1,0],[-1,0],[0,1],[0,-1]);
            if (kind !== 'R') dirs.push([1,1],[1,-1],[-1,1],[-1,-1]);
            dirs.forEach(([dr,dc]) => {
                let nr = r+dr, nc = c+dc;
                while (isInside(nr,nc)) {
                    const cont = pushIfLegal(nr,nc);
                    if (!cont) break;
                    nr += dr; nc += dc;
                }
            });
        }
        if (kind === 'K') {
            for (let dr=-1; dr<=1; dr++) for (let dc=-1; dc<=1; dc++) {
                if (dr===0 && dc===0) continue;
                pushIfLegal(r+dr,c+dc);
            }
            // Castling
            if (color === 'w' && r === 7 && c === 4) {
                if (castling.w.K && !board[7][5] && !board[7][6] && !isSquareAttacked(7,4,'b') && !isSquareAttacked(7,5,'b') && !isSquareAttacked(7,6,'b') && board[7][7]==='wR') {
                    moves.push({r:7,c:6, castle:'K'});
                }
                if (castling.w.Q && !board[7][3] && !board[7][2] && !board[7][1] && !isSquareAttacked(7,4,'b') && !isSquareAttacked(7,3,'b') && !isSquareAttacked(7,2,'b') && board[7][0]==='wR') {
                    moves.push({r:7,c:2, castle:'Q'});
                }
            }
            if (color === 'b' && r === 0 && c === 4) {
                if (castling.b.K && !board[0][5] && !board[0][6] && !isSquareAttacked(0,4,'w') && !isSquareAttacked(0,5,'w') && !isSquareAttacked(0,6,'w') && board[0][7]==='bR') {
                    moves.push({r:0,c:6, castle:'K'});
                }
                if (castling.b.Q && !board[0][3] && !board[0][2] && !board[0][1] && !isSquareAttacked(0,4,'w') && !isSquareAttacked(0,3,'w') && !isSquareAttacked(0,2,'w') && board[0][0]==='bR') {
                    moves.push({r:0,c:2, castle:'Q'});
                }
            }
        }
        // NOTE: No castling/en passant for simplicity
        // Filter out moves that leave king in check (basic validation)
        return moves.filter(m => !wouldLeaveKingInCheck(r,c,m.r,m.c,color));
    }

    function findKing(color) {
        for (let r=0;r<8;r++) for (let c=0;c<8;c++) {
            if (board[r][c] === color + 'K') return {r,c};
        }
        return null;
    }

    function squaresAttackedBy(color) {
        const atks = new Set();
        for (let r=0;r<8;r++) for (let c=0;c<8;c++) {
            const p = board[r][c];
            if (!p || colorOf(p) !== color) continue;
            const kind = p.charAt(1);
            let moves = [];
            if (kind === 'P') {
                const dir = color === 'w' ? -1 : 1;
                for (const dc of [-1,1]) {
                    const nr = r+dir, nc = c+dc;
                    if (isInside(nr,nc)) atks.add(nr+','+nc);
                }
            } else if (kind === 'N') {
                [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]].forEach(([dr,dc]) => {
                    const nr = r+dr, nc = c+dc; if (isInside(nr,nc)) atks.add(nr+','+nc);
                });
            } else if (kind === 'B' || kind === 'R' || kind === 'Q') {
                const dirs = [];
                if (kind !== 'B') dirs.push([1,0],[-1,0],[0,1],[0,-1]);
                if (kind !== 'R') dirs.push([1,1],[1,-1],[-1,1],[-1,-1]);
                dirs.forEach(([dr,dc]) => {
                    let nr=r+dr, nc=c+dc;
                    while (isInside(nr,nc)) {
                        atks.add(nr+','+nc);
                        if (board[nr][nc]) break;
                        nr+=dr; nc+=dc;
                    }
                });
            } else if (kind === 'K') {
                for (let dr=-1; dr<=1; dr++) for (let dc=-1; dc<=1; dc++) {
                    if (dr===0 && dc===0) continue; const nr=r+dr, nc=c+dc; if (isInside(nr,nc)) atks.add(nr+','+nc);
                }
            }
        }
        return atks;
    }

    function wouldLeaveKingInCheck(fr,fc,tr,tc,color) {
        const captured = board[tr][tc];
        const moving = board[fr][fc];
        // simulate en passant capture
        let epCaptured = null;
        if (moving && moving.charAt(1)==='P' && epTarget && tr===epTarget.r && tc===epTarget.c && !captured) {
            const dir = color === 'w' ? 1 : -1; // the pawn captured is behind target
            epCaptured = {r: tr+dir, c: tc};
            board[epCaptured.r][epCaptured.c] = null;
        }
        board[tr][tc] = moving; board[fr][fc] = null;
        const king = findKing(color);
        const enemy = color === 'w' ? 'b' : 'w';
        const attacked = squaresAttackedBy(enemy);
        const inCheck = king ? attacked.has(king.r+','+king.c) : false;
        board[fr][fc] = moving; board[tr][tc] = captured;
        if (epCaptured) {
            board[epCaptured.r][epCaptured.c] = enemy + 'P';
        }
        return inCheck;
    }

    function onSquareClick(e) {
        if (gameOver) return;
        if (!canInteract) return;
        const r = Number(e.currentTarget.dataset.r);
        const c = Number(e.currentTarget.dataset.c);
        const piece = board[r][c];
        const pieceColor = colorOf(piece);

        if (selected) {
            const {r:sr,c:sc} = selected;
            const moves = legalMoves(sr,sc);
            const isLegal = moves.some(m => m.r===r && m.c===c);
            if (isLegal) {
                snapshot();
                makeMove(sr,sc,r,c);
                selected = null;
                updateUI();
                if (!gameOver) maybeComputerMove();
                return;
            }
        }

        if (piece && pieceColor === turn) {
            selected = {r,c};
            updateUI();
        }
    }

    function makeMove(fr,fc,tr,tc) {
        const moving = board[fr][fc];
        const captured = board[tr][tc];
        // manage en passant capture
        if (moving && moving.charAt(1)==='P' && epTarget && tr===epTarget.r && tc===epTarget.c && !captured) {
            const enemyDir = (colorOf(moving)==='w') ? 1 : -1;
            board[tr+enemyDir][tc] = null;
        }
        board[tr][tc] = moving; board[fr][fc] = null;
        lastMove = {from:{r:fr,c:fc}, to:{r:tr,c:tc}};
        history.push(posToAlg(fr,fc) + '-' + posToAlg(tr,tc));
        moveCounter++;
        // scoring: +1 per move, capture bonus by piece value
        const values = {P:1,N:3,B:3,R:5,Q:9,K:0};
        const moverColor = colorOf(moving);
        const captureBonus = captured ? (values[captured.charAt(1)]||0) : 0;
        const delta = 1 + captureBonus;
        if (moverColor === 'w') scoreWhite += delta; else scoreBlack += delta;
        // halfmove clock
        if (moving.charAt(1)==='P' || captured) halfmoveClock = 0; else halfmoveClock++;
        // set ep target for double pawn push
        epTarget = null;
        if (moving.charAt(1)==='P' && Math.abs(tr-fr)===2) {
            epTarget = {r: (tr+fr)/2, c: tc};
        }
        // castling rook move
        if (moving.charAt(1)==='K') {
            if (moverColor==='w') { castling.w.K=false; castling.w.Q=false; }
            else { castling.b.K=false; castling.b.Q=false; }
            if (Math.abs(tc-fc)===2) {
                // castle
                if (tc===6) { // king side
                    const rr = tr, rcFrom=7, rcTo=5;
                    board[rr][rcTo] = board[rr][rcFrom];
                    board[rr][rcFrom] = null;
                } else if (tc===2) { // queen side
                    const rr = tr, rcFrom=0, rcTo=3;
                    board[rr][rcTo] = board[rr][rcFrom];
                    board[rr][rcFrom] = null;
                }
            }
        }
        // if rook moved, update castling rights
        if (moving.charAt(1)==='R') {
            if (fr===7 && fc===7) castling.w.K=false;
            if (fr===7 && fc===0) castling.w.Q=false;
            if (fr===0 && fc===7) castling.b.K=false;
            if (fr===0 && fc===0) castling.b.Q=false;
        }
        // if rook captured on corner, update rights
        if (captured==='wR') { if (tr===7 && tc===7) castling.w.K=false; if (tr===7 && tc===0) castling.w.Q=false; }
        if (captured==='bR') { if (tr===0 && tc===7) castling.b.K=false; if (tr===0 && tc===0) castling.b.Q=false; }

        // promotion check
        if (moving.charAt(1)==='P' && (tr===0 || tr===7)) {
            canPromote = {color: moverColor, to:{r:tr,c:tc}};
            showPromotion();
        }
        turn = (turn === 'w') ? 'b' : 'w';
        // check end state now that turn switched
        const result = checkGameEnd();
        if (result) concludeGame(result);
    }

    function highlightSelected() {
        if (!boardEl) return;
        const squares = boardEl.querySelectorAll('.square');
        squares.forEach(s => s.classList.remove('highlight'));
        if (selected) {
            const idx = selected.r*8 + selected.c;
            const el = squares[idx];
            el?.classList.add('highlight');
        }
    }

    function showLegalMoves() {
        if (!boardEl) return;
        const circles = boardEl.querySelectorAll('.legal');
        circles.forEach(c => c.remove());
        if (selected) {
            const moves = legalMoves(selected.r, selected.c);
            moves.forEach(m => {
                const idx = m.r*8 + m.c;
                const el = boardEl.children[idx];
                const dot = document.createElement('div');
                dot.className = 'legal';
                el.appendChild(dot);
            });
        }
    }

    function updateUI() {
        renderBoard();
        highlightSelected();
        showLegalMoves();
        turnIndicator.textContent = (turn === 'w') ? 'White' : 'Black';
        moveCounterEl.textContent = String(moveCounter);
        historyList.innerHTML = '';
        history.forEach((mv, i) => {
            const li = document.createElement('li');
            li.textContent = mv;
            historyList.appendChild(li);
        });
        if (scoreWhiteEl) scoreWhiteEl.textContent = String(scoreWhite);
        if (scoreBlackEl) scoreBlackEl.textContent = String(scoreBlack);

        // Highlight king in check + banner
        const whiteKing = findKing('w');
        const blackKing = findKing('b');
        const attackedByBlack = squaresAttackedBy('b');
        const attackedByWhite = squaresAttackedBy('w');
        let inCheckNow = false;
        if (whiteKing && attackedByBlack.has(whiteKing.r+','+whiteKing.c)) {
            const idx = whiteKing.r*8 + whiteKing.c;
            boardEl.children[idx]?.classList.add('in-check');
            if (turn === 'w') inCheckNow = true;
        }
        if (blackKing && attackedByWhite.has(blackKing.r+','+blackKing.c)) {
            const idx = blackKing.r*8 + blackKing.c;
            boardEl.children[idx]?.classList.add('in-check');
            if (turn === 'b') inCheckNow = true;
        }
        const cb = document.getElementById('check-banner');
        if (cb) {
            if (inCheckNow && !gameOver) {
                cb.hidden = false;
                cb.textContent = 'Check!';
                setTimeout(() => { cb.hidden = true; }, 1500);
            } else {
                cb.hidden = true;
            }
        }
    }

    function undo() {
        if (history.length === 0 || !lastMove) return;
        const last = lastMove;
        // We didn't store captured piece; simple undo via storing a snapshot per move
        if (snapshots.length > 0) {
            const snap = snapshots.pop();
            board = JSON.parse(snap.board);
            turn = snap.turn;
            moveCounter = snap.moveCounter;
            history = snap.history;
            lastMove = snap.lastMove;
            gameOver = false;
            updateUI();
        }
    }

    const snapshots = [];
    function snapshot() {
        snapshots.push({
            board: JSON.stringify(board),
            turn,
            moveCounter,
            history: [...history],
            lastMove: lastMove ? JSON.parse(JSON.stringify(lastMove)) : null
        });
    }

    function makeRandomComputerMove() {
        // Simple random legal move for opponent
        const color = turn;
        const allMoves = [];
        for (let r=0;r<8;r++) for (let c=0;c<8;c++) {
            const p = board[r][c]; if (!p || colorOf(p)!==color) continue;
            const ms = legalMoves(r,c);
            ms.forEach(m => allMoves.push({fr:r,fc:c,tr:m.r,tc:m.c}));
        }
        if (allMoves.length === 0) { const res = checkGameEnd() || 'draw-stalemate'; concludeGame(res); return; }
        const mv = allMoves[Math.floor(Math.random()*allMoves.length)];
        snapshot();
        makeMove(mv.fr,mv.fc,mv.tr,mv.tc);
        updateUI();
    }

    function evalMaterial(color) {
        const values = {P:1, N:3, B:3, R:5, Q:9, K:0};
        let score = 0;
        for (let r=0;r<8;r++) for (let c=0;c<8;c++) {
            const p = board[r][c]; if (!p) continue;
            const val = values[p.charAt(1)] || 0;
            score += (colorOf(p) === color) ? val : -val;
        }
        return score;
    }

    function pickComputerMove(level) {
        const color = turn;
        const allMoves = [];
        for (let r=0;r<8;r++) for (let c=0;c<8;c++) {
            const p = board[r][c]; if (!p || colorOf(p)!==color) continue;
            const ms = legalMoves(r,c);
            ms.forEach(m => allMoves.push({fr:r,fc:c,tr:m.r,tc:m.c}));
        }
        if (allMoves.length === 0) return null;
        if (level === 'easy') {
            return allMoves[Math.floor(Math.random()*allMoves.length)];
        }
        // One-ply capture preference (medium)
        const captureMoves = allMoves.filter(m => board[m.tr][m.tc]);
        if (level === 'medium') {
            if (captureMoves.length) return captureMoves[Math.floor(Math.random()*captureMoves.length)];
            return allMoves[Math.floor(Math.random()*allMoves.length)];
        }
        // Hard: greedy material eval after move (one-ply)
        let best = null, bestScore = -Infinity;
        for (const mv of allMoves) {
            const moving = board[mv.fr][mv.fc]; const captured = board[mv.tr][mv.tc];
            board[mv.tr][mv.tc] = moving; board[mv.fr][mv.fc] = null;
            const score = evalMaterial(color);
            board[mv.fr][mv.fc] = moving; board[mv.tr][mv.tc] = captured;
            if (score > bestScore) { bestScore = score; best = mv; }
        }
        return best || allMoves[0];
    }

    function maybeComputerMove() {
        const vsComp = vsComputerCheckbox && vsComputerCheckbox.checked;
        if (vsComp && !gameOver) {
            // Delay slightly to feel natural
            const level = difficultySelect ? difficultySelect.value : 'easy';
            setTimeout(() => {
                if (gameOver) return;
                const mv = pickComputerMove(level);
                if (!mv) { const res = checkGameEnd() || 'draw-stalemate'; concludeGame(res); return; }
                snapshot();
                makeMove(mv.fr,mv.fc,mv.tr,mv.tc);
                if (!gameOver) updateUI();
            }, 250);
        }
    }

    function hasAnyLegalMoves(color) {
        for (let r=0;r<8;r++) for (let c=0;c<8;c++) {
            const p = board[r][c]; if (!p || colorOf(p)!==color) continue;
            if (legalMoves(r,c).length) return true;
        }
        return false;
    }

    function isInCheck(color) {
        const king = findKing(color);
        const enemy = color === 'w' ? 'b' : 'w';
        const attacked = squaresAttackedBy(enemy);
        return king ? attacked.has(king.r+','+king.c) : false;
    }

    function checkGameEnd() {
        const current = turn; // after move, turn already flipped
        const canMove = hasAnyLegalMoves(current);
        if (!canMove) {
            if (isInCheck(current)) return current === 'w' ? 'black' : 'white';
            return 'draw';
        }
        // 50-move rule
        if (halfmoveClock >= 100) return 'draw';
        // threefold repetition
        const key = fenKey();
        const seen = (positionHistory.get(key)||0) + 1;
        positionHistory.set(key, seen);
        if (seen >= 3) return 'draw';
        // insufficient material
        if (insufficientMaterial()) return 'draw';
        return null;
    }

    function insufficientMaterial() {
        // Detect common cases: K vs K, K+B vs K, K+N vs K, K+B vs K+B same color bishops
        const pieces = [];
        for (let r=0;r<8;r++) for (let c=0;c<8;c++) {
            const p = board[r][c]; if (!p) continue; pieces.push({p, r, c});
        }
        const majorsOrPawns = pieces.filter(x => ['Q','R','P'].includes(x.p.charAt(1)));
        if (majorsOrPawns.length > 0) return false;
        const bishops = pieces.filter(x => x.p.charAt(1)==='B');
        const knights = pieces.filter(x => x.p.charAt(1)==='N');
        // K vs K only
        if (pieces.length === 2) return true;
        // Single bishop or single knight total
        if (pieces.length === 3 && (bishops.length===1 || knights.length===1)) return true;
        // K+B vs K+B with bishops on same color squares
        if (pieces.length === 4 && bishops.length===2 && knights.length===0) {
            const colors = bishops.map(b => ( (b.r + b.c) % 2));
            if (colors[0] === colors[1]) return true;
        }
        return false;
    }

    function fenKey() {
        // simple position key: board + turn + castling + ep target
        const rows = board.map(row => row.map(p => p||'-').join('')).join('/');
        const turnKey = turn;
        const castKey = (castling.w.K?'K':'')+(castling.w.Q?'Q':'')+(castling.b.K?'k':'')+(castling.b.Q?'q':'') || '-';
        const epKey = epTarget ? (epTarget.r+','+epTarget.c) : '-';
        return rows + ' ' + turnKey + ' ' + castKey + ' ' + epKey;
    }

    function isSquareAttacked(r,c,byColor) {
        const atks = squaresAttackedBy(byColor);
        return atks.has(r+','+c);
    }

    function showPromotion() {
        if (promotionModal) promotionModal.style.display = 'flex';
    }
    function hidePromotion() {
        if (promotionModal) promotionModal.style.display = 'none';
    }

    promotionButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            if (!canPromote) return;
            const piece = btn.getAttribute('data-piece');
            const color = canPromote.color === 'w' ? 'w' : 'b';
            const target = canPromote.to;
            board[target.r][target.c] = color + piece;
            canPromote = null;
            hidePromotion();
            updateUI();
            // after promotion, also check game end
            const result = checkGameEnd();
            if (result) concludeGame(result);
        });
    });

    function concludeGame(result) {
        gameOver = true;
        const vsComp = vsComputerCheckbox && vsComputerCheckbox.checked;
        const level = difficultySelect ? difficultySelect.value : 'easy';
        if (result === 'white') {
            incrementScore('wins', level);
            celebrate(level);
        } else if (result === 'black') {
            incrementScore('losses', level);
        } else {
            incrementScore('draws', level);
        }
        const rb = document.getElementById('result-banner');
        if (rb) {
            let msg = '';
            if (result === 'white') msg = 'White wins!';
            else if (result === 'black') msg = 'Black wins!';
            else if (result === 'draw-stalemate') msg = 'Draw by stalemate';
            else if (result === 'draw-50') msg = 'Draw by 50-move rule';
            else if (result === 'draw-threefold') msg = 'Draw by threefold repetition';
            else if (result === 'draw-insufficient') msg = 'Draw by insufficient material';
            else msg = 'Draw!';
            rb.hidden = false;
            rb.textContent = msg;
            setTimeout(() => { rb.hidden = true; }, 3500);
        }
    }

    function incrementScore(type, level) {
        const key = 'chess-score-' + level;
        let data = {wins:0,losses:0,draws:0};
        try {
            const raw = localStorage.getItem(key);
            if (raw) data = JSON.parse(raw);
            data[type] = (data[type]||0) + 1;
            localStorage.setItem(key, JSON.stringify(data));
        } catch (e) {}
        updateScores();
    }

    function updateScores() {
        const level = difficultySelect ? difficultySelect.value : 'easy';
        const key = 'chess-score-' + level;
        let data = {wins:0,losses:0,draws:0};
        try {
            const raw = localStorage.getItem(key);
            if (raw) data = JSON.parse(raw);
        } catch (e) {}
        if (winsEl) winsEl.textContent = String(data.wins||0);
        if (lossesEl) lossesEl.textContent = String(data.losses||0);
        if (drawsEl) drawsEl.textContent = String(data.draws||0);
    }

    function celebrate(level) {
        if (!celebrateEl) return;
        celebrateEl.innerHTML = '';
        const count = level === 'hard' ? 180 : level === 'medium' ? 100 : 60;
        for (let i=0;i<count;i++) {
            const c = document.createElement('div');
            c.className = 'confetti';
            const colors = ['#4361EE','#7209B7','#F72585','#4895EF','#FBBF24','#10B981'];
            c.style.background = colors[Math.floor(Math.random()*colors.length)];
            c.style.left = Math.random()*100 + 'vw';
            c.style.animationDuration = (3 + Math.random()*2) + 's';
            c.style.animationDelay = (Math.random()*0.5) + 's';
            c.style.transform = 'translateY(-10vh)';
            celebrateEl.appendChild(c);
        }
        setTimeout(() => { if (celebrateEl) celebrateEl.innerHTML = ''; }, 6000);
    }

    undoBtn?.addEventListener('click', undo);
    resetBtn?.addEventListener('click', () => { resetBoard(); updateScores(); });
    newGameBtn?.addEventListener('click', () => { resetBoard(); updateScores(); });
    difficultySelect?.addEventListener('change', updateScores);

    // Pre-render board labels around grid
    const topLabels = document.querySelector('.file-labels.top');
    const bottomLabels = document.querySelector('.file-labels.bottom');
    if (topLabels && bottomLabels) {
        topLabels.innerHTML = files.map(f => '<span>' + f.toUpperCase() + '</span>').join('');
        bottomLabels.innerHTML = files.map(f => '<span>' + f.toUpperCase() + '</span>').join('');
    }

    // Start: always show rules modal on load/refresh; game begins after accept
    resetBoard();
    updateScores();
    showRulesModal();

    rulesAccept?.addEventListener('click', () => {
        hideRulesModal();
    });
});


