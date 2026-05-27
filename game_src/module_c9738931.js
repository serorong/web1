/* 게임 메인 — 상태·저장·인터랙트·엔카운터·엔딩·엔딩후 이벤트 */
window.Game = (() => {

const SAVE_KEY = "sinui_save_v1";
const $ = id => document.getElementById(id);

const NEXT_PAGE_URL = "https://padlet.com/dajeong/2026-az9q1c4wcdw5gddp";
const PATENT_URL    = "https://padlet.com/dajeong/2026-az9q1c4wcdw5gddp?frame_id=page%3AVcOas2ifkPS6JyPofvRed";

function ballotCleared(){ return !!(state.flags && state.flags.finalDone); }
function openNextPage(){ window.open(NEXT_PAGE_URL, "_blank"); }
function ballotNextDialog(name){
  window.UI.showDialog([
    "(버려진 투표함이 다시 환하게 빛난다…)",
    "여러분의 소중한 한 표가 신의국을 지켜냈어요!",
    "이제 우리 이야기를 들려주러 가요. (다음 페이지로 이동합니다)"
  ], name || "버려진 투표함", () => openNextPage());
}

const initialState = () => ({
  dex: [],
  skills: { 국이:1, 행이:1, 법이:1, 대통령:1, 총리:1, 장관이:1 },
  skillsKnown: {},
  battlesDone: [],
  flowers: { 국회:0, 행정부:0, 법원:0 },
  flowersFound: [],
  hp: {},
  flags: {
    gotMin: false, bossBeaten: false,
    metHyeon: false, finalDone: false,
    firstTrain: false, triedBattle: false,
    warehouseTransformed: false,
    // 엔딩 후 포켓몬 획득 플래그
    gotHeun: false, gotFamily: false, gotSupreme: false, gotSejong: false,
  },
  gardenPlants: new Array(16).fill(null), // 국회 도서관 텃밭 (16칸)
  pos: { gx:20, gy:22 }
});

let state = initialState();

function getState(){ return state; }

function save(){
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); } catch(e){}
}
function load(){
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if(raw){
      const parsed = JSON.parse(raw);
      state = Object.assign(initialState(), parsed);
      // 중첩 객체 병합
      if(parsed.flags) state.flags = Object.assign(initialState().flags, parsed.flags);
      if(!state.gardenPlants || state.gardenPlants.length !== 16){
        state.gardenPlants = new Array(16).fill(null);
        if(parsed.gardenPlants) {
          parsed.gardenPlants.forEach((v,i)=>{ if(i<16) state.gardenPlants[i]=v; });
        }
      }
      // 기존 저장 데이터 마이그레이션: 스킬 자동 습득
      (state.dex || []).forEach(pid => {
        const _p = window.DATA.POKEDEX.find(x => x.id === pid);
        if(_p && _p.skills){
          const _maxLv = Math.max(...Object.keys(_p.skills).map(Number));
          state.skills[_p.name] = Math.max(state.skills[_p.name]||0, _maxLv);
          Object.values(_p.skills).forEach(sl => {
            state.skillsKnown[sl.replace(/\(.*\)/,"").trim()] = true;
          });
          if(_maxLv > 0) state.flags.firstTrain = true;
        }
      });
      return true;
    }
  } catch(e){}
  return false;
}
function reset(){
  state = initialState();
  try { localStorage.removeItem(SAVE_KEY); } catch(e){}
  $("ending").classList.remove("show");
  $("battle").classList.remove("show");
  $("title").classList.remove("hide");
  syncUI();
}

function applyMinjuEvolution(){
  const p = window.DATA.POKEDEX.find(x=>x.id===1);
  if(p && p.evolvedName && state.flags.bossBeaten){
    if(p.name !== p.evolvedName){
      p.name = p.evolvedName;
      p.desc = p.evolvedDesc || p.desc;
      p.learn = "착한 이세린 선생님 · 민주주의 · 삼권분립";
    }
  }
}

