/* UI — 대화창·도감·토스트·모달·텃밭·음악 토글 */
window.UI = (() => {

const $ = id => document.getElementById(id);

let dialogQueue = [];
let dialogOnDone = null;
let dialogActive = false;

// === 대화창 ===
function showDialog(lines, name, onDone){
  if(typeof lines === "string") lines = [lines];
  dialogQueue = lines.slice();
  dialogOnDone = onDone || null;
  $("dialog").classList.add("show");
  $("d-name").textContent = name || "";
  dialogActive = true;
  nextDialog();
}

function nextDialog(){
  if(dialogQueue.length === 0){
    $("dialog").classList.remove("show");
    dialogActive = false;
    if(dialogOnDone){ const fn = dialogOnDone; dialogOnDone = null; fn(); }
    return;
  }
  const line = dialogQueue.shift();
  const el = $("d-text");
  el._fullText = line;
  el.textContent = "";
  let i = 0;
  if(el._typer){ clearInterval(el._typer); el._typer = null; }
  el._typer = setInterval(() => {
    el.textContent = line.slice(0, ++i);
    if(i >= line.length){ clearInterval(el._typer); el._typer = null; }
  }, 18);
}

function isDialogOpen(){ return dialogActive; }

function dialogAdvance(){
  if(!dialogActive) return false;
  const el = $("d-text");
  if(el._typer){
    clearInterval(el._typer); el._typer = null;
    el.textContent = el._fullText || el.textContent;
    return true;
  }
  nextDialog();
  return true;
}

$("dialog").addEventListener("click", () => dialogAdvance());

// === 토스트 ===
let toastTimer = null;
function toast(msg, ms=2200){
  const el = $("toast");
  el.textContent = msg;
  el.classList.add("show");
  if(toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(()=> el.classList.remove("show"), ms);
}

// === 모달 ===
function openModal(id){ $(id) && $(id).classList.add("show"); }
function closeModal(id){ $(id) && $(id).classList.remove("show"); }
function isAnyModalOpen(){
  return ['dex-modal','quiz-modal','final-quiz-modal','garden-modal','sejong-quiz-modal'].some(id => {
    const el = $(id);
    return el && el.classList.contains("show");
  });
}
function isInputLocked(){
  return dialogActive
    || isAnyModalOpen()
    || $("battle").classList.contains("show")
    || $("ending").classList.contains("show")
    || !$("title").classList.contains("hide");
}

// 닫기 버튼 전역
document.querySelectorAll("[data-close]").forEach(b => {
  b.addEventListener("click", e => {
    const modal = e.target.closest(".modal");
    if(modal) modal.classList.remove("show");
  });
});

function escape(){
  ['dex-modal','garden-modal','sejong-quiz-modal'].forEach(id => closeModal(id));
}

// === 길 안내 ===
function setQuest(text){ $("quest-text").textContent = text; }

// === 상태 칩 ===
function updateStats(G){
  $("dex-count").textContent = (G.dex||[]).length;
  $("kook-lv").textContent  = G.skills?.국이 || 1;
  $("haeng-lv").textContent = G.skills?.행이 || 1;
  $("beob-lv").textContent  = G.skills?.법이 || 1;
  const checks = ["B01","B02","B03","B04","B05","B06","B07"];
  const done = (G.battlesDone||[]).filter(id => checks.includes(id)).length;
  const bc = $("bcount"); if(bc) bc.textContent = done;
  // 꽃 카운트
  const fc = $("flower-count");
  if(fc){
    const found = (G.flowersFound||[]).filter(id => window.DATA.FLOWERS.some(f=>f.id===id)).length;
    fc.textContent = found;
  }
}

// === 도감 그리기 ===
function renderDex(G, opts){
  opts = opts || {};
  setupDexTabs();
  renderPokemonTab(G, opts);
  renderFlowerTab(G);
}

function setupDexTabs(){
  const tabs = document.querySelectorAll(".dex-tab");
  tabs.forEach(tab => {
    tab.onclick = () => {
      tabs.forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      document.querySelectorAll(".dex-tab-content").forEach(c => {
        c.style.display = c.dataset.tab === tab.dataset.tab ? "" : "none";
      });
    };
  });
}

function renderPokemonTab(G, opts){
  const grid = $("dex-grid");
  grid.innerHTML = "";
  window.DATA.POKEDEX.forEach(p => {
    const collected = G.dex.includes(p.id);
    const cell = document.createElement("div");
    cell.className = "dex-cell" + (collected ? "" : " locked");
    cell.innerHTML = `
      <div class="no">No.${String(p.id).padStart(3,"0")}</div>
      <canvas width="48" height="48"></canvas>
      <div><b>${collected ? p.name : "???"}</b></div>
      <div style="font-size:10px; color:#5a4a30;">${collected ? p.learn : "미발견"}</div>
    `;
    const cv = cell.querySelector("canvas");
    const c = cv.getContext("2d");
    c.imageSmoothingEnabled = false;
    window.SPRITES.drawPokemon(c, p.id, 0, 0, 48);
    cell.addEventListener("click", () => {
      if(opts.onCellClick){ opts.onCellClick(p, collected); return; }
      if(collected){
        showDialog([
          `[${p.name}] No.${String(p.id).padStart(3,"0")}`,
          p.desc,
          `학습 키워드: ${p.learn} · 획득 위치: ${p.loc}`
        ], "도감");
      } else {
        toast("아직 발견하지 못한 포켓몬입니다.");
      }
    });
    grid.appendChild(cell);
  });
  $("dex-collected").textContent = G.dex.length;
  const cc = $("center-cells");
  if(cc){
    const checks = ["B01","B02","B03","B04","B05","B06","B07"];
    cc.textContent = (G.battlesDone||[]).filter(id=>checks.includes(id)).length;
  }
}

function renderFlowerTab(G){
  const root = $("flower-grid");
  if(!root) return;
  root.innerHTML = "";
  const found = new Set(G.flowersFound || []);
  const flowers = window.DATA.FLOWERS || [];
  const byKind = { 법원:[], 국회:[], 행정부:[] };
  flowers.forEach(f => byKind[f.kind] && byKind[f.kind].push(f));
  const sections = [
    { key:"법원",   label:"🪻 법원",   cssCls:"court" },
    { key:"국회",   label:"🌸 국회",   cssCls:"cong"  },
    { key:"행정부", label:"🌼 행정부", cssCls:"admin" }
  ];
  sections.forEach(s => {
    const list = byKind[s.key] || [];
    const collected = list.filter(f => found.has(f.id)).length;
    const sec = document.createElement("div");
    sec.className = "flower-section";
    sec.innerHTML = `<h3>${s.label} ${collected}/${list.length}</h3><div class="flower-list"></div>`;
    const ul = sec.querySelector(".flower-list");
    list.forEach(f => {
      const row = document.createElement("div");
      const seen = found.has(f.id);
      row.className = "flower-row" + (seen ? "" : " locked");
      row.innerHTML = `
        <div class="icon ${s.cssCls}">🌼</div>
        <div><span class="num">${f.id}.</span> ${seen ? f.text : "아직 발견하지 못했어요."}</div>
      `;
      ul.appendChild(row);
    });
    root.appendChild(sec);
  });
  const total = flowers.length;
  $("flower-collected").textContent = flowers.filter(f => found.has(f.id)).length;
  $("fc-court").textContent = byKind["법원"].filter(f=>found.has(f.id)).length;
  $("fc-cong").textContent  = byKind["국회"].filter(f=>found.has(f.id)).length;
  $("fc-admin").textContent = byKind["행정부"].filter(f=>found.has(f.id)).length;
}

// === 텃밭 (국회 도서관) ===
let gardenOnSave = null;
let gardenPlants = new Array(16).fill(null);

function openGarden(G, onSave){
  gardenOnSave = onSave || null;
  gardenPlants = G.gardenPlants ? [...G.gardenPlants] : new Array(16).fill(null);
  renderGarden(G);
  openModal("garden-modal");
}

function renderGarden(G){
  const grid = $("garden-grid");
  if(!grid) return;
  grid.innerHTML = "";
  const found = new Set(G ? (G.flowersFound || []) : []);
  const flowers = window.DATA.FLOWERS || [];
  const flowerColors = { "법원":"#c8a0ff", "국회":"#5cb3ff", "행정부":"#ff7a5c" };

  for(let i = 0; i < 16; i++){
    const cell = document.createElement("div");
    cell.className = "garden-cell";
    const plantedId = gardenPlants[i];
    if(plantedId !== null){
      const f = flowers.find(fl => fl.id === plantedId);
      if(f){
        const color = flowerColors[f.kind] || "#ffd23f";
        cell.classList.add("planted");
        cell.style.background = color + "30";
        cell.style.borderColor = color;
        cell.innerHTML = `
          <div style="font-size:22px; line-height:1.1;">🌸</div>
          <div style="font-size:9px; color:#2a1a05; line-height:1.3; margin-top:2px;">${f.text.slice(0,28)}…</div>
          <button class="garden-remove-btn" data-slot="${i}" title="제거">✕</button>
        `;
      }
    } else {
      cell.innerHTML = `
        <div style="font-size:20px; opacity:0.4;">🌱</div>
        <div style="font-size:9px; color:#7a5a30; margin-top:2px;">심기</div>
      `;
      cell.style.cursor = "pointer";
      cell.addEventListener("click", () => showFlowerPicker(i, G));
    }
    grid.appendChild(cell);
  }
  // 제거 버튼 이벤트
  grid.querySelectorAll(".garden-remove-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const slot = parseInt(btn.dataset.slot);
      gardenPlants[slot] = null;
      if(gardenOnSave) gardenOnSave([...gardenPlants]);
      renderGarden(G);
    });
  });
}

