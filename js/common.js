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
const questionCount = document.getElementById("questionCount"); // 問題文の文字数表示

const instantQuestionInput = document.getElementById("ruleInstantQuestion"); // ルール：即問題表示

const startButton = document.getElementById("start"); // クイズ開始ボタン
const exportButton = document.getElementById("exportButton"); // JSON書き出し
const importInput = document.getElementById("importInput"); // JSON読み込み

// --- 状態（アプリが保持するデータ） --------------------------
const panelData = {}; // パネルごとのデータ { 番号: {points, question, answer} }
const genres = []; // 列ごとのジャンル名
let editingPanelIndex = null; // 現在編集中のパネル番号
let editingDefaultPoints = 0; // 編集中パネルの既定配点（配点が空のときの代替）
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
  editingDefaultPoints = defaultPoints; // 配点が空のときの代替値として控えておく
  const data = panelData[i] || {};
  pointsInput.value = data.points ?? defaultPoints;
  questionInput.value = data.question ?? "";
  answerInput.value = data.answer ?? "";
  updateQuestionCount();
  modal.style.display = "flex";
}

// 問題文の文字数を表示に反映する
function updateQuestionCount() {
  questionCount.textContent = `${questionInput.value.length} 文字`;
}

// 入力内容を保存して盤面へ反映する
function savePanel() {
  const points = parseInt(pointsInput.value, 10);
  panelData[editingPanelIndex] = {
    // 空欄など数値にできない場合は既定配点にフォールバック（NaN表示を防ぐ）
    points: Number.isNaN(points) ? editingDefaultPoints : points,
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
// 現在の状態を1つのオブジェクトにまとめる
function collectData() {
  return {
    rows: rowInput.value,
    cols: colInput.value,
    genres: genres,
    panelData: panelData,
    rules: {
      // パネルを押した直後に問題文を出すか（false なら「問題を表示」を挟む）
      instantQuestion: instantQuestionInput.checked,
    },
  };
}

// 読み込んだデータを状態へ反映する（sessionStorage・JSON共通）
function applyData(data) {
  if (data.rows) rowInput.value = data.rows;
  if (data.cols) colInput.value = data.cols;
  // const の配列/オブジェクトは中身を詰め替える（再代入はしない）
  genres.length = 0;
  if (data.genres) data.genres.forEach((genre, i) => (genres[i] = genre));
  for (const key in panelData) delete panelData[key];
  if (data.panelData) Object.assign(panelData, data.panelData);
  // ルール（未設定の古いデータは既定値のまま）
  if (data.rules && data.rules.instantQuestion != null) {
    instantQuestionInput.checked = data.rules.instantQuestion;
  }
}

// 現在の状態を保存する
function saveData() {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(collectData()));
}

// 保存済みの状態を復元する（無ければ何もしない）
function loadData() {
  const raw = sessionStorage.getItem(STORAGE_KEY);
  if (!raw) return;
  try {
    applyData(JSON.parse(raw));
  } catch (e) {
    console.error("Failed to load data:", e);
  }
}

// =============================================================
// JSON エクスポート / インポート
// =============================================================
const DEFAULT_FILE_NAME = "panel-quiz.json";

// 現在の状態を JSON ファイルとして保存する
// 保存ダイアログが使えるブラウザ（Chrome/Edge）では保存場所とファイル名を選べる
async function exportData() {
  const json = JSON.stringify(collectData(), null, 2);

  if (window.showSaveFilePicker) {
    try {
      const handle = await window.showSaveFilePicker({
        suggestedName: DEFAULT_FILE_NAME,
        types: [
          {
            description: "パネルクイズ (JSON)",
            accept: { "application/json": [".json"] },
          },
        ],
      });
      const writable = await handle.createWritable();
      await writable.write(json);
      await writable.close();
      return;
    } catch (e) {
      if (e.name === "AbortError") return; // ユーザーがキャンセルした
      console.error("Save dialog failed:", e); // それ以外はダウンロードで代替
    }
  }

  // 非対応ブラウザ：ファイル名だけ聞いてダウンロードフォルダへ保存
  const name = prompt("ファイル名", DEFAULT_FILE_NAME);
  if (name === null) return; // キャンセル
  downloadJson(json, name.endsWith(".json") ? name : `${name}.json`);
}

// 一時URLを作ってダウンロードさせる（保存場所はブラウザ任せ）
function downloadJson(json, fileName) {
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url); // 一時URLを解放
}

// 選択された JSON ファイルを読み込んで状態を置き換える
function importData(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      applyData(JSON.parse(reader.result));
      buildBoard(); // 復元した状態で描画
      saveData(); // sessionStorage にも反映
    } catch (e) {
      alert("読み込みに失敗しました: " + e.message);
    }
  };
  reader.readAsText(file);
}

// =============================================================
// イベント登録
// =============================================================
// モーダルの保存・キャンセルボタン
document.getElementById("saveButton").addEventListener("click", savePanel);
questionInput.addEventListener("input", updateQuestionCount); // 入力のたびに文字数を更新
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

// ルールの変更を保存
instantQuestionInput.addEventListener("change", saveData);

startButton.addEventListener("click", () => {
  saveData(); // 盤面の状態を保存してから
  window.location.href = "play.html"; // クイズページへ遷移
});

// JSON 書き出し / 読み込み
exportButton.addEventListener("click", exportData);
importInput.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (file) importData(file);
  e.target.value = ""; // 同じファイルを連続で選べるようにリセット
});

// =============================================================
// 初期化
// =============================================================
loadData(); // 保存済みデータを復元してから
buildBoard(); // 盤面を描画する
