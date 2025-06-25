// ==== 數獨生成與驗證 ====
function isValid(board, row, col, num) {
  for (let i = 0; i < 9; i++) {
    if (board[row][i] === num || board[i][col] === num) return false;
    const boxRow = 3 * Math.floor(row / 3) + Math.floor(i / 3);
    const boxCol = 3 * Math.floor(col / 3) + i % 3;
    if (board[boxRow][boxCol] === num) return false;
  }
  return true;
}

function hasUniqueSolution(board) {
  let count = 0;
  function solve(bd) {
    if (count > 1) return;
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (bd[r][c] === 0) {
          for (let n = 1; n <= 9; n++) {
            if (isValid(bd, r, c, n)) {
              bd[r][c] = n;
              solve(bd);
              bd[r][c] = 0;
            }
          }
          return;
        }
      }
    }
    count++;
  }
  solve(board);
  return count === 1;
}

function generateFullBoard() {
  let board = Array.from({ length: 9 }, () => Array(9).fill(0));
  fill(board);
  return board;
}

function fill(board) {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (board[r][c] === 0) {
        let nums = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);
        for (let n of nums) {
          if (isValid(board, r, c, n)) {
            board[r][c] = n;
            if (fill(board)) return true;
            board[r][c] = 0;
          }
        }
        return false;
      }
    }
  }
  return true;
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function removeNumbers(board, clues) {
  let count = 81 - clues;
  while (count > 0) {
    let row = Math.floor(Math.random() * 9);
    let col = Math.floor(Math.random() * 9);
    if (board[row][col] !== 0) {
      let backup = board[row][col];
      board[row][col] = 0;
      let copy = JSON.parse(JSON.stringify(board));
      if (!hasUniqueSolution(copy)) {
        board[row][col] = backup;
      } else {
        count--;
      }
    }
  }
  return board;
}

function generatePuzzle(difficulty) {
  const cluesMap = { easy: 40, medium: 33, hard: 26 };
  let full = generateFullBoard();
  return removeNumbers(full, cluesMap[difficulty]);
}

document.getElementById("toggleNight").onclick = () => {
  document.body.classList.toggle("night");
};

document.getElementById("showRules").onclick = () => {
  alert("填滿每列、每行與每區1~9不重複，即可完成數獨！");
};

document.getElementById("newGame").onclick = () => {
  const diff = document.getElementById("difficulty").value;
  const puzzle = generatePuzzle(diff);
  renderBoard(puzzle);
};

function renderBoard(puzzle) {
  const boardElem = document.getElementById("sudokuBoard");
  boardElem.innerHTML = "";
  for (let r = 0; r < 9; r++) {
    const row = boardElem.insertRow();
    for (let c = 0; c < 9; c++) {
      const cell = row.insertCell();
      const input = document.createElement("input");
      input.maxLength = 1;
      input.value = puzzle[r][c] === 0 ? "" : puzzle[r][c];
      input.disabled = puzzle[r][c] !== 0;
      cell.appendChild(input);
    }
  }
}

document.getElementById("saveUser").onclick = () => {
  const user = document.getElementById("username").value;
  if (!user) return alert("請輸入帳號");
  localStorage.setItem("sudoku_" + user, "進度資料");
  updateLeaderboard(user);
};

function updateLeaderboard(user) {
  let list = document.getElementById("leaderboardList");
  let li = document.createElement("li");
  li.textContent = user + " - 通關！";
  list.appendChild(li);
}

document.getElementById("solveBtn").onclick = () => {
  let board = [];
  const rows = document.querySelectorAll("#sudokuBoard tr");
  for (let r = 0; r < 9; r++) {
    const cells = rows[r].querySelectorAll("input");
    board[r] = [];
    for (let c = 0; c < 9; c++) {
      let val = parseInt(cells[c].value);
      board[r][c] = isNaN(val) ? 0 : val;
    }
  }
  if (solveSudoku(board)) {
    for (let r = 0; r < 9; r++) {
      const cells = rows[r].querySelectorAll("input");
      for (let c = 0; c < 9; c++) {
        cells[c].value = board[r][c];
      }
    }
  } else {
    alert("此題無解或格式錯誤！");
  }
};

function solveSudoku(board) {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (board[r][c] === 0) {
        for (let n = 1; n <= 9; n++) {
          if (isValid(board, r, c, n)) {
            board[r][c] = n;
            if (solveSudoku(board)) return true;
            board[r][c] = 0;
          }
        }
        return false;
      }
    }
  }
  return true;
}