function showFlowerPicker(slotIdx, G){
  const found = new Set(G ? (G.flowersFound || []) : []);
  const flowers = window.DATA.FLOWERS || [];
  const available = flowers.filter(f => found.has(f.id) && !gardenPlants.includes(f.id));

  if(available.length === 0){
    toast("심을 수 있는 꽃이 없어요. 더 많은 꽃을 수집해보세요!");
    return;
  }

  const picker = $("garden-picker");
  if(!picker) return;
  picker.innerHTML = `<div style="font-weight:700; margin-bottom:8px;">🌸 심을 꽃을 선택하세요</div>`;
  const kindColor = { "법원":"#c8a0ff", "국회":"#5cb3ff", "행정부":"#ff7a5c" };
  available.forEach(f => {
    const btn = document.createElement("button");
    btn.className = "garden-pick-btn";
    btn.style.background = (kindColor[f.kind] || "#ffd23f") + "40";
    btn.style.borderColor = kindColor[f.kind] || "#ffd23f";
    btn.innerHTML = `<b>${f.kind}</b> ${f.id}. ${f.text.slice(0, 30)}…`;
    btn.addEventListener("click", () => {
      gardenPlants[slotIdx] = f.id;
      if(gardenOnSave) gardenOnSave([...gardenPlants]);
      picker.innerHTML = "";
      renderGarden(G);
      toast(`🌸 꽃을 심었어요!`);
    });
    picker.appendChild(btn);
  });
  const cancelBtn = document.createElement("button");
  cancelBtn.className = "garden-pick-btn";
  cancelBtn.style.background = "#f0e8d8";
  cancelBtn.textContent = "취소";
  cancelBtn.addEventListener("click", () => { picker.innerHTML = ""; });
  picker.appendChild(cancelBtn);
}

