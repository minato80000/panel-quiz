// =============================================================
// パネルクイズ 遊ぶページ（チーム対抗）
//   チームはプレイ中に自由に追加/削除できる（0チームでも可）
//   出題 → 答え表示後にチームを選んで加点 → 全問で勝敗
// =============================================================

// --- 要素の取得 ---------------------------------------------
const board = document.getElementById("board");
const STORAGE_KEY = "panelQuizData"; // 作成ページと同じ保存キー

// スコアボード / チーム管理
const scoreboardEl = document.getElementById("scoreboard");
const addTeamBtn = document.getElementById("addTeam");
const winnerEl = document.getElementById("winner");

// 出題モーダル
const quizModal = document.getElementById("quiz-modal");
const quizInfo = document.getElementById("quizInfo"); // 配点表示
const quizQuestion = document.getElementById("quizQuestion"); // 問題文
const quizAnswer = document.getElementById("quizAnswer"); // 答え
const showQuestionRow = document.getElementById("showQuestionRow"); // 「問題を表示」段階
const showQuestionButton = document.getElementById("showQuestionButton");
const closeButton2 = document.getElementById("closeButton2");
const revealRow = document.getElementById("revealRow"); // 「答えを見る」段階
const revealButton = document.getElementById("revealButton");
const closeButton = document.getElementById("closeButton");
const scoreRow = document.getElementById("scoreRow"); // 加点段階
const scoreLabel = document.getElementById("scoreLabel");
const teamButtons = document.getElementById("teamButtons");
const noWinnerButton = document.getElementById("noWinnerButton");

// --- 状態 ---------------------------------------------------
let quizData = null; // 作成データ
let rules = { instantQuestion: true }; // 作成ページで決めたルール（既定＝即表示）
let teams = []; // [{ name, score }]
let currentPanel = null; // 出題中 { panelEl, points }
let remaining = 0; // 未回答パネル数

// =============================================================
// データ読み込み
// =============================================================
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
// チーム管理（プレイ中に増減）
// =============================================================
// チームを1つ追加
function addTeam() {
  teams.push({ name: `チーム${teams.length + 1}`, score: 0 });
  renderScoreboard();
}

// 指定チームを削除
function removeTeam(index) {
  teams.splice(index, 1);
  renderScoreboard();
}

// スコアボードを描画（名前は編集可、×で削除）
function renderScoreboard() {
  scoreboardEl.innerHTML = "";
  teams.forEach((t, i) => {
    const card = document.createElement("div");
    card.className = `team-card team-${i % 4}`; // 色は4色を循環

    const remove = document.createElement("button");
    remove.className = "team-remove";
    remove.textContent = "×";
    remove.title = "このチームを削除";
    remove.addEventListener("click", () => removeTeam(i));

    const name = document.createElement("input");
    name.className = "team-card-name-input";
    name.value = t.name;
    name.addEventListener("input", () => (t.name = name.value)); // 名前を即反映

    const score = document.createElement("input");
    score.className = "team-card-score";
    score.value = t.score;
    score.type = "number";
    score.min = "0";
    score.addEventListener("input", () => (t.score = parseInt(score.value) || 0)); // スコアを即反映

    card.append(remove, name, score);
    scoreboardEl.appendChild(card);
  });
}

// =============================================================
// 盤面
// =============================================================
function renderBoard(data) {
  const rows = parseInt(data.rows, 10);
  const cols = parseInt(data.cols, 10);
  board.style.gridTemplateColumns = `repeat(${cols}, minmax(100px, 1fr))`;
  board.style.gridTemplateRows = `repeat(${rows + 1}, minmax(60px, 1fr))`;
  board.innerHTML = "";
  remaining = 0;

  // 1行目：ジャンル見出し（編集不可）
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
    const row = Math.floor(i / cols);
    const defaultPoints = (row + 1) * 100;
    const pd = (data.panelData && data.panelData[i]) || {};
    const points = pd.points ?? defaultPoints;

    panel.textContent = points;
    panel.addEventListener("click", () => openQuiz(pd, points, panel));
    board.appendChild(panel);
    remaining++;
  }
}

