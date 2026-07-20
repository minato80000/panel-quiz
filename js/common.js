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
  for (let c = 0; c < cols; c++) {
    const head = document.createElement("input");
    head.className = "genre";
    head.value = genres[c] || `ジャンル ${c + 1}`;
    head.addEventListener("input", () => {
      genres[c] = head.value;
    });
    board.appendChild(head);
  }
  for (let i = 0; i < rows * cols; i++) {
    const panel = document.createElement("button");
    panel.className = "panel";
    board.appendChild(panel);
  }
}

rowInput.addEventListener("change", buildBoard);
colInput.addEventListener("change", buildBoard);
buildBoard();
