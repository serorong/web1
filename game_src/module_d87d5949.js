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

// 맵과 동일한 꽃 픽셀아트를 canvas에 그림
function drawFlowerSprite(canvas, kind, size){
  canvas.width = size; canvas.height = size;
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  const px = 0, py = 0, s = size;
  // 배경 (흙)
  ctx.fillStyle = "#8b6340"; ctx.fillRect(px,py,s,s);
  if(kind === "행정부"){
    // 오렌지꽃 (tile 30)
    ctx.fillStyle = "#5aa847"; ctx.fillRect(px,py,s,s);
    ctx.fillStyle = "#2d5a1f"; ctx.fillRect(px+s*0.45,py+s*0.6,2,s*0.35);
    ctx.fillStyle = "#ff8a3c";
    ctx.fillRect(px+s*0.4,py+s*0.15,s*0.2,s*0.2);
    ctx.fillRect(px+s*0.4,py+s*0.5,s*0.2,s*0.15);
    ctx.fillRect(px+s*0.15,py+s*0.3,s*0.2,s*0.25);
    ctx.fillRect(px+s*0.65,py+s*0.3,s*0.2,s*0.25);
    ctx.fillStyle = "#ffd23f"; ctx.fillRect(px+s*0.35,py+s*0.3,s*0.3,s*0.25);
    ctx.fillStyle = "#c08020"; ctx.fillRect(px+s*0.45,py+s*0.4,s*0.1,s*0.05);
  } else if(kind === "국회"){
    // 파랑꽃 (tile 31)
    ctx.fillStyle = "#5aa847"; ctx.fillRect(px,py,s,s);
    ctx.fillStyle = "#2d5a1f"; ctx.fillRect(px+s*0.45,py+s*0.6,2,s*0.35);
    ctx.fillStyle = "#5cb3ff";
    ctx.fillRect(px+s*0.4,py+s*0.1,s*0.2,s*0.5);
    ctx.fillRect(px+s*0.1,py+s*0.25,s*0.8,s*0.2);
    ctx.fillStyle = "#2a6fbe"; ctx.fillRect(px+s*0.2,py+s*0.5,s*0.6,s*0.08);
    ctx.fillStyle = "#ffffff"; ctx.fillRect(px+s*0.4,py+s*0.3,s*0.2,s*0.18);
  } else {
    // 보라꽃 (tile 32, 법원)
    ctx.fillStyle = "#5aa847"; ctx.fillRect(px,py,s,s);
    ctx.fillStyle = "#2d5a1f"; ctx.fillRect(px+s*0.45,py+s*0.6,2,s*0.35);
    ctx.fillStyle = "#c8a0ff"; ctx.fillRect(px+s*0.25,py+s*0.15,s*0.5,s*0.45);
    ctx.fillStyle = "#9070d0";
    ctx.fillRect(px+s*0.2,py+s*0.25,s*0.1,s*0.2);
    ctx.fillRect(px+s*0.7,py+s*0.25,s*0.1,s*0.2);
    ctx.fillRect(px+s*0.35,py+s*0.5,s*0.3,s*0.08);
    ctx.fillStyle = "#ffd23f"; ctx.fillRect(px+s*0.4,py+s*0.3,s*0.2,s*0.2);
    ctx.fillStyle = "#c08020"; ctx.fillRect(px+s*0.45,py+s*0.38,s*0.1,s*0.06);
  }
}

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
  const picker = $("garden-picker");
  if(picker) picker.innerHTML = "";

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
        // 꽃 스프라이트 canvas
        const cv = document.createElement("canvas");
        cv.style.cssText = "width:44px;height:44px;image-rendering:pixelated;display:block;margin:0 auto 2px;";
        drawFlowerSprite(cv, f.kind, 44);
        cell.appendChild(cv);
        const label = document.createElement("div");
        label.style.cssText = "font-size:8px;color:#2a1a05;line-height:1.2;";
        label.textContent = `No.${f.id}`;
        cell.appendChild(label);
        const rmBtn = document.createElement("button");
        rmBtn.className = "garden-remove-btn";
        rmBtn.dataset.slot = i;
        rmBtn.title = "제거";
        rmBtn.textContent = "✕";
        cell.appendChild(rmBtn);
      }
    } else {
      const icon = document.createElement("div");
      icon.style.cssText = "font-size:20px;opacity:0.4;";
      icon.textContent = "🌱";
      const lbl = document.createElement("div");
      lbl.style.cssText = "font-size:9px;color:#7a5a30;margin-top:2px;";
      lbl.textContent = "심기";
      cell.style.cursor = "pointer";
      cell.appendChild(icon);
      cell.appendChild(lbl);
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
  picker.innerHTML = "";

  const header = document.createElement("div");
  header.style.cssText = "font-weight:700;margin-bottom:8px;font-size:13px;";
  header.textContent = "🌸 심을 꽃을 선택하세요";
  picker.appendChild(header);

  const kindColor = { "법원":"#c8a0ff", "국회":"#5cb3ff", "행정부":"#ff7a5c" };
  available.forEach(f => {
    const row = document.createElement("button");
    row.className = "garden-pick-btn";
    row.style.background = (kindColor[f.kind] || "#ffd23f") + "30";
    row.style.borderColor = kindColor[f.kind] || "#aaa";
    row.style.display = "flex";
    row.style.alignItems = "center";
    row.style.gap = "8px";
    // 작은 꽃 스프라이트
    const cv = document.createElement("canvas");
    cv.style.cssText = "width:28px;height:28px;image-rendering:pixelated;flex-shrink:0;";
    drawFlowerSprite(cv, f.kind, 28);
    const txt = document.createElement("span");
    txt.style.cssText = "font-size:11px;text-align:left;";
    txt.innerHTML = `<b>${f.kind}</b> No.${f.id} — ${f.text.slice(0,24)}…`;
    row.appendChild(cv);
    row.appendChild(txt);
    row.addEventListener("click", () => showFlowerConfirm(f, slotIdx, G));
    picker.appendChild(row);
  });

  const cancelBtn = document.createElement("button");
  cancelBtn.className = "garden-pick-btn";
  cancelBtn.style.cssText = "background:#f0e8d8;margin-top:4px;";
  cancelBtn.textContent = "취소";
  cancelBtn.addEventListener("click", () => { picker.innerHTML = ""; });
  picker.appendChild(cancelBtn);
}

