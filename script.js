const ROWS = 6;
const COLS = 7;
const EMPTY = 0;
const HUMAN = 1; // Rot
const AI = 2; // Gelb

const boardEl = document.getElementById('board');
const buttonsEl = document.getElementById('columnButtons');
const statusEl = document.getElementById('status');
const restartBtn = document.getElementById('restartBtn');

let board = createBoard();
let gameOver = false;
let humanTurn = true;

init();

function init() {
  renderColumnButtons();
  renderBoard();
  setStatus('Du bist am Zug.');
  restartBtn.addEventListener('click', resetGame);
}

function createBoard() {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(EMPTY));
}

function resetGame() {
  board = createBoard();
  gameOver = false;
  humanTurn = true;
  renderBoard();
  renderColumnButtons();
  setStatus('Neues Spiel! Du bist am Zug.');
}

function renderColumnButtons() {
  buttonsEl.innerHTML = '';
  for (let col = 0; col < COLS; col++) {
    const btn = document.createElement('button');
    btn.className = 'drop-btn';
    btn.type = 'button';
    btn.textContent = '▼';
    btn.setAttribute('aria-label', `Stein in Spalte ${col + 1} werfen`);
    btn.disabled = gameOver || !humanTurn || !canPlay(col);
    btn.addEventListener('click', () => handleHumanMove(col));
    buttonsEl.appendChild(btn);
  }
}

function renderBoard() {
  boardEl.innerHTML = '';
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const cell = document.createElement('div');
      cell.className = 'cell';
      if (board[row][col] === HUMAN) cell.classList.add('p1');
      if (board[row][col] === AI) cell.classList.add('p2');
      boardEl.appendChild(cell);
    }
  }
}

function setStatus(message) {
  statusEl.textContent = message;
}

function canPlay(col) {
  return board[0][col] === EMPTY;
}

function getNextOpenRow(col) {
  for (let row = ROWS - 1; row >= 0; row--) {
    if (board[row][col] === EMPTY) return row;
  }
  return -1;
}

function dropPiece(col, player) {
  const row = getNextOpenRow(col);
  if (row === -1) return null;
  board[row][col] = player;
  return { row, col };
}

function handleHumanMove(col) {
  if (gameOver || !humanTurn || !canPlay(col)) return;

  const move = dropPiece(col, HUMAN);
  if (!move) return;

  renderBoard();

  if (isWinningMove(board, HUMAN)) {
    gameOver = true;
    setStatus('🎉 Du hast gewonnen!');
    renderColumnButtons();
    return;
  }

  if (isBoardFull(board)) {
    gameOver = true;
    setStatus('Unentschieden.');
    renderColumnButtons();
    return;
  }

  humanTurn = false;
  renderColumnButtons();
  setStatus('Computer denkt ...');

  setTimeout(handleAIMove, 350);
}

function handleAIMove() {
  if (gameOver) return;

  const col = chooseAIColumn(board);
  const move = dropPiece(col, AI);

  if (!move) {
    // Fallback should never happen, but keeps game robust.
    const valid = getValidColumns(board);
    if (valid.length === 0) {
      gameOver = true;
      setStatus('Unentschieden.');
      renderColumnButtons();
      return;
    }
    dropPiece(valid[0], AI);
  }

  renderBoard();

  if (isWinningMove(board, AI)) {
    gameOver = true;
    setStatus('🤖 Computer gewinnt.');
    renderColumnButtons();
    return;
  }

  if (isBoardFull(board)) {
    gameOver = true;
    setStatus('Unentschieden.');
    renderColumnButtons();
    return;
  }

  humanTurn = true;
  setStatus('Du bist am Zug.');
  renderColumnButtons();
}

function isBoardFull(state) {
  return state[0].every((cell) => cell !== EMPTY);
}

function getValidColumns(state) {
  const cols = [];
  for (let c = 0; c < COLS; c++) {
    if (state[0][c] === EMPTY) cols.push(c);
  }
  return cols;
}

function cloneBoard(state) {
  return state.map((row) => [...row]);
}

