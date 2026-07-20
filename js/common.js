const rowInput = document.getElementById("rows");
const colInput = document.getElementById("cols");
const board = document.getElementById("board");
const panelData = {}; // パネルのデータを保持するオブジェクト
// パネルのデータ構造例: {points:得点，question:質問文，answer:答え}

const genres = []; // 列ごとのジャンル

function buildBoard() {
  const rows = parseInt(rowInput.value, 10);
  const cols = parseInt(colInput.value, 10);
  board.style.gridTemplateColumns = `repeat(${cols}, minmax(100px, 1fr))`;
  board.style.gridTemplateRows = `repeat(${rows + 1}, minmax(60px, 1fr))`;
  board.innerHTML = "";

  for (let c = 0; c < cols; c++) {
    // ジャンル入力欄を作成
    const head = document.createElement("input");
    head.className = "genre";
    head.value = genres[c] || `ジャンル ${c + 1}`;
    head.addEventListener("input", () => {
      genres[c] = head.value;
    });
    board.appendChild(head);
  }

  for (let i = 0; i < rows * cols; i++) {
    // パネルを作成
    const panel = document.createElement("button");
    panel.className = "panel";

    const row = Math.floor(i / cols);
    const defaultPoints = (row + 1) * 100; // デフォルトのポイントは行番号に応じて100, 200, 300...
    const data = panelData[i] || {};
    const points = data.points ?? defaultPoints;

    panel.textContent = points;
    if (data.question) {
      panel.classList.add("Qconfigured"); // 問題が設定されている場合はクラスを追加
    }
    if (data.answer) {
      panel.classList.add("Aconfigured"); // 答えが設定されている場合はクラスを追加
    }

    panel.addEventListener("click", () => openEditor(i, defaultPoints)); // クリック時の処理は後で実装

    board.appendChild(panel);
  }
}

const modal = document.getElementById("panel-editor");
const pointsInput = document.getElementById("editPoints");
const questionInput = document.getElementById("editQuestion");
const answerInput = document.getElementById("editAnswer");
let editingPanelIndex = null;

function openEditor(i, defaultPoints) {
  editingPanelIndex = i;
  const data = panelData[i] || {};
  pointsInput.value = data.points ?? defaultPoints;
  questionInput.value = data.question ?? "";
  answerInput.value = data.answer ?? "";
  modal.style.display = "flex"; // モーダルを表示
}

function savePanel() {
  panelData[editingPanelIndex] = {
    points: parseInt(pointsInput.value, 10),
    question: questionInput.value,
    answer: answerInput.value,
  };
  modal.style.display = "none"; // モーダルを非表示
  buildBoard(); // ボードを再構築して変更を反映
}

function cancelEditor() {
  modal.style.display = "none"; // モーダルを非表示
}

document.getElementById("saveButton").addEventListener("click", savePanel);
document.getElementById("cancelButton").addEventListener("click", cancelEditor);
document.addEventListener("keydown", (e) => {
  if (modal.style.display !== "flex") return; // モーダルが開いている時だけ有効
  if (
    e.key === "Enter" &&
    e.target !== questionInput &&
    e.target !== answerInput
  ) {
    e.preventDefault(); // Enterキーのデフォルト動作を防ぐ
    savePanel();
  }
  if (e.key === "Escape") {
    cancelEditor();
  }
});

modal.addEventListener("click", (e) => {
  if (e.target === modal) {
    cancelEditor();
  }
});

rowInput.addEventListener("change", buildBoard); //行数の変更時にボードを再構築
colInput.addEventListener("change", buildBoard); //列数の変更時にボードを再構築
buildBoard();