// 꽃 설명 확인 후 심기 확정
function showFlowerConfirm(f, slotIdx, G){
  const picker = $("garden-picker");
  if(!picker) return;
  picker.innerHTML = "";
  const kindColor = { "법원":"#c8a0ff", "국회":"#5cb3ff", "행정부":"#ff7a5c" };

  // 큰 꽃 스프라이트
  const cvWrap = document.createElement("div");
  cvWrap.style.cssText = "text-align:center;margin-bottom:8px;";
  const cv = document.createElement("canvas");
  cv.style.cssText = "width:72px;height:72px;image-rendering:pixelated;display:inline-block;border:2px solid #2a1a05;border-radius:4px;";
  drawFlowerSprite(cv, f.kind, 72);
  cvWrap.appendChild(cv);
  picker.appendChild(cvWrap);

  // 꽃 이름/분류
  const title = document.createElement("div");
  title.style.cssText = "font-weight:700;font-size:13px;margin-bottom:4px;";
  title.innerHTML = `<span style="background:${kindColor[f.kind]||'#ffd23f'};padding:2px 8px;border-radius:3px;font-size:11px;">${f.kind}</span> No.${f.id}`;
  picker.appendChild(title);

  // 설명 전문
  const desc = document.createElement("div");
  desc.style.cssText = "background:#fffaf0;border:2px solid #2a1a05;border-radius:4px;padding:10px;font-size:12px;line-height:1.6;margin-bottom:10px;";
  desc.textContent = f.text;
  picker.appendChild(desc);

  // 버튼 행
  const btns = document.createElement("div");
  btns.style.cssText = "display:flex;gap:8px;";

  const confirmBtn = document.createElement("button");
  confirmBtn.className = "garden-pick-btn";
  confirmBtn.style.cssText = "background:#5cb85c;color:#fff;border-color:#2d5a1f;flex:1;font-size:13px;";
  confirmBtn.textContent = "✅ 확인 — 여기 심기";
  confirmBtn.addEventListener("click", () => {
    gardenPlants[slotIdx] = f.id;
    if(gardenOnSave) gardenOnSave([...gardenPlants]);
    picker.innerHTML = "";
    renderGarden(G);
    toast("🌸 꽃을 심었어요!");
  });

  const backBtn = document.createElement("button");
  backBtn.className = "garden-pick-btn";
  backBtn.style.cssText = "background:#f0e8d8;";
  backBtn.textContent = "← 뒤로";
  backBtn.addEventListener("click", () => showFlowerPicker(slotIdx, G));

  btns.appendChild(backBtn);
  btns.appendChild(confirmBtn);
  picker.appendChild(btns);
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