function isWinningMove(state, player) {
  // Horizontal
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS - 3; col++) {
      if (
        state[row][col] === player &&
        state[row][col + 1] === player &&
        state[row][col + 2] === player &&
        state[row][col + 3] === player
      ) return true;
    }
  }

  // Vertikal
  for (let col = 0; col < COLS; col++) {
    for (let row = 0; row < ROWS - 3; row++) {
      if (
        state[row][col] === player &&
        state[row + 1][col] === player &&
        state[row + 2][col] === player &&
        state[row + 3][col] === player
      ) return true;
    }
  }

  // Diagonal runter rechts
  for (let row = 0; row < ROWS - 3; row++) {
    for (let col = 0; col < COLS - 3; col++) {
      if (
        state[row][col] === player &&
        state[row + 1][col + 1] === player &&
        state[row + 2][col + 2] === player &&
        state[row + 3][col + 3] === player
      ) return true;
    }
  }

  // Diagonal hoch rechts
  for (let row = 3; row < ROWS; row++) {
    for (let col = 0; col < COLS - 3; col++) {
      if (
        state[row][col] === player &&
        state[row - 1][col + 1] === player &&
        state[row - 2][col + 2] === player &&
        state[row - 3][col + 3] === player
      ) return true;
    }
  }

  return false;
}

function simulateDrop(state, col, player) {
  const temp = cloneBoard(state);
  for (let row = ROWS - 1; row >= 0; row--) {
    if (temp[row][col] === EMPTY) {
      temp[row][col] = player;
      return temp;
    }
  }
  return null;
}

function chooseAIColumn(state) {
  const validColumns = getValidColumns(state);

  // 1) Gewinnzug finden
  for (const col of validColumns) {
    const next = simulateDrop(state, col, AI);
    if (next && isWinningMove(next, AI)) return col;
  }

  // 2) Gegnerischen Gewinn blocken
  for (const col of validColumns) {
    const next = simulateDrop(state, col, HUMAN);
    if (next && isWinningMove(next, HUMAN)) return col;
  }

  // 3) Position bewerten (Mitte bevorzugen)
  let bestCol = validColumns[0];
  let bestScore = -Infinity;

  for (const col of validColumns) {
    const score = scorePosition(state, col);
    if (score > bestScore) {
      bestScore = score;
      bestCol = col;
    }
  }

  return bestCol;
}

function scorePosition(state, col) {
  // Mittlere Spalten bevorzugen
  const center = (COLS - 1) / 2; // 3 bei 7 Spalten
  const centerScore = 10 - Math.abs(center - col) * 2;

  // leichter Zufall, damit es nicht immer gleich spielt
  const noise = Math.random() * 1.5;

  // Bonus, wenn nach dem Zug 2er/3er Ketten entstehen
  const next = simulateDrop(state, col, AI);
  const chainScore = next ? evaluateChains(next, AI) : -100;

  return centerScore + chainScore + noise;
}

function evaluateChains(state, player) {
  let score = 0;

  // alle 4er-Fenster anschauen und bewerten
  const windows = [];

  // Horizontal
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS - 3; c++) {
      windows.push([state[r][c], state[r][c + 1], state[r][c + 2], state[r][c + 3]]);
    }
  }

  // Vertikal
  for (let c = 0; c < COLS; c++) {
    for (let r = 0; r < ROWS - 3; r++) {
      windows.push([state[r][c], state[r + 1][c], state[r + 2][c], state[r + 3][c]]);
    }
  }

  // Diagonal runter
  for (let r = 0; r < ROWS - 3; r++) {
    for (let c = 0; c < COLS - 3; c++) {
      windows.push([state[r][c], state[r + 1][c + 1], state[r + 2][c + 2], state[r + 3][c + 3]]);
    }
  }

  // Diagonal hoch
  for (let r = 3; r < ROWS; r++) {
    for (let c = 0; c < COLS - 3; c++) {
      windows.push([state[r][c], state[r - 1][c + 1], state[r - 2][c + 2], state[r - 3][c + 3]]);
    }
  }

  for (const w of windows) {
    const own = w.filter((x) => x === player).length;
    const empty = w.filter((x) => x === EMPTY).length;

    if (own === 3 && empty === 1) score += 6;
    else if (own === 2 && empty === 2) score += 2;
    else if (own === 4) score += 100;
  }

  return score;
}
