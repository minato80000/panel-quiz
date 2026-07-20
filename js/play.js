// =============================================================
// パネルクイズ 遊ぶページ
//   作成ページ(sessionStorage)のデータを読み込んで盤面を表示する
//   ※ 出題（クリックで問題→答え→得点）は今後のステップで追加
// =============================================================

// --- 要素の取得 ---------------------------------------------
const board = document.getElementById("board");
const STORAGE_KEY = "panelQuizData"; // 作成ページと同じ保存キー

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
    head.readOnly = true; // プレイ中は変更させない
    board.appendChild(head);
  }

  // 2行目以降：パネル（今は配点を表示するだけ）
  for (let i = 0; i < rows * cols; i++) {
    const panel = document.createElement("button");
    panel.className = "panel";

    const row = Math.floor(i / cols); // このパネルの行番号（0始まり）
    const defaultPoints = (row + 1) * 100; // 既定配点：下の行ほど高い
    const pd = (data.panelData && data.panelData[i]) || {};
    panel.textContent = pd.points ?? defaultPoints;

    board.appendChild(panel);
  }
}

// =============================================================
// 初期化
// =============================================================
const data = loadData();
if (!data) {
  board.textContent = "データがありません。先に作成ページでクイズを作ってください。";
} else {
  renderBoard(data);
}