// === 시작 ===
function start(){
  $("title").classList.add("hide");
  if(state.pos){ window.ENGINE.setPlayer(state.pos.gx, state.pos.gy); }
  applyMinjuEvolution();
  syncUI();
  updateQuest();
  // 필드 BGM 시작 (클릭 핸들러 내부이므로 즉시 실행 — Autoplay 정책 준수)
  if(window.AUDIO) window.AUDIO.playFieldBGM();
  if(!state.flags.gotMin){
    setTimeout(()=> {
      window.UI.showDialog([
        "여기는 신의국…",
        "이세린 독재자가 삼권을 모두 장악했어요.",
        "풀숲에서 첫 포켓몬을 만나 함께 신의국을 구해주세요!"
      ], "신의국 안내자");
    }, 400);
  }
}

function syncUI(){ window.UI.updateStats(state); }
function updateQuest(){
  const step = window.DATA.QUEST_STEPS.find(s => s.check(state));
  if(step) window.UI.setQuest(step.text);
  else window.UI.setQuest("자유롭게 탐험하세요!");
}

function addPokemon(pid, silent){
  if(state.dex.includes(pid)) return false;
  state.dex.push(pid);
  const p = window.DATA.POKEDEX.find(x=>x.id===pid);
  state.hp = state.hp || {};
  state.hp[pid] = p ? p.hp : 20;
  // 포켓몬을 얻는 즉시 모든 스킬 자동 습득
  const _p = window.DATA.POKEDEX.find(x => x.id === pid);
  if(_p && _p.skills){
    const _maxLv = Math.max(...Object.keys(_p.skills).map(Number));
    state.skills[_p.name] = Math.max(state.skills[_p.name]||0, _maxLv);
    Object.values(_p.skills).forEach(sl => {
      state.skillsKnown[sl.replace(/\(.*\)/,"").trim()] = true;
    });
    state.flags.firstTrain = true;
  }
  if(!silent){
    window.UI.toast(`✨ ${p ? p.name : '?'}을(를) 도감에 등록!`);
    if(window.AUDIO) window.AUDIO.playGetPokemonSFX();
  }
  if(pid === 1) state.flags.gotMin = true;
  syncUI();
  updateQuest();
  save();
  return true;
}

function getHP(pid){
  state.hp = state.hp || {};
  if(state.hp[pid] == null){
    const p = window.DATA.POKEDEX.find(x=>x.id===pid);
    state.hp[pid] = p ? p.hp : 20;
  }
  return state.hp[pid];
}
function setHP(pid, hp){
  state.hp = state.hp || {};
  const p = window.DATA.POKEDEX.find(x=>x.id===pid);
  const max = p ? p.hp : 20;
  state.hp[pid] = Math.max(0, Math.min(max, hp));
  save();
}
function getMaxHP(pid){
  const p = window.DATA.POKEDEX.find(x=>x.id===pid);
  return p ? p.hp : 20;
}
function damagePokemon(pid, amount){
  const cur = getHP(pid);
  setHP(pid, cur - amount);
  return state.hp[pid];
}
function healAll(){
  state.dex.forEach(pid => { state.hp[pid] = getMaxHP(pid); });
  save();
}

function learnSkill(owner, level){
  state.skills[owner] = Math.max(state.skills[owner]||1, level);
  const p = window.DATA.POKEDEX.find(p=>p.name===owner);
  if(p && p.skills && p.skills[level]){
    state.skillsKnown[p.skills[level].replace(/\(.*\)/,"").trim()] = true;
  }
  state.flags.firstTrain = true;
  syncUI();
  updateQuest();
  save();
}

function signMapAt(x, y){
  return window.DATA.MAPS.find(m => m.center[0] === x && m.center[1] === y - 4);
}
function interactSign(x, y){
  const m = signMapAt(x, y);
  if(m && m.id === "M12" && ballotCleared()){
    ballotNextDialog("표지판");
    return;
  }
  window.UI.showDialog([window.WORLD.signTextAt(x, y)], "표지판");
}