// =============================================================
// 出題モーダル
// =============================================================
// モーダルを開く（答え・加点ボタンは隠した状態）
// ルール instantQuestion が false のときは問題文も隠して「問題を表示」から始める
function openQuiz(pd, points, panelEl) {
  currentPanel = { panelEl, points };
  quizInfo.textContent = `${points} 点`;
  quizQuestion.textContent = pd.question || "（問題が設定されていません）";
  quizAnswer.textContent = pd.answer || "（答えが設定されていません）";

  quizAnswer.classList.add("hidden");
  scoreRow.classList.add("hidden"); // 加点段階は隠す
  teamButtons.innerHTML = ""; // 前回の加点ボタンを消す

  // 問題文を出すかどうかで最初の段階を切り替える
  quizQuestion.classList.toggle("hidden", !rules.instantQuestion);
  showQuestionRow.classList.toggle("hidden", rules.instantQuestion);
  revealRow.classList.toggle("hidden", !rules.instantQuestion);

  quizModal.style.display = "flex";
}

// 問題文を表示 → 「答えを見る」段階へ
function showQuestion() {
  quizQuestion.classList.remove("hidden");
  showQuestionRow.classList.add("hidden");
  revealRow.classList.remove("hidden");
}

// 答えを表示 → 加点段階へ
function revealAnswer() {
  quizAnswer.classList.remove("hidden");
  revealRow.classList.add("hidden");
  renderTeamButtons();
  scoreLabel.classList.toggle("hidden", teams.length === 0); // 0チームならラベル非表示
  scoreRow.classList.remove("hidden");
}

// 現在のチームぶんの加点ボタンを作る（0チームなら空）
function renderTeamButtons() {
  teamButtons.innerHTML = "";
  teams.forEach((t, i) => {
    const btn = document.createElement("button");
    btn.className = `team-btn team-${i % 4}`;
    btn.textContent = `${t.name} +${currentPanel.points}`;
    btn.addEventListener("click", () => awardPoints(i));
    teamButtons.appendChild(btn);
  });
}

// 選んだチームに加点して締める
function awardPoints(teamIndex) {
  teams[teamIndex].score += currentPanel.points;
  renderScoreboard();
  finishPanel(teamIndex);
}

// 加点せずに締める
function noWinner() {
  finishPanel(null);
}

// パネルを回答済みにしてモーダルを閉じる
// winnerIndex: 加点したチーム番号（正解なしは null）
function finishPanel(winnerIndex) {
  if (currentPanel && currentPanel.panelEl) {
    const el = currentPanel.panelEl;
    el.disabled = true; // 再クリック不可
    if (winnerIndex != null) {
      el.classList.add("won", `team-${winnerIndex % 4}`); // 勝ったチームの色で塗る
    } else {
      el.classList.add("done"); // 正解なしはグレー
    }
    remaining--;
  }
  closeQuiz();
  if (remaining <= 0 && teams.length > 0) showWinner(); // 全問終了＆チームあり
}

// 加点せず単に閉じる（Esc・背景・閉じるボタン）
function closeQuiz() {
  quizModal.style.display = "none";
  currentPanel = null;
}

// =============================================================
// 勝敗
// =============================================================
function showWinner() {
  const max = Math.max(...teams.map((t) => t.score));
  const winners = teams.filter((t) => t.score === max);
  winnerEl.textContent =
    winners.length === 1
      ? `優勝：${winners[0].name}（${max}点）🎉`
      : `引き分け：${winners.map((t) => t.name).join("・")}（${max}点）`;
  winnerEl.classList.remove("hidden");
}

// =============================================================
// イベント登録
// =============================================================
addTeamBtn.addEventListener("click", addTeam);
showQuestionButton.addEventListener("click", showQuestion);
closeButton2.addEventListener("click", closeQuiz);
revealButton.addEventListener("click", revealAnswer);
closeButton.addEventListener("click", closeQuiz);
noWinnerButton.addEventListener("click", noWinner);

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
quizData = loadData();
if (!quizData) {
  board.textContent = "データがありません。先に作成ページでクイズを作ってください。";
} else {
  // ルールは既定値に上書きマージ（rules を持たない古いデータでも動く）
  Object.assign(rules, quizData.rules);
  teams = [
    { name: "チーム1", score: 0 },
    { name: "チーム2", score: 0 },
  ]; // 既定は2チーム（プレイ中に増減・0チームも可）
  renderScoreboard();
  renderBoard(quizData);
}
