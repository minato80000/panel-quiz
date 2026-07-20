// =============================================================
// パネルクイズ 遊ぶページ
//   作成データを読み込み、パネルをクリックして問題・答えを表示する
// =============================================================

// --- 要素の取得 ---------------------------------------------
const board = document.getElementById("board");
const STORAGE_KEY = "panelQuizData"; // 作成ページと同じ保存キー

// 出題モーダル
const quizModal = document.getElementById("quiz-modal");
const quizInfo = document.getElementById("quizInfo"); // 配点表示
const quizQuestion = document.getElementById("quizQuestion"); // 問題文
const quizAnswer = document.getElementById("quizAnswer"); // 答え（初期は隠す）
const revealButton = document.getElementById("revealButton"); // 答えを見る
const closeButton = document.getElementById("closeButton"); // 閉じる

// =============================================================
// データの読み込み
// =============================================================
// 保存データを読み込んで返す（無ければ null）
function loadData() {
  const raw = sessionStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (e) {
    console.error("Failed to load data:", e);
    return null;
  }
}

// =============================================================
// 盤面の描画
// =============================================================
function renderBoard(data) {
  const rows = parseInt(data.rows, 10);
  const cols = parseInt(data.cols, 10);

  // グリッドの列・行を設定（1行目はジャンル見出し用に +1）
  board.style.gridTemplateColumns = `repeat(${cols}, minmax(100px, 1fr))`;
  board.style.gridTemplateRows = `repeat(${rows + 1}, minmax(60px, 1fr))`;
  board.innerHTML = "";

  // 1行目：ジャンル見出し（プレイ中は編集不可）
  for (let c = 0; c < cols; c++) {
    const head = document.createElement("input");
    head.className = "genre";
    head.value = (data.genres && data.genres[c]) || `ジャンル ${c + 1}`;
    head.readOnly = true;
    board.appendChild(head);
  }

  // 2行目以降：パネル（クリックで出題）
  for (let i = 0; i < rows * cols; i++) {
    const panel = document.createElement("button");
    panel.className = "panel";

    const row = Math.floor(i / cols); // このパネルの行番号（0始まり）
    const defaultPoints = (row + 1) * 100; // 既定配点：下の行ほど高い
    const pd = (data.panelData && data.panelData[i]) || {};
    const points = pd.points ?? defaultPoints;

    panel.textContent = points;
    panel.addEventListener("click", () => openQuiz(pd, points));
    board.appendChild(panel);
  }
}

// =============================================================
// 出題モーダル
// =============================================================
// パネルの問題を表示する（答えは隠した状態で開く）
function openQuiz(pd, points) {
  quizInfo.textContent = `${points} 点`;
  quizQuestion.textContent = pd.question || "（問題が設定されていません）";
  quizAnswer.textContent = pd.answer || "（答えが設定されていません）";

  quizAnswer.classList.add("hidden"); // 答えは隠す
  revealButton.style.display = ""; // 「答えを見る」を表示に戻す
  quizModal.style.display = "flex";
}

// 答えを表示する
function revealAnswer() {
  quizAnswer.classList.remove("hidden");
  revealButton.style.display = "none"; // 一度見たら隠す
}

// モーダルを閉じる
function closeQuiz() {
  quizModal.style.display = "none";
}

// =============================================================
// イベント登録
// =============================================================
revealButton.addEventListener("click", revealAnswer);
closeButton.addEventListener("click", closeQuiz);

// 背景（外側）クリックで閉じる
quizModal.addEventListener("click", (e) => {
  if (e.target === quizModal) closeQuiz();
});

// Escで閉じる（モーダルが開いている時のみ）
document.addEventListener("keydown", (e) => {
  if (quizModal.style.display !== "flex") return;
  if (e.key === "Escape") closeQuiz();
});

// =============================================================
// 初期化
// =============================================================
const data = loadData();
if (!data) {
  board.textContent = "データがありません。先に作成ページでクイズを作ってください。";
} else {
  renderBoard(data);
}