// === 인터랙트 ===
function onInteract(){
  if(window.UI.isDialogOpen()){ window.UI.dialogAdvance(); return; }
  if(window.UI.isInputLocked()) return;

  const [fx, fy] = window.ENGINE.getFacingTile();
  const [px, py] = window.ENGINE.getTilePos();

  // 1) NPC
  const npc = window.DATA.NPCS.find(n => {
    if(!shouldShowNPC(n)) return false;
    const [nx, ny] = n.pos;
    return (nx === fx && ny === fy) || (Math.abs(nx-px)+Math.abs(ny-py) <= 1 && nx===fx && ny===fy);
  });
  if(npc){ handleNPC(npc); return; }
  const nearby = window.DATA.NPCS.find(n => {
    if(!shouldShowNPC(n)) return false;
    const [nx, ny] = n.pos;
    return Math.abs(nx-px)+Math.abs(ny-py) <= 1;
  });
  if(nearby){ handleNPC(nearby); return; }

  // 2) 배틀 트리거
  const bt = window.DATA.BATTLE_TRIGGERS.find(b => {
    if(state.battlesDone.includes(b.id)) return false;
    const [bx, by] = b.pos;
    return Math.abs(bx-px)+Math.abs(by-py) <= 1;
  });
  if(bt){ startBattle(bt.id); return; }

  // 3) 표지판
  const t  = window.ENGINE.getWorld()[fy] && window.ENGINE.getWorld()[fy][fx];
  const th = window.ENGINE.getWorld()[py] && window.ENGINE.getWorld()[py][px];
  if(t === 9){ interactSign(fx, fy); return; }
  if(th === 9){ interactSign(px, py); return; }

  // 4) 야생 포켓몬
  const enc = window.DATA.ENCOUNTERS.find(e => {
    if(state.dex.includes(e.pid)) return false;
    if(!encounterAvailable(e)) return false;
    const [ex, ey] = e.pos;
    return Math.abs(ex-px)+Math.abs(ey-py) <= 1;
  });
  if(enc){ encounter(enc); return; }

  // 5) 투표함
  if(th === 14 || t === 14){ handleBallotBox(); return; }
}

function shouldShowNPC(npc){
  if(npc.id==="hyeon_npc")     return state.flags.warehouseTransformed;
  if(npc.id==="principal")      return false;
  if(npc.id==="boss_lee")       return !state.flags.bossBeaten;
  // 엔딩 후 이벤트 NPC
  if(npc.id==="heun_event")     return state.flags.finalDone;
  if(npc.id==="family_event")   return state.flags.finalDone;
  if(npc.id==="supreme_event")  return state.flags.finalDone;
  if(npc.id==="sejong_event")   return state.flags.finalDone;
  if(npc.id==="patent_event")   return state.flags.finalDone;
  if(npc.id==="library_event")  return state.flags.finalDone;
  return true;
}

function encounterAvailable(en){
  if(en.pid === 1) return true;
  return state.flags.bossBeaten;
}

// === NPC 처리 ===
function handleNPC(npc){
  if(npc.battle){
    window.UI.showDialog(npc.lines, npc.name, () => {
      if(npc.battle === "B00" && !state.dex.includes(1)){
        window.UI.toast("민쥬가 있어야 도전할 수 있어요!"); return;
      }
      startBattle(npc.battle);
    });
    return;
  }
  if(npc.id === "hyeon_npc"){
    if(state.flags.finalDone){
      window.UI.showDialog(["고마워, 신의반 친구들!","이제 신의국은 진정한 민주 국가가 되었어!"], npc.name);
      return;
    }
    window.UI.showDialog(npc.lines, npc.name, () => {
      state.flags.metHyeon = true; save();
      setTimeout(()=> {
        window.QUIZ.openFinal((ok)=> {
          if(ok){ window.Game.completeFinal(); }
          else  { window.UI.toast("아쉬워요. 다시 도전해보세요!"); }
        });
      }, 300);
    });
    return;
  }
  if(npc.id === "ballot_npc" && ballotCleared()){
    ballotNextDialog(npc.name); return;
  }
  // ── 엔딩 후 이벤트 ──
  if(npc.id === "heun_event")    { handleHeunEvent();    return; }
  if(npc.id === "family_event")  { handleFamilyEvent();  return; }
  if(npc.id === "supreme_event") { handleSupremeEvent(); return; }
  if(npc.id === "sejong_event")  { handleSejongEvent();  return; }
  if(npc.id === "patent_event")  { handlePatentEvent();  return; }
  if(npc.id === "library_event") { handleLibraryEvent(); return; }
  if(npc.id === "nurse_npc"){
    healAll();
    window.UI.showDialog(["다친 포켓몬이 있으면 치료해줄게요. 이제 모두 다 회복되었어요!"], "센터 간호사");
    return;
  }

  window.UI.showDialog(npc.lines, npc.name);
}

