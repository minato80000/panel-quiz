const rowInput = document.getElementById("rows");
const colInput = document.getElementById("cols");
const board = document.getElementById("board");

const genres = [];  // 列ごとのジャンル

function buildBoard() {
  const rows = parseInt(rowInput.value, 10);
  const cols = parseInt(colInput.value, 10);
  board.style.gridTemplateColumns = `repeat(${cols}, minmax(100px, 1fr))`;
  board.style.gridTemplateRows = `repeat(${rows+1}, minmax(60px, 1fr))`;
  board.innerHTML = ""; 

  for (let c = 0; c < cols; c++) {// ジャンル入力欄を作成
    const head = document.createElement("input");
    head.className = "genre";
    head.value = genres[c] || `ジャンル ${c + 1}`;
    head.addEventListener("input", () => {
      genres[c] = head.value;
    });
    board.appendChild(head);
  }

  for (let i = 0; i < rows * cols; i++) {// パネルを作成
    const panel = document.createElement("button");
    panel.className = "panel";

    const row = Math.floor(i / cols);
    const points = (row + 1) * 100; // ポイントは行番号に応じて100, 200, 300...
    
    panel.textContent = points;
    
    board.appendChild(panel);
  }
}

rowInput.addEventListener("change", buildBoard);
colInput.addEventListener("change", buildBoard);
buildBoard();