// === 음악 토글 ===
function setupSoundBtn(){
  const btn = $("sound-btn");
  if(!btn) return;
  btn.addEventListener("click", () => {
    if(window.AUDIO){
      const muted = window.AUDIO.toggle();
      btn.textContent = muted ? "🔇 음악" : "🔊 음악";
      btn.title = muted ? "음악 켜기" : "음악 끄기";
    }
  });
}

// === 메뉴 버튼 ===
document.querySelectorAll("#menu-btns .menu-btn").forEach(b => {
  b.addEventListener("click", () => {
    const act = b.dataset.act;
    if(act === "dex"){
      renderDex(window.Game.getState());
      openModal("dex-modal");
    } else if(act === "save"){
      window.Game.save();
      toast("저장 완료!");
    } else if(act === "reset"){
      if(confirm("정말 처음부터 다시 시작하시겠어요?")){
        window.Game.reset();
      }
    }
  });
});

// DOMContentLoaded 후 사운드 버튼 초기화
if(document.readyState === "loading"){
  document.addEventListener("DOMContentLoaded", setupSoundBtn);
} else {
  setupSoundBtn();
}

return {
  showDialog, dialogAdvance, isDialogOpen,
  toast, openModal, closeModal, isAnyModalOpen, isInputLocked, escape,
  setQuest, updateStats, renderDex,
  openGarden,
  isModalOpen: ()=> isInputLocked()
};
})();