// ── 헌법재판소 (꽃 도감 완성 필요) ──
function handleHeunEvent(){
  const allFlowers = (window.DATA.FLOWERS || []).length;
  const found = (state.flowersFound || []).filter(id =>
    window.DATA.FLOWERS.some(f => f.id === id)).length;
  if(state.flags.gotHeun){
    window.UI.showDialog([
      "헌법재판소는 법률이 헌법에 어긋나는지 심판하는 기관이에요.",
      "헌이가 함께 있어서 든든해요!"
    ], "헌이");
    return;
  }
  if(found < allFlowers){
    window.UI.showDialog([
      "꽃 도감을 모두 채워야 헌이를 만날 수 있어요!",
      `현재 ${found}/${allFlowers} 개를 수집했어요.`,
      "세상 곳곳의 꽃들을 찾아보세요!"
    ], "헌이");
    return;
  }
  window.UI.showDialog([
    "✨ 꽃 도감을 완성했군요!",
    "헌법재판소는 법률이 헌법에 어긋나는지 심판하는 기관이에요.",
    "모든 지식을 모은 당신에게 헌이가 힘을 보태고 싶어해요!"
  ], "헌이", () => {
    state.flags.gotHeun = true;
    addPokemon(5);
    save();
    setTimeout(checkAllHiddenComplete, 600);
  });
}

// ── 가정법원 ──
function handleFamilyEvent(){
  if(state.flags.gotFamily){
    window.UI.showDialog([
      "형법은 우리 모두를 지켜줍니다.",
      "가정이가 함께 있어서 든든해요!"
    ], "가정이");
    return;
  }
  window.UI.showDialog([
    "형법 제329조 (단순절도): 타인의 재물을 절취한 자는 6년 이하의 징역 또는 1천만 원 이하의 벌금에 처합니다.",
    "형법 제331조 (특수절도): 야간에 문이나 벽을 부수고 침입하거나, 2인 이상이 합동하여 타인의 재물을 절취한 경우에 성립합니다.",
    "청소년들이 친구들과 몰려다니며 무인 점포를 털 때 주로 적용되며, 1년 이상 10년 이하의 징역으로 벌금형 없이 무겁게 처벌됩니다.",
    "가정이가 이 사실을 알려줬어요. 앞으로 올바른 길을 걸어요!"
  ], "가정이", () => {
    state.flags.gotFamily = true;
    addPokemon(6);
    save();
    setTimeout(checkAllHiddenComplete, 600);
  });
}

// ── 서울 대법원 ──
function handleSupremeEvent(){
  if(state.flags.gotSupreme){
    window.UI.showDialog([
      "형법은 모든 폭력으로부터 우리를 지킵니다.",
      "대법이가 함께 있어서 든든해요!"
    ], "대법이");
    return;
  }
  window.UI.showDialog([
    "형법 제260조 (폭행): 타인의 신체에 대해 불법적인 물리력을 행사한 경우 성립하며, 2년 이하의 징역 또는 500만 원 이하의 벌금에 처합니다.",
    "폭행은 단순한 다툼이 아닌 범죄행위예요. 신체적 피해를 주는 모든 행위가 해당됩니다.",
    "대법원 최고 재판부가 이 사실을 알려줬어요!"
  ], "대법이", () => {
    state.flags.gotSupreme = true;
    addPokemon(7);
    save();
    setTimeout(checkAllHiddenComplete, 600);
  });
}

