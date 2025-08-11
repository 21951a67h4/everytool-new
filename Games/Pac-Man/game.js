/* game.js
   Neon Maze — feature-rich Pac-like game engine
   - In-file A* pathfinding
   - Ghost AI with full state machine & personalities
   - Difficulty presets, touch & keyboard controls
   - Howler.js integration with oscillator fallback
   - Debug overlay toggle
*/

/* ===========================
   Configuration & constants
   =========================== */
   const TILE = 20;
   const COLS = 28;
   const ROWS = 31;
   const START_LIVES = 3;
   const PLAYER_BASE_SPEED = 2.0;
   const GHOST_BASE_SPEED = 1.4;
   const DEFAULT_FRIGHT_TICKS = 6 * 60; // 6 seconds at ~60fps
   const STORAGE_KEYS = { HIGH: 'neonHigh', CONTROLS: 'neonControls', DIFF: 'neonDiff' };
   const DEBUG_DEFAULT = false; // debug overlay off
   
   // Difficulty presets
   const DIFFICULTY = {
     easy:   { name: 'easy', ghosts: 2, ghostSpeed: GHOST_BASE_SPEED * 0.78, fright: Math.floor(DEFAULT_FRIGHT_TICKS * 1.4), spawnExitDelay: 120, chaseBias: 0.4 },
     medium: { name: 'medium', ghosts: 3, ghostSpeed: GHOST_BASE_SPEED * 1.0, fright: DEFAULT_FRIGHT_TICKS, spawnExitDelay: 50, chaseBias: 0.72 },
     hard:   { name: 'hard', ghosts: 4, ghostSpeed: GHOST_BASE_SPEED * 1.35, fright: Math.floor(DEFAULT_FRIGHT_TICKS * 0.5), spawnExitDelay: 8, chaseBias: 0.95 }
   };
   
   /* ===========================
      Map template (editable)
      0 empty, 1 wall, 2 dot, 3 pellet, 4 ghost-door (passable)
      =========================== */
   const MAP_TEMPLATE = [
   [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
   [1,2,2,2,2,2,2,2,2,2,2,2,2,1,1,2,2,2,2,2,2,2,2,2,2,2,2,1],
   [1,2,1,1,1,1,2,1,1,1,1,1,2,1,1,2,1,1,1,1,1,2,1,1,1,1,2,1],
   [1,3,1,1,1,1,2,1,1,1,1,1,2,1,1,2,1,1,1,1,1,2,1,1,1,1,3,1],
   [1,2,1,1,1,1,2,1,1,1,1,1,2,1,1,2,1,1,1,1,1,2,1,1,1,1,2,1],
   [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
   [1,2,1,1,1,1,2,1,1,2,1,1,1,1,1,1,1,2,1,1,2,1,1,1,1,1,2,1],
   [1,2,1,1,1,1,2,1,1,2,1,1,1,1,1,1,1,2,1,1,2,1,1,1,1,1,2,1],
   [1,2,2,2,2,2,2,1,1,2,2,2,2,1,1,2,2,2,2,1,1,2,2,2,2,2,2,1],
   [1,1,1,1,1,1,2,1,1,1,1,1,0,1,1,0,1,1,1,1,1,2,1,1,1,1,1,1],
   [1,1,1,1,1,1,2,1,1,1,1,1,0,1,1,0,1,1,1,1,1,2,1,1,1,1,1,1],
   [1,1,1,1,1,1,2,1,1,0,0,0,0,0,0,0,0,0,0,1,1,2,1,1,1,1,1,1],
   [1,1,1,1,1,1,2,1,1,0,1,1,1,4,4,1,1,1,0,1,1,2,1,1,1,1,1,1],
   [1,1,1,1,1,1,2,1,1,0,1,0,0,0,0,0,0,1,0,1,1,2,1,1,1,1,1,1],
   [0,0,0,0,0,0,2,0,0,0,1,0,0,0,0,0,0,1,0,0,0,2,0,0,0,0,0,0],
   [1,1,1,1,1,1,2,1,1,0,1,0,0,0,0,0,0,1,0,1,1,2,1,1,1,1,1,1],
   [1,1,1,1,1,1,2,1,1,0,1,1,1,1,1,1,1,1,0,1,1,2,1,1,1,1,1,1],
   [1,1,1,1,1,1,2,1,1,0,0,0,0,0,0,0,0,0,0,1,1,2,1,1,1,1,1,1],
   [1,1,1,1,1,1,2,1,1,0,1,1,1,1,1,1,1,1,0,1,1,2,1,1,1,1,1,1],
   [1,1,1,1,1,1,2,1,1,0,1,1,1,1,1,1,1,1,0,1,1,2,1,1,1,1,1,1],
   [1,2,2,2,2,2,2,2,2,2,2,2,2,1,1,2,2,2,2,2,2,2,2,2,2,2,2,1],
   [1,2,1,1,1,1,2,1,1,1,1,1,2,1,1,2,1,1,1,1,1,2,1,1,1,1,2,1],
   [1,2,1,1,1,1,2,1,1,1,1,1,2,1,1,2,1,1,1,1,1,2,1,1,1,1,2,1],
   [1,3,2,2,1,1,2,2,2,2,2,2,2,0,0,2,2,2,2,2,2,2,1,1,2,2,3,1],
   [1,1,1,2,1,1,2,1,1,2,1,1,1,1,1,1,1,1,2,1,1,2,1,1,2,1,1,1],
   [1,1,1,2,1,1,2,1,1,2,1,1,1,1,1,1,1,1,2,1,1,2,1,1,2,1,1,1],
   [1,2,2,2,2,2,2,1,1,2,2,2,2,1,1,2,2,2,2,1,1,2,2,2,2,2,2,1],
   [1,2,1,1,1,1,1,1,1,1,1,1,2,1,1,2,1,1,1,1,1,1,1,1,1,1,2,1],
   [1,2,1,1,1,1,1,1,1,1,1,1,2,1,1,2,1,1,1,1,1,1,1,1,1,1,2,1],
   [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
   [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
   ];
   
   /* ===========================
      Utility helpers
      =========================== */
   function tileCenter(c, r) { return { x: c * TILE + TILE / 2, y: r * TILE + TILE / 2 }; }
   function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
   function idx(c, r) { return r * COLS + c; }
   
   /* ===========================
      Min-heap for A* priority queue
      =========================== */
   class MinHeap {
     constructor() { this.a = []; this.pos = new Map(); }
     empty() { return this.a.length === 0; }
     push(node) { this.a.push(node); this.pos.set(node.k, this.a.length - 1); this._up(this.a.length - 1); }
     pop() {
       if (this.a.length === 0) return null;
       const top = this.a[0];
       const last = this.a.pop();
       this.pos.delete(top.k);
       if (this.a.length) { this.a[0] = last; this.pos.set(last.k, 0); this._down(0); }
       return top;
     }
     has(k) { return this.pos.has(k); }
     decrease(k, newF) { const i = this.pos.get(k); if (i === undefined) return; this.a[i].f = newF; this._up(i); }
     _up(i) { while (i > 0) { const p = Math.floor((i - 1) / 2); if (this.a[i].f < this.a[p].f) { this._swap(i, p); i = p; } else break; } }
     _down(i) { const n = this.a.length; while (true) { let l = 2 * i + 1, r = 2 * i + 2, s = i; if (l < n && this.a[l].f < this.a[s].f) s = l; if (r < n && this.a[r].f < this.a[s].f) s = r; if (s !== i) { this._swap(i, s); i = s; } else break; } }
     _swap(a, b) { const t = this.a[a]; this.a[a] = this.a[b]; this.a[b] = t; this.pos.set(this.a[a].k, a); this.pos.set(this.a[b].k, b); }
   }
   
   /* ===========================
      Map grid with A* method
      =========================== */
   class MapGrid {
     constructor(template) {
       this.cols = COLS; this.rows = ROWS; this.tileSize = TILE;
       this.grid = template.map(r => r.slice());
     }
     inBounds(c, r) { return r >= 0 && r < this.rows && c >= 0 && c < this.cols; }
     isWall(c, r) { if (!this.inBounds(c, r)) return true; const v = this.grid[r][c]; return v === 1; } // treat 4 as passable
     isDot(c, r) { return this.inBounds(c, r) && this.grid[r][c] === 2; }
     isPellet(c, r) { return this.inBounds(c, r) && this.grid[r][c] === 3; }
     consume(c, r) { if (!this.inBounds(c, r)) return null; const v = this.grid[r][c]; if (v === 2) { this.grid[r][c] = 0; return 'dot'; } if (v === 3) { this.grid[r][c] = 0; return 'pellet'; } return null; }
     countDots() { let n = 0; for (let r = 0; r < this.rows; r++) for (let c = 0; c < this.cols; c++) if (this.grid[r][c] === 2 || this.grid[r][c] === 3) n++; return n; }
   
     // A* search returns the next tile (c,r) to step to from start (sc,sr) toward target (tc,tr).
     // If path not found returns null.
     findNextStep(sc, sr, tc, tr) {
       if (!this.inBounds(sc, sr) || !this.inBounds(tc, tr)) return null;
       if (this.isWall(tc, tr)) return null;
       const start = idx(sc, sr), goal = idx(tc, tr);
       const g = new Float64Array(this.cols * this.rows); g.fill(Infinity);
       const f = new Float64Array(this.cols * this.rows); f.fill(Infinity);
       const from = new Int32Array(this.cols * this.rows); from.fill(-1);
       const open = new MinHeap();
       function heur(a, b, c, d) { return Math.abs(a - c) + Math.abs(b - d); }
       g[start] = 0; f[start] = heur(sc, sr, tc, tr);
       open.push({ k: start, c: sc, r: sr, f: f[start] });
       const dirs = [{ c: 1, r: 0 }, { c: -1, r: 0 }, { c: 0, r: 1 }, { c: 0, r: -1 }];
       const maxSteps = this.cols * this.rows * 3; let steps = 0;
       while (!open.empty() && steps++ < maxSteps) {
         const cur = open.pop();
         if (cur.k === goal) {
           let curk = goal; let prev = from[curk];
           if (curk === start) return { c: tc, r: tr };
           while (prev !== start && prev !== -1) { curk = prev; prev = from[curk]; }
           return { c: curk % this.cols, r: Math.floor(curk / this.cols) };
         }
         for (const d of dirs) {
           const nc = cur.c + d.c, nr = cur.r + d.r;
           if (!this.inBounds(nc, nr)) continue;
           const tile = this.grid[nr][nc];
           if (tile === 1) continue;
           const nk = idx(nc, nr);
           const tentative = g[cur.k] + 1;
           if (tentative < g[nk]) {
             from[nk] = cur.k; g[nk] = tentative; f[nk] = tentative + heur(nc, nr, tc, tr);
             if (!open.has(nk)) open.push({ k: nk, c: nc, r: nr, f: f[nk] }); else open.decrease(nk, f[nk]);
           }
         }
       }
       return null;
     }
   }
   
   /* ===========================
      Audio manager - Howler if present, oscillator fallback
      =========================== */
   class AudioMgr {
     constructor() {
       this.enabled = true;
       this.howlAvailable = (typeof Howl !== 'undefined');
       if (this.howlAvailable) {
         // create short effects using Howler using generated tones (we'll use sprite-like approach with single-file noises omitted)
         this.sfx = {
           dot: new Howl({ src: [], volume: 0.06 }), // placeholder (empty) - use oscillator fallback if no sources
           eatGhost: new Howl({ src: [], volume: 0.12 }),
           death: new Howl({ src: [], volume: 0.12 }),
           intro: new Howl({ src: [], volume: 0.06 })
         };
       } else {
         try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { this.ctx = null; }
       }
     }
     resume() { if (this.ctx && this.ctx.state === 'suspended') return this.ctx.resume(); return Promise.resolve(); }
     _tone(freq, dur = 0.06, type = 'sine', vol = 0.08) {
       if (!this.ctx) return;
       const o = this.ctx.createOscillator(), g = this.ctx.createGain();
       o.type = type; o.frequency.value = freq; g.gain.value = vol;
       o.connect(g); g.connect(this.ctx.destination);
       const now = this.ctx.currentTime; g.gain.setValueAtTime(vol, now); g.gain.exponentialRampToValueAtTime(0.001, now + dur);
       o.start(now); o.stop(now + dur);
     }
     eatDot() { if (!this.enabled) return; if (this.howlAvailable && this.sfx.dot) { try { this.sfx.dot.play(); } catch (e) { this._tone(260, 0.04, 'square', 0.06); } } else { this._tone(260, 0.04, 'square', 0.06); } }
     eatGhost() { if (!this.enabled) return; if (this.howlAvailable && this.sfx.eatGhost) { try { this.sfx.eatGhost.play(); } catch (e) { this._tone(440, 0.12, 'sawtooth', 0.12); } } else { this._tone(440, 0.12, 'sawtooth', 0.12); } }
     death() { if (!this.enabled) return; if (this.howlAvailable && this.sfx.death) { try { this.sfx.death.play(); } catch (e) { this._tone(160, 0.18, 'sawtooth', 0.12); } } else { this._tone(160, 0.18, 'sawtooth', 0.12); } }
     intro() { if (!this.enabled) return; if (this.howlAvailable && this.sfx.intro) { try { this.sfx.intro.play(); } catch (e) { this._tone(300, 0.06, 'sine', 0.06); } } else { this._tone(300, 0.06, 'sine', 0.06); } }
     toggle() { this.enabled = !this.enabled; return this.enabled; }
   }
   
   /* ===========================
      Input manager (keyboard + touch + control scheme)
      =========================== */
   class Input {
     constructor() {
       this.scheme = localStorage.getItem(STORAGE_KEYS.CONTROLS) || 'arrows';
       this.moveCb = null;
       this.startCb = null;
       this._onKey = this._onKey.bind(this);
       window.addEventListener('keydown', this._onKey, { passive: false });
     }
     _onKey(e) {
       const k = e.key.toLowerCase(); let dir = null;
       if (this.scheme === 'arrows') {
         if (k === 'arrowup') dir = 'up';
         else if (k === 'arrowdown') dir = 'down';
         else if (k === 'arrowleft') dir = 'left';
         else if (k === 'arrowright') dir = 'right';
       } else {
         if (k === 'w') dir = 'up';
         else if (k === 's') dir = 'down';
         else if (k === 'a') dir = 'left';
         else if (k === 'd') dir = 'right';
       }
       if (dir) { e.preventDefault(); if (this.moveCb) this.moveCb(dir); }
       if ((k === 'enter' || k === ' ') && this.startCb) this.startCb();
     }
     onMove(cb) { this.moveCb = cb; }
     onStart(cb) { this.startCb = cb; }
     setScheme(s) { this.scheme = s; localStorage.setItem(STORAGE_KEYS.CONTROLS, s); }
   }
   
   /* ===========================
      Player (Pac-Man)
      =========================== */
   class Player {
     constructor(col, row, map) {
       const c = tileCenter(col, row);
       this.x = c.x; this.y = c.y;
       this.col = col; this.row = row;
       this.tile = map.tileSize;
       this.speed = PLAYER_BASE_SPEED;
       this.dir = null; this.queue = null;
       this.radius = this.tile / 2 - 2;
       this.lastDir = 'right';
     }
     setDir(d) { this.queue = d; }
     update(map) {
       this.col = Math.floor(this.x / this.tile); this.row = Math.floor(this.y / this.tile);
       const center = tileCenter(this.col, this.row);
       const atCenter = Math.abs(this.x - center.x) < this.speed && Math.abs(this.y - center.y) < this.speed;
       if (atCenter) {
         this.x = center.x; this.y = center.y;
         if (this.queue && !map.isWall(this._colAfter(this.queue), this._rowAfter(this.queue))) { this.dir = this.queue; this.queue = null; }
         if (this.dir && map.isWall(this._colAfter(this.dir), this._rowAfter(this.dir))) this.dir = null;
       }
       if (this.dir === 'right') { this.x += this.speed; this.lastDir = 'right'; }
       else if (this.dir === 'left') { this.x -= this.speed; this.lastDir = 'left'; }
       else if (this.dir === 'up') { this.y -= this.speed; this.lastDir = 'up'; }
       else if (this.dir === 'down') { this.y += this.speed; this.lastDir = 'down'; }
       if (this.x < -this.tile / 2) this.x = map.cols * this.tile + this.tile / 2;
       if (this.x > map.cols * this.tile + this.tile / 2) this.x = -this.tile / 2;
     }
     _colAfter(d) { if (d === 'right') return this.col + 1; if (d === 'left') return this.col - 1; return this.col; }
     _rowAfter(d) { if (d === 'up') return this.row - 1; if (d === 'down') return this.row + 1; return this.row; }
     draw(ctx) {
       ctx.save(); ctx.translate(this.x, this.y);
       ctx.fillStyle = '#ffd54a'; // bright yellow
       let rot = 0;
       if (this.lastDir === 'up') rot = -Math.PI / 2;
       else if (this.lastDir === 'down') rot = Math.PI / 2;
       else if (this.lastDir === 'left') rot = Math.PI;
       ctx.rotate(rot);
       const mouth = 0.28;
       ctx.beginPath(); ctx.arc(0, 0, this.radius, mouth * Math.PI, (2 - mouth) * Math.PI); ctx.lineTo(0, 0); ctx.closePath(); ctx.fill();
       ctx.restore();
     }
   }
   
   /* ===========================
      Ghost (AI)
      =========================== */
   class Ghost {
     constructor(col, row, color, name, map, speed, spawnDelay) {
       const c = tileCenter(col, row);
       this.x = c.x; this.y = c.y; this.col = Math.floor(col); this.row = Math.floor(row);
       this.startCol = Math.floor(col); this.startRow = Math.floor(row);
       this.color = color; this.name = name; this.map = map; this.speed = speed; this.radius = map.tileSize / 2 - 2;
       this.state = 'spawn'; // spawn, scatter, chase, frightened, eaten
       this.frightTimer = 0;
       this.spawnTimer = spawnDelay || 0;
       this.scatterTarget = this._scatterTarget();
       this.dir = 'left';
       this.lastPath = null; // debug
       this.targetTile = null; // debug
     }
     _scatterTarget() {
       if (this.name === 'blinky') return { c: COLS - 2, r: 1 };
       if (this.name === 'pinky') return { c: 2, r: 1 };
       if (this.name === 'inky') return { c: COLS - 2, r: ROWS - 2 };
       return { c: 2, r: ROWS - 2 }; // clyde
     }
     setFright(ticks) { if (this.state !== 'eaten') { this.state = 'frightened'; this.frightTimer = ticks; } }
     update(player, blinky, globalMode) {
       // spawn timer
       if (this.spawnTimer > 0) { this.spawnTimer--; if (this.spawnTimer <= 0) { this.state = (globalMode === 'scatter' ? 'scatter' : 'chase'); } }
       if (this.spawnTimer <= 0 && this.state === 'spawn') this.state = (globalMode === 'scatter' ? 'scatter' : 'chase');
   
       this.col = Math.floor(this.x / this.map.tileSize); this.row = Math.floor(this.y / this.map.tileSize);
       const center = tileCenter(this.col, this.row);
       const atCenter = Math.abs(this.x - center.x) < this.speed && Math.abs(this.y - center.y) < this.speed;
   
       if (this.state === 'frightened') { this.frightTimer--; if (this.frightTimer <= 0) this.state = (globalMode === 'scatter' ? 'scatter' : 'chase'); }
   
       if (atCenter) {
         this.x = center.x; this.y = center.y;
         // revive if eaten and at home
         if (this.state === 'eaten' && this.col === 13 && this.row === 14) { this.state = 'scatter'; }
   
         // If inside spawn area and spawnTimer > 0: try to move toward exit
         const inSpawnArea = (this.col >= 11 && this.col <= 16 && this.row >= 11 && this.row <= 15);
         if (inSpawnArea && this.spawnTimer > 0) {
           const exit = this._exitTile();
           const next = this.map.findNextStep(this.col, this.row, exit.c, exit.r);
           if (next) this._setDir(next);
           else this._pickRandomNeighbor();
         } else {
           // Normal behavior: choose target based on state & personality
           let target = null;
           if (this.state === 'eaten') target = { c: 13, r: 14 };
           else if (this.state === 'frightened') target = { c: Math.floor(Math.random() * this.map.cols), r: Math.floor(Math.random() * this.map.rows) };
           else if (this.state === 'scatter') target = this.scatterTarget;
           else {
             // chase personality
             const pacC = Math.floor(player.x / this.map.tileSize), pacR = Math.floor(player.y / this.map.tileSize);
             if (this.name === 'blinky') target = { c: pacC, r: pacR };
             else if (this.name === 'pinky') {
               let tx = pacC, ty = pacR; const d = player.lastDir;
               if (d === 'up') ty -= 4; else if (d === 'down') ty += 4; else if (d === 'left') tx -= 4; else if (d === 'right') tx += 4;
               target = { c: clamp(tx, 0, this.map.cols - 1), r: clamp(ty, 0, this.map.rows - 1) };
             } else if (this.name === 'inky') {
               const bC = Math.floor(blinky.x / this.map.tileSize), bR = Math.floor(blinky.y / this.map.tileSize);
               let aheadC = pacC, aheadR = pacR; const d = player.lastDir;
               if (d === 'up') aheadR -= 2; else if (d === 'down') aheadR += 2; else if (d === 'left') aheadC -= 2; else if (d === 'right') aheadC += 2;
               const tx = aheadC + (aheadC - bC), ty = aheadR + (aheadR - bR);
               target = { c: clamp(tx, 0, this.map.cols - 1), r: clamp(ty, 0, this.map.rows - 1) };
             } else {
               // clyde
               const dist = Math.hypot(this.x - player.x, this.y - player.y);
               target = dist > 8 * this.map.tileSize ? { c: pacC, r: pacR } : this.scatterTarget;
             }
           }
   
           // compute next tile via A*
           if (target) {
             this.targetTile = target;
             const next = this.map.findNextStep(this.col, this.row, target.c, target.r);
             this.lastPath = next;
             if (next) this._setDir(next);
             else { if (!this._keepDirPossible()) this._pickRandomNeighbor(); }
           } else this._pickRandomNeighbor();
         }
       }
   
       // Move continuous
       if (this.dir === 'right') this.x += this.speed;
       else if (this.dir === 'left') this.x -= this.speed;
       else if (this.dir === 'up') this.y -= this.speed;
       else if (this.dir === 'down') this.y += this.speed;
   
       // wrap tunnel
       if (this.x < -this.map.tileSize / 2) this.x = this.map.cols * this.map.tileSize + this.map.tileSize / 2;
       if (this.x > this.map.cols * this.map.tileSize + this.map.tileSize / 2) this.x = -this.map.tileSize / 2;
     }
     _exitTile() { if (!this.map.isWall(13, 10)) return { c: 13, r: 10 }; if (!this.map.isWall(13, 11)) return { c: 13, r: 11 }; return { c: 13, r: 10 }; }
     _setDir(next) { if (next.c > this.col) this.dir = 'right'; else if (next.c < this.col) this.dir = 'left'; else if (next.r < this.row) this.dir = 'up'; else if (next.r > this.row) this.dir = 'down'; }
     _keepDirPossible() { const c = this.col, r = this.row; if (this.dir === 'right' && !this.map.isWall(c + 1, r)) return true; if (this.dir === 'left' && !this.map.isWall(c - 1, r)) return true; if (this.dir === 'up' && !this.map.isWall(c, r - 1)) return true; if (this.dir === 'down' && !this.map.isWall(c, r + 1)) return true; return false; }
     _pickRandomNeighbor() { const c = this.col, r = this.row, opts = []; if (!this.map.isWall(c + 1, r)) opts.push('right'); if (!this.map.isWall(c - 1, r)) opts.push('left'); if (!this.map.isWall(c, r - 1)) opts.push('up'); if (!this.map.isWall(c, r + 1)) opts.push('down'); if (opts.length) this.dir = opts[Math.floor(Math.random() * opts.length)]; }
     draw(ctx) {
       const bodyColor = this.state === 'frightened' ? '#4b6bff' : (this.state === 'eaten' ? '#fff' : this.color);
       ctx.fillStyle = bodyColor;
       ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, Math.PI, 0); ctx.lineTo(this.x + this.radius, this.y + this.radius * 1.2);
       const scall = 4; const step = (this.radius * 2) / scall;
       for (let i = 0; i <= scall; i++) { const sx = this.x + this.radius - i * step; const sy = this.y + this.radius * 1.2 - ((i % 2) ? 4 : 0); ctx.lineTo(sx, sy); }
       ctx.closePath(); ctx.fill();
       if (this.state !== 'eaten') {
         ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(this.x - this.radius / 2.6, this.y - this.radius / 5, this.radius / 3, 0, Math.PI * 2); ctx.arc(this.x + this.radius / 2.6, this.y - this.radius / 5, this.radius / 3, 0, Math.PI * 2); ctx.fill();
         ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(this.x - this.radius / 2.6, this.y - this.radius / 5, this.radius / 6, 0, Math.PI * 2); ctx.arc(this.x + this.radius / 2.6, this.y - this.radius / 5, this.radius / 6, 0, Math.PI * 2); ctx.fill();
       }
     }
   }
   
   /* ===========================
      Renderer (canvas) — scales to DPR
      =========================== */
   class Renderer {
     constructor(canvas, map) {
       this.canvas = canvas; this.ctx = canvas.getContext('2d'); this.map = map;
       this.resize(); window.addEventListener('resize', () => this.resize());
     }
     resize() {
       const baseW = this.map.cols * this.map.tileSize, baseH = this.map.rows * this.map.tileSize;
       const maxW = Math.min(560, window.innerWidth - 60);
       const scale = Math.min(1, maxW / baseW);
       const dpr = window.devicePixelRatio || 1;
       const final = scale * dpr;
       this.canvas.style.width = (baseW * scale) + 'px';
       this.canvas.style.height = (baseH * scale) + 'px';
       this.canvas.width = Math.round(baseW * final);
       this.canvas.height = Math.round(baseH * final);
       this.ctx.setTransform(final, 0, 0, final, 0, 0);
     }
     clear() { this.ctx.clearRect(0, 0, this.map.cols * this.map.tileSize, this.map.rows * this.map.tileSize); }
     drawMap() {
       const ctx = this.ctx;
       ctx.fillStyle = '#071426'; ctx.fillRect(0, 0, this.map.cols * this.map.tileSize, this.map.rows * this.map.tileSize);
       for (let r = 0; r < this.map.rows; r++) {
         for (let c = 0; c < this.map.cols; c++) {
           const v = this.map.grid[r][c]; const x = c * this.map.tileSize, y = r * this.map.tileSize;
           if (v === 1) {
             ctx.fillStyle = 'rgba(2,6,20,1)'; ctx.fillRect(x, y, this.map.tileSize, this.map.tileSize);
             ctx.fillStyle = 'rgba(0,168,255,0.85)'; ctx.fillRect(x + 2, y + 2, this.map.tileSize - 4, this.map.tileSize - 4);
             ctx.fillStyle = '#001'; ctx.fillRect(x + 6, y + 6, this.map.tileSize - 12, this.map.tileSize - 12);
           } else if (v === 2) {
             ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x + this.map.tileSize / 2, y + this.map.tileSize / 2, 2, 0, Math.PI * 2); ctx.fill();
           } else if (v === 3) {
             ctx.fillStyle = 'rgba(255,213,74,1)'; ctx.beginPath(); ctx.arc(x + this.map.tileSize / 2, y + this.map.tileSize / 2, this.map.tileSize / 3, 0, Math.PI * 2); ctx.fill();
           } else if (v === 4) {
             ctx.fillStyle = 'rgba(200,200,255,0.06)'; ctx.fillRect(x, y, this.map.tileSize, this.map.tileSize);
           }
         }
       }
     }
     drawDebug(ghosts) {
       const ctx = this.ctx;
       for (const g of ghosts) {
         if (!g.lastPath || !g.targetTile) continue;
         // draw target tile
         ctx.strokeStyle = 'rgba(255,255,0,0.45)'; ctx.lineWidth = 1;
         ctx.strokeRect(g.targetTile.c * this.map.tileSize + 2, g.targetTile.r * this.map.tileSize + 2, this.map.tileSize - 4, this.map.tileSize - 4);
         // draw next step
         if (g.lastPath) {
           ctx.strokeStyle = 'rgba(255,0,0,0.9)'; ctx.beginPath();
           ctx.moveTo(g.x, g.y);
           const nx = g.lastPath.c * this.map.tileSize + this.map.tileSize / 2, ny = g.lastPath.r * this.map.tileSize + this.map.tileSize / 2;
           ctx.lineTo(nx, ny); ctx.stroke();
         }
       }
     }
   }
   
   /* ===========================
      Game Controller
      =========================== */
   class Game {
     constructor() {
       this.map = new MapGrid(MAP_TEMPLATE);
       const canvas = document.getElementById('gameCanvas');
       canvas.width = COLS * TILE; canvas.height = ROWS * TILE;
       this.renderer = new Renderer(canvas, this.map);
       this.input = new Input(); this.audio = new AudioMgr();
       this.scoreEl = document.getElementById('score'); this.highEl = document.getElementById('high'); this.livesEl = document.getElementById('lives'); this.levelEl = document.getElementById('level');
       this.startOverlay = document.getElementById('start-overlay'); this.touchPad = document.getElementById('touchPad'); this.messageEl = document.getElementById('message');
       this.debugToggle = document.getElementById('toggle-debug'); this.soundToggle = document.getElementById('btn-sound-toggle'); this.resetHighBtn = document.getElementById('btn-reset-high');
       this.ctrlArrows = document.getElementById('ctrl-arrows'); this.ctrlWASD = document.getElementById('ctrl-wasd');
       this.diffs = { easy: document.getElementById('btn-easy'), medium: document.getElementById('btn-medium'), hard: document.getElementById('btn-hard') };
       this.startBtn = document.getElementById('btn-start');
   
       this.score = 0; this.high = parseInt(localStorage.getItem(STORAGE_KEYS.HIGH) || '0', 10) || 0; this.lives = START_LIVES; this.level = 1;
       this.player = null; this.ghosts = []; this.mode = 'scatter'; this.modeTimer = 0; this.modeSchedule = [{ mode: 'scatter', time: 7 * 60 }, { mode: 'chase', time: 20 * 60 }, { mode: 'scatter', time: 7 * 60 }, { mode: 'chase', time: 20 * 60 }];
       this.modeIndex = 0; this.settingsKey = localStorage.getItem(STORAGE_KEYS.DIFF) || 'medium'; this.settings = DIFFICULTY[this.settingsKey];
       this.gameState = 'idle';
       this.debug = DEBUG_DEFAULT;
       this._bindUI();
       this._loop();
     }
   
     _bindUI() {
       // difficulty
       this.diffs.easy.addEventListener('click', () => this._setDifficulty('easy'));
       this.diffs.medium.addEventListener('click', () => this._setDifficulty('medium'));
       this.diffs.hard.addEventListener('click', () => this._setDifficulty('hard'));
       // controls
       this.ctrlArrows.addEventListener('click', () => { this.input.setScheme('arrows'); this.ctrlArrows.classList.add('selected'); this.ctrlWASD.classList.remove('selected'); });
       this.ctrlWASD.addEventListener('click', () => { this.input.setScheme('wasd'); this.ctrlWASD.classList.add('selected'); this.ctrlArrows.classList.remove('selected'); });
       // touch D-pad
       this.touchPad.querySelectorAll('.tb').forEach(btn => {
         btn.addEventListener('touchstart', e => { e.preventDefault(); const d = btn.dataset.dir; if (this.player) this.player.setDir(d); if (this.gameState === 'ready') this.gameState = 'playing'; });
         btn.addEventListener('mousedown', e => { e.preventDefault(); const d = btn.dataset.dir; if (this.player) this.player.setDir(d); if (this.gameState === 'ready') this.gameState = 'playing'; });
       });
       // debug toggle
       this.debugToggle.addEventListener('change', (e) => { this.debug = !!e.target.checked; });
       // sound toggle
       this.soundToggle.addEventListener('click', () => { const s = this.audio.toggle(); this.soundToggle.textContent = s ? 'Sound: On' : 'Sound: Off'; });
       // reset high
       this.resetHighBtn.addEventListener('click', () => { localStorage.removeItem(STORAGE_KEYS.HIGH); this.high = 0; this.highEl.textContent = '0'; });
       // start
       this.startBtn.addEventListener('click', () => this.start());
       // keyboard start/resume
       this.input.onStart(() => { if (this.gameState === 'idle' || this.gameState === 'gameover') this.start(); else if (this.gameState === 'paused') { this.gameState = 'playing'; this.startOverlay.style.display = 'none'; } });
       // input move
       this.input.onMove((d) => { if (this.player) this.player.setDir(d); if (this.gameState === 'ready') this.gameState = 'playing'; });
   
       // initial UI states
       document.getElementById('high').textContent = String(this.high);
       // difficulty UI highlight
       this._applyDifficultyUI();
       // show touchpad on small screens
       if (window.innerWidth <= 720) this.touchPad.style.display = 'block'; else this.touchPad.style.display = 'none';
       window.addEventListener('resize', () => { if (window.innerWidth <= 720) this.touchPad.style.display = 'block'; else this.touchPad.style.display = 'none'; });
   
       // resume audio on user gesture
       const resume = () => { this.audio && this.audio.resume().catch(() => {}); window.removeEventListener('keydown', resume); window.removeEventListener('mousedown', resume); window.removeEventListener('touchstart', resume); };
       window.addEventListener('keydown', resume); window.addEventListener('mousedown', resume); window.addEventListener('touchstart', resume);
     }
   
     _setDifficulty(key) {
       if (!DIFFICULTY[key]) return;
       this.settingsKey = key; this.settings = DIFFICULTY[key];
       localStorage.setItem(STORAGE_KEYS.DIFF, key);
       this._applyDifficultyUI();
     }
   
     _applyDifficultyUI() {
       Object.keys(this.diffs).forEach(k => { this.diffs[k].classList.toggle('selected', k === this.settingsKey); });
     }
   
     start() {
       this.map = new MapGrid(MAP_TEMPLATE);
       this.renderer = new Renderer(document.getElementById('gameCanvas'), this.map);
       this.settings = DIFFICULTY[this.settingsKey];
       this.score = 0; this.lives = START_LIVES; this.level = 1;
       this.player = new Player(14, 22, this.map);
       // spawn ghosts
       const names = ['blinky', 'pinky', 'inky', 'clyde'];
       const colors = ['#ff3fa3', '#00b0ff', '#34ffb2', '#ffd54a'];
       const seeds = [{ c: 13.5, r: 11 }, { c: 11.5, r: 14 }, { c: 13.5, r: 14 }, { c: 15.5, r: 14 }];
       this.ghosts = [];
       for (let i = 0; i < this.settings.ghosts; i++) {
         const pos = seeds[i] || seeds[0];
         let delay = this.settings.spawnExitDelay + i * 6;
         if (this.settingsKey === 'hard') delay = Math.max(0, Math.floor(delay / 6));
         const g = new Ghost(pos.c, pos.r, colors[i] || '#fff', names[i] || ('g' + i), this.map, this.settings.ghostSpeed, delay);
         if (g.spawnTimer <= 0) g.state = 'chase';
         this.ghosts.push(g);
       }
       // adjust mode schedule on hard
       this.modeSchedule = [{ mode: 'scatter', time: 7 * 60 }, { mode: 'chase', time: 20 * 60 }, { mode: 'scatter', time: 7 * 60 }, { mode: 'chase', time: 20 * 60 }];
       if (this.settingsKey === 'hard') this.modeSchedule = [{ mode: 'chase', time: 60 * 60 }, { mode: 'chase', time: 60 * 60 }];
       this.modeIndex = 0; this.mode = this.modeSchedule[0].mode; this.modeTimer = this.modeSchedule[0].time;
       this.gameState = 'ready'; this.startOverlay.style.display = 'none';
       try { this.audio.intro(); } catch (e) {}
     }
   
     _gameOver() {
       this.gameState = 'gameover'; this.startOverlay.style.display = 'flex'; this.startBtn.textContent = 'Restart';
       if (this.score > this.high) { this.high = this.score; localStorage.setItem(STORAGE_KEYS.HIGH, String(this.high)); }
     }
   
     _updateMode() {
       if (this.gameState !== 'playing') return;
       this.modeTimer--; if (this.modeTimer <= 0) {
         this.modeIndex = (this.modeIndex + 1) % this.modeSchedule.length;
         this.mode = this.modeSchedule[this.modeIndex].mode;
         this.modeTimer = this.modeSchedule[this.modeIndex].time;
         for (const g of this.ghosts) if (g.state !== 'frightened' && g.state !== 'eaten') g.state = this.mode;
       }
     }
   
     _tick() {
       if (this.gameState === 'playing') {
         this._updateMode();
         // player
         this.player.update(this.map);
         // consume dots/pellets
         const pC = Math.floor(this.player.x / this.map.tileSize), pR = Math.floor(this.player.y / this.map.tileSize);
         const eaten = this.map.consume(pC, pR);
         if (eaten === 'dot') { this.score += 10; try { this.audio.eatDot(); } catch (e) {} }
         else if (eaten === 'pellet') { this.score += 50; try { this.audio.eatDot(); } catch (e) {}; for (const g of this.ghosts) g.setFright(this.settings.fright); }
   
         // update ghosts
         for (let i = 0; i < this.ghosts.length; i++) {
           const g = this.ghosts[i];
           const blinky = this.ghosts.find(x => x.name === 'blinky') || this.ghosts[0] || g;
           if (g.state !== 'frightened' && g.state !== 'eaten') g.state = this.mode;
           g.update(this.player, blinky, this.mode);
         }
   
         // collisions
         for (const g of this.ghosts) {
           const d = Math.hypot(this.player.x - g.x, this.player.y - g.y);
           if (d < this.player.radius + g.radius - 2) {
             if (g.state === 'frightened') { g.state = 'eaten'; this.score += 200; try { this.audio.eatGhost(); } catch (e) {} }
             else if (g.state === 'chase' || g.state === 'scatter') {
               this.lives--; try { this.audio.death(); } catch (e) {}; if (this.lives <= 0) { this._gameOver(); return; }
               // reset positions and pause briefly
               this.player.x = tileCenter(14, 22).x; this.player.y = tileCenter(14, 22).y;
               for (const gg of this.ghosts) { gg.x = tileCenter(gg.startCol, gg.startRow).x; gg.y = tileCenter(gg.startCol, gg.startRow).y; gg.state = 'scatter'; gg.spawnTimer = Math.max(0, this.settings.spawnExitDelay); }
               this.gameState = 'paused'; setTimeout(() => { this.gameState = 'ready'; }, 900);
               break;
             }
           }
         }
   
         // win -> next level
         if (this.map.countDots() === 0) {
           this.level++;
           this.map = new MapGrid(MAP_TEMPLATE);
           for (const g of this.ghosts) { g.x = tileCenter(g.startCol, g.startRow).x; g.y = tileCenter(g.startCol, g.startRow).y; g.state = 'scatter'; g.spawnTimer = Math.max(0, this.settings.spawnExitDelay); }
           this.player.x = tileCenter(14, 22).x; this.player.y = tileCenter(14, 22).y;
           this.gameState = 'paused'; setTimeout(() => { this.gameState = 'ready'; }, 1000);
         }
       }
   
       // render
       this.renderer.clear();
       this.renderer.drawMap();
       if (this.player) this.player.draw(this.renderer.ctx);
       for (const g of this.ghosts) g.draw(this.renderer.ctx);
       if (this.debug) this.renderer.drawDebug(this.ghosts);
   
       // ui
       if (this.score > this.high) { this.high = this.score; localStorage.setItem(STORAGE_KEYS.HIGH, String(this.high)); }
       this.scoreEl.textContent = this.score; this.highEl.textContent = this.high; this.livesEl.textContent = this.lives; this.levelEl.textContent = this.level;
     }
   
     _loop() { const step = () => { this._tick(); requestAnimationFrame(step); }; requestAnimationFrame(step); }
   }
   
   /* ===========================
      Bootstrap
      =========================== */
   window.addEventListener('load', () => {
     const game = new Game();
     // Expose for debugging
     window.__NEON_GAME = game;
     // recommend starting overlay visible
     document.getElementById('start-overlay').style.display = 'flex';
     // Set toggle debug default from checkbox
     document.getElementById('toggle-debug').checked = DEBUG_DEFAULT;
   });
   