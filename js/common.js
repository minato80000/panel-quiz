const rowInput = document.getElementById("rows");
const colInput = document.getElementById("cols");
const board = document.getElementById("board");
const createBtn = document.getElementById("create");

function buildBoard() {
  const rows = parseInt(rowInput.value, 10);
  const cols = parseInt(colInput.value, 10);
  board.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
  board.innerHTML = "";
    for (let i = 0; i < rows * cols; i++) {
        const panel = document.createElement("button");
        panel.className = "panel";
        board.appendChild(panel);
    }
}

createBtn.addEventListener("click", buildBoard);
buildBoard();