// ── 정부세종청사 (꽃 퀴즈 16문항) ──
function handleSejongEvent(){
  if(state.flags.gotSejong){
    window.UI.showDialog([
      "청사이와 함께라면 어떤 지식도 두렵지 않아요!",
      "도감에서 청사이를 확인해보세요."
    ], "정부청사 안내원");
    return;
  }
  const allFlowers = (window.DATA.FLOWERS || []).length;
  const found = (state.flowersFound || []).filter(id =>
    window.DATA.FLOWERS.some(f => f.id === id)).length;
  if(found < allFlowers){
    window.UI.showDialog([
      "꽃 도감 16개를 먼저 모아야 해요!",
      `현재 ${found}/${allFlowers} 개 수집 중이에요.`,
      "세상 곳곳의 꽃들을 찾아보세요!"
    ], "정부청사 안내원");
    return;
  }
  window.UI.showDialog([
    "꽃 도감 16개를 완성했군요! 훌륭해요!",
    "정현중이 낸 것처럼, 꽃 도감 설명에서 핵심 단어가 빠진 16개 문제를 드릴게요.",
    "16개를 모두 맞추면 청사이를 드릴게요!"
  ], "정부청사 안내원", () => {
    setTimeout(()=> window.QUIZ.openSejongQuiz((ok)=> {
      if(ok){
        state.flags.gotSejong = true;
        addPokemon(8);
        save();
        window.UI.toast("🏛️ 청사이를 획득했어요!");
        setTimeout(checkAllHiddenComplete, 600);
      } else {
        window.UI.toast("아쉬워요. 다시 도전해보세요!");
      }
    }), 300);
  });
}

// ── 숨겨진 포켓몬 4마리 모두 수집 완료 체크 ──
function checkAllHiddenComplete(){
  const f = state.flags;
  if(f.gotHeun && f.gotFamily && f.gotSupreme && f.gotSejong && !f.allHiddenDone){
    f.allHiddenDone = true;
    save();
    setTimeout(() => {
      window.UI.showDialog([
        "정말 대단해! 모든 포켓몬을 다 찾았구나!",
        "이렇게 권력 분립을 통해서 한 국가기관이 권력을 독차지하지 않게 하고,",
        "국민의 자유와 권리를 보장한다는 걸 이제 알겠지?"
      ], "착한 이세린 선생님");
    }, 800);
  }
}

// ── 대전 특허법원 (Padlet 이동) ──
function handlePatentEvent(){
  window.UI.showDialog([
    "대전 특허법원에 오신 걸 환영해요!",
    "이곳에서 특별한 발명품들을 볼 수 있어요.",
    "다음 페이지로 이동합니다…"
  ], "특허법원 안내원", () => {
    window.open(PATENT_URL, "_blank");
  });
}

// ── 국회 도서관 (텃밭 심기) ──
function handleLibraryEvent(){
  window.UI.showDialog([
    "국회 도서관에 오신 걸 환영해요!",
    "모은 꽃들을 텃밭 16칸에 심어볼 수 있어요.",
    "각 칸을 눌러 꽃을 심어보세요!"
  ], "국회 사서", () => {
    setTimeout(()=> window.UI.openGarden(state, (plants)=>{
      state.gardenPlants = plants;
      save();
    }), 300);
  });
}

// === 야생 포켓몬 조우 ===
function encounter(en){
  const p = window.DATA.POKEDEX.find(x=>x.id===en.pid);
  if(window.AUDIO) window.AUDIO.playEncounterSFX();
  window.UI.showDialog([
    `야생의 ${p.name}이(가) 나타났다!`,
    p.desc,
    `${p.name}을(를) 도감에 등록합니다.`
  ], "조우!", () => {
    addPokemon(en.pid);
    if(en.pid === 1){
      setTimeout(()=> {
        window.UI.showDialog([
          "민쥬가 [삼권분립의의] 기술을 알고 있어요!",
          "이 기술로 이세린 독재자를 격퇴할 수 있어요.",
          "궁전(M-01 안쪽)으로 가서 이세린에게 도전하세요!"
        ], "민쥬");
      }, 200);
    }
  });
}

// === 투표함 ===
function handleBallotBox(){
  if(ballotCleared()){ ballotNextDialog("버려진 투표함"); return; }
  window.UI.showDialog([
    "(투표함이 슬프게 놓여있다…)",
    "투표하지 않으면 우리의 주권은 사라져요.",
    "꼭 투표에 참여하세요."
  ], "버려진 투표함");
}

