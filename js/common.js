// =============================================================
// パネルクイズ 作成ページ
//   盤面の生成 / パネル編集 / データの保存・復元
// =============================================================

// --- 要素の取得 ---------------------------------------------
const rowInput = document.getElementById("rows"); // 行数の入力欄
const colInput = document.getElementById("cols"); // 列数の入力欄
const board = document.getElementById("board"); // 盤面（パネルを並べる箱）

const modal = document.getElementById("panel-editor"); // パネル設定モーダル
const pointsInput = document.getElementById("editPoints");
const questionInput = document.getElementById("editQuestion");
const answerInput = document.getElementById("editAnswer");

const startButton = document.getElementById("start"); // クイズ開始ボタン

// --- 状態（アプリが保持するデータ） --------------------------
const panelData = {}; // パネルごとのデータ { 番号: {points, question, answer} }
const genres = []; // 列ごとのジャンル名
let editingPanelIndex = null; // 現在編集中のパネル番号
const STORAGE_KEY = "panelQuizData"; // sessionStorage の保存キー

// =============================================================
// 盤面の描画
// =============================================================
function buildBoard() {
  const rows = parseInt(rowInput.value, 10);
  const cols = parseInt(colInput.value, 10);

  // グリッドの列・行を設定（1行目はジャンル見出し用に +1）
  board.style.gridTemplateColumns = `repeat(${cols}, minmax(100px, 1fr))`;
  board.style.gridTemplateRows = `repeat(${rows + 1}, minmax(60px, 1fr))`;
  board.innerHTML = "";

  // 1行目：ジャンル見出し（編集可能な入力欄）
  for (let c = 0; c < cols; c++) {
    const head = document.createElement("input");
    head.className = "genre";
    head.value = genres[c] || `ジャンル ${c + 1}`;
    head.addEventListener("input", () => {
      genres[c] = head.value;
      saveData(); // 入力のたびに保存
    });
    board.appendChild(head);
  }

  // 2行目以降：パネル
  for (let i = 0; i < rows * cols; i++) {
    const panel = document.createElement("button");
    panel.className = "panel";

    const row = Math.floor(i / cols); // このパネルの行番号（0始まり）
    const defaultPoints = (row + 1) * 100; // 既定配点：下の行ほど高い
    const data = panelData[i] || {};
    const points = data.points ?? defaultPoints;

    panel.textContent = points;
    if (data.question) panel.classList.add("Qconfigured"); // 問題あり → Q✓
    if (data.answer) panel.classList.add("Aconfigured"); // 答えあり → A✓

    // クリックで編集モーダルを開く
    panel.addEventListener("click", () => openEditor(i, defaultPoints));
    board.appendChild(panel);
  }
}

// =============================================================
// パネル編集モーダル
// =============================================================
// モーダルを開き、対象パネルの現在値を入力欄へ反映する
function openEditor(i, defaultPoints) {
  editingPanelIndex = i;
  const data = panelData[i] || {};
  pointsInput.value = data.points ?? defaultPoints;
  questionInput.value = data.question ?? "";
  answerInput.value = data.answer ?? "";
  modal.style.display = "flex";
}

// 入力内容を保存して盤面へ反映する
function savePanel() {
  panelData[editingPanelIndex] = {
    points: parseInt(pointsInput.value, 10),
    question: questionInput.value,
    answer: answerInput.value,
  };
  saveData();
  modal.style.display = "none";
  buildBoard();
}

// 保存せずにモーダルを閉じる
function cancelEditor() {
  modal.style.display = "none";
}

// =============================================================
// データの永続化（sessionStorage）
// =============================================================
// 現在の状態を保存する
function saveData() {
  const data = {
    rows: rowInput.value,
    cols: colInput.value,
    genres: genres,
    panelData: panelData,
  };
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// 保存済みの状態を復元する（無ければ何もしない）
function loadData() {
  const raw = sessionStorage.getItem(STORAGE_KEY);
  if (!raw) return;
  try {
    const data = JSON.parse(raw);
    if (data.rows) rowInput.value = data.rows;
    if (data.cols) colInput.value = data.cols;
    // const の配列/オブジェクトは中身を詰め替える（再代入はしない）
    if (data.genres) data.genres.forEach((genre, i) => (genres[i] = genre));
    if (data.panelData) Object.assign(panelData, data.panelData);
  } catch (e) {
    console.error("Failed to load data:", e);
    return null;
  }
}

// =============================================================
// イベント登録
// =============================================================
// モーダルの保存・キャンセルボタン
document.getElementById("saveButton").addEventListener("click", savePanel);
document.getElementById("cancelButton").addEventListener("click", cancelEditor);

// キーボード操作（モーダルが開いている時のみ有効）
document.addEventListener("keydown", (e) => {
  if (modal.style.display !== "flex") return;
  // 問題文・解答欄以外での Enter → 保存（textarea内は改行として残す）
  if (
    e.key === "Enter" &&
    e.target !== questionInput &&
    e.target !== answerInput
  ) {
    e.preventDefault();
    savePanel();
  }
  if (e.key === "Escape") cancelEditor(); // Esc → キャンセル
});

// モーダルの背景（外側）クリックで閉じる
modal.addEventListener("click", (e) => {
  if (e.target === modal) cancelEditor();
});

// 行・列の変更で盤面を作り直し、保存する
rowInput.addEventListener("change", () => {
  buildBoard();
  saveData();
});
colInput.addEventListener("change", () => {
  buildBoard();
  saveData();
});

startButton.addEventListener("click", () => {
  saveData(); // 盤面の状態を保存してから
  window.location.href = "play.html"; // クイズページへ遷移
});

// =============================================================
// 初期化
// =============================================================
loadData(); // 保存済みデータを復元してから
buildBoard(); // 盤面を描画する