// === 배틀 ===
function startBattle(battleId){
  const def = window.DATA.BATTLES[battleId];
  if(battleId !== "B00"){ state.flags.triedBattle = true; updateQuest(); }
  window.BATTLE.open(battleId, (victory) => {
    if(victory){ onBattleWin(battleId, def); }
    else { if(battleId !== "B00") window.UI.toast(def.failHint || "더 강한 스킬이 필요해요!"); }
    save();
  });
}

function onBattleWin(battleId, def){
  if(!state.battlesDone.includes(battleId)) state.battlesDone.push(battleId);
  syncUI();
  checkAllBattlesDone();
  if(battleId === "B00"){
    state.flags.bossBeaten = true;
    applyMinjuEvolution();
    syncUI(); updateQuest();
    setTimeout(()=> {
      window.UI.showDialog([
        "이세린 독재자가 격퇴되었다!",
        "✨ 민쥬가 진화했어요! → [착한 이세린 선생님]",
        "국이·행이·법이를 만나면 스킬이 즉시 준비돼요!"
      ], "신의국 안내자");
    }, 300);
    return;
  }
  updateQuest();
}

function checkAllBattlesDone(){
  const totalChecks = ["B01","B02","B03","B04","B05","B06","B07"];
  const allDone = totalChecks.every(id => state.battlesDone.includes(id));
  if(allDone && !state.flags.warehouseTransformed){
    state.flags.warehouseTransformed = true;
    transformWarehouseToSchool();
    window.UI.toast("🎉 숨겨진 창고가 신의국 교실로 변했어요! 가서 정현중 반장을 만나세요!", 4500);
    save();
  }
}

function transformWarehouseToSchool(){
  const set = (x, y, t) => window.ENGINE.setTile(x, y, t);
  for(let y=18; y<=21; y++){
    for(let x=0; x<=3; x++){
      if(y===18 || y===21 || x===0 || x===3) set(x, y, 41);
      else set(x, y, 6);
    }
  }
  set(2, 21, 8);
  if(17 >= 0) set(2, 17, 52);
}

// === 꽃 수집 ===
function collectFlower(gx, gy){
  const w = window.ENGINE.getWorld();
  if(!w[gy]) return false;
  const t = w[gy][gx];
  if(t !== 30 && t !== 31 && t !== 32) return false;
  const flower = (window.DATA.FLOWERS || []).find(f => f.pos[0]===gx && f.pos[1]===gy);
  if(!flower) return false;
  state.flowersFound = state.flowersFound || [];
  if(state.flowersFound.includes(flower.id)) return false;
  state.flowersFound.push(flower.id);
  state.flowers = state.flowers || { 국회:0, 행정부:0, 법원:0 };
  state.flowers[flower.kind] = (state.flowers[flower.kind]||0) + 1;
  window.ENGINE.setTile(gx, gy, 0);
  if(window.AUDIO) window.AUDIO.playCollectSFX();
  window.UI.toast(`🌸 [${flower.kind}] ${flower.text}`, 4500);
  syncUI();
  save();
  return true;
}

let lastEncounterTile = null;
function onStep(gx, gy){
  if(collectFlower(gx, gy)) return;
  if(lastEncounterTile && lastEncounterTile[0]===gx && lastEncounterTile[1]===gy) return;
  const t = window.ENGINE.getWorld()[gy] && window.ENGINE.getWorld()[gy][gx];
  if(t === 1){
    const enc = window.DATA.ENCOUNTERS.find(e => {
      if(state.dex.includes(e.pid)) return false;
      if(!encounterAvailable(e)) return false;
      const [ex, ey] = e.pos;
      return Math.abs(ex-gx)+Math.abs(ey-gy) <= 1;
    });
    if(enc){
      lastEncounterTile = [gx,gy];
      window.UI.toast("풀숲에서 무언가 움직인다! (스페이스/A로 만나기)");
    }
  } else {
    lastEncounterTile = null;
  }
}

// === 최종 퀴즈 통과 ===
function completeFinal(){
  state.flags.finalDone = true;
  addPokemon(22, true);
  save();
  updateQuest();
  setTimeout(showEnding, 600);
}

// === 엔딩 ===
function showEnding(){
  const e = $("ending");
  const h1 = e.querySelector("h1");
  if(h1) h1.style.opacity = "0";
  const cred  = $("ending-credits"); if(cred)  cred.style.display = "none";
  const party = $("ending-party");   if(party) party.style.display = "none";
  const btns  = e.querySelector("div:last-child"); if(btns) btns.style.opacity = "0";

  const drawNPCCanvas = (cvId, kind) => {
    const cv = $(cvId); if(!cv) return;
    const c = cv.getContext("2d");
    c.imageSmoothingEnabled = false;
    c.clearRect(0, 0, cv.width, cv.height);
    window.SPRITES.drawNPC(c, kind, 0, 0, 64, "down");
  };
  drawNPCCanvas("end-hyeon",    "반장");
  drawNPCCanvas("end-principal","교장");

  $("end-name").textContent = "교장선생님";
  $("end-text").textContent = "신의반 친구들, 정말 자랑스러워요! 여러분이 삼권분립과 민주주의를 직접 지켜냈어요. 박수! 👏";

  const endDelay = 3200;
  setTimeout(() => {
    if(h1){ h1.style.transition = "opacity 0.8s"; h1.style.opacity = "1"; }
    if(cred)  cred.style.display = "";
    if(party) party.style.display = "";
    if(btns){ btns.style.transition = "opacity 0.8s"; btns.style.opacity = "1"; }
  }, endDelay);

  const credits = $("ending-credits");
  credits.innerHTML = `
    <div style="font-size:18px; color:#a01818;">🏛️ 신의국이 민주적으로 재건되었습니다!</div>
    <hr style="margin:10px 0; border:none; border-top:2px dashed #2a1a05;">
    <div style="font-size:13px;">
      포켓몬 팀: <b>${state.dex.length}</b><br>
      견제 배틀: <b>${state.battlesDone.filter(id=>id!=="B00").length} / 7</b><br>
      꽃 도감: <b>${(state.flowersFound||[]).filter(id=>window.DATA.FLOWERS.some(f=>f.id===id)).length} / ${window.DATA.FLOWERS.length}</b><br>
      <br><small style="color:#7a5a30;">🌟 엔딩 후 — 헌법재판소·가정법원·대법원·정부청사·특허법원·국회도서관에서 새로운 이벤트가 열렸어요!</small>
    </div>
  `;
  party.innerHTML = "";
  state.dex.forEach(pid => {
    const cv = document.createElement("canvas");
    cv.width = 32; cv.height = 32;
    const c = cv.getContext("2d");
    c.imageSmoothingEnabled = false;
    window.SPRITES.drawPokemon(c, pid, 0, 0, 32);
    party.appendChild(cv);
  });
  e.classList.add("show");
}

function continueAfter(){
  $("ending").classList.remove("show");
  window.UI.toast("자유 탐험 모드! 새로운 포켓몬을 찾아보세요. 🗺️");
}

// === 타이틀 ===
function setupTitle(){
  const balls = $("title-balls");
  for(let i=0; i<5; i++){
    const cv = document.createElement("canvas");
    cv.width = 32; cv.height = 32;
    const c = cv.getContext("2d");
    c.imageSmoothingEnabled = false;
    window.SPRITES.drawPokeball(c, 0, 0, 32);
    balls.appendChild(cv);
  }
  $("start-btn").addEventListener("click", () => { start(); });
}

// === 초기화 ===
function boot(){
  window.ENGINE.init();
  window.ENGINE.setHook("onInteract", onInteract);
  window.ENGINE.setHook("onStep", onStep);
  load();
  setupTitle();
  syncUI();
  if(state.dex.length > 0){
    $("start-btn").textContent = "▶ 이어하기";
    const opt = document.createElement("button");
    opt.className = "start-btn";
    opt.style.background = "#6c757d";
    opt.textContent = "↺ 처음부터";
    opt.onclick = () => { reset(); start(); };
    $("title-buttons").appendChild(opt);
  }
  updateQuest();
}

if(document.readyState === "loading"){
  document.addEventListener("DOMContentLoaded", boot);
} else {
  boot();
}

return { getState, start, save, load, reset, addPokemon, learnSkill,
         completeFinal, continue: continueAfter,
         getHP, setHP, getMaxHP, damagePokemon, healAll };
})();
