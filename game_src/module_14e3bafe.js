/* 배틀 시스템 — B-00 ~ B-07 + 오디오 통합 */
window.BATTLE = (() => {

const $ = id => document.getElementById(id);

let current = null;
let busy = false;

function open(battleId, onDone){
  const b = window.DATA.BATTLES[battleId];
  if(!b) return;
  const G = window.Game.getState();
  const alive = G.dex.filter(pid => window.Game.getHP(pid) > 0);
  if(alive.length === 0){
    window.UI.toast("모든 포켓몬이 지쳐있어요! 포켓몬 센터로 가서 회복하세요.");
    if(onDone) onDone(false);
    return;
  }
  let defaultPid = pickBestPokemon(b, G);
  current = { battleId, def:b, enemyHP:b.enemy.hp, enemyMax:b.enemy.hp,
              onDone, currentPid: defaultPid };
  $("battle").classList.add("show");

  $("b-enemy-name").textContent = b.enemy.name;
  setEnemyHPBar(100);
  drawEnemy();
  updatePlayerCard();
  $("b-msg").textContent = b.intro;
  setActions(menuMain());
  busy = false;

  // 배틀 BGM 시작
  if(window.AUDIO) window.AUDIO.playBattleBGM();
}

function pickBestPokemon(b, G){
  if(G.dex.includes(1) && window.Game.getHP(1) > 0) return 1;
  const alive = G.dex.find(pid => window.Game.getHP(pid) > 0);
  return alive || G.dex[0] || 1;
}

function updatePlayerCard(){
  const p = window.DATA.POKEDEX.find(x=>x.id===current.currentPid);
  $("b-player-name").textContent = p ? p.name : "신의반";
  const hp = window.Game.getHP(current.currentPid);
  const max = window.Game.getMaxHP(current.currentPid);
  setPlayerHPBar(Math.round(hp/max*100));
  drawPlayer();
}

function setEnemyHPBar(pct){ setHPBar("b-enemy-hp", pct); }
function setPlayerHPBar(pct){ setHPBar("b-player-hp", pct); }
function setHPBar(elId, pct){
  const el = $(elId);
  el.style.width = pct + "%";
  el.classList.remove("mid","low");
  if(pct <= 25) el.classList.add("low");
  else if(pct <= 50) el.classList.add("mid");
}

function close(victory){
  const cur = current;
  $("battle").classList.remove("show");
  current = null;
  // 필드 BGM 복귀
  if(window.AUDIO) window.AUDIO.playFieldBGM();
  if(cur && cur.onDone) cur.onDone(victory);
}

function drawEnemy(){
  const cv = $("b-enemy-canvas");
  const ctx = cv.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, cv.width, cv.height);
  const e = current.def.enemy;
  window.SPRITES.drawShape(ctx, e.shape, e.kind, 0, 0, 64);
}

function drawPlayer(){
  const cv = $("b-player-canvas");
  const ctx = cv.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, cv.width, cv.height);
  const pid = current.currentPid || 1;
  window.SPRITES.drawPokemon(ctx, pid, 0, 0, 64);
}

function setActions(buttons){
  const c = $("b-actions");
  c.innerHTML = "";
  buttons.forEach(b => {
    const btn = document.createElement("button");
    btn.textContent = b.label;
    btn.disabled = !!b.disabled;
    if(b.back) btn.classList.add("back");
    btn.onclick = b.onClick;
    c.appendChild(btn);
  });
}

function menuMain(){
  return [
    { label:"⚔️ 스킬 사용", onClick: ()=> setActions(menuSkills()) },
    { label:`🔄 포켓몬 교체`, onClick: ()=> setActions(menuSwitch()) },
    { label:"🏃 도망", onClick: ()=> runAway() },
    { label:"❓ 도움말", onClick: ()=> showHelp() }
  ];
}

function showHelp(){
  const def = current.def;
  $("b-msg").textContent = `💡 ${def.failHint || "올바른 포켓몬과 스킬을 사용해야 이길 수 있어요!"}`;
  setActions([{ label:"◀ 돌아가기", back:true, onClick: ()=> setActions(menuMain()) }]);
}

function menuSwitch(){
  const G = window.Game.getState();
  const have = window.DATA.POKEDEX.filter(p => G.dex.includes(p.id));
  const buttons = have.map(p => {
    const hp = window.Game.getHP(p.id);
    const max = window.Game.getMaxHP(p.id);
    const dead = hp <= 0;
    const cur = (p.id===current.currentPid);
    return {
      label: (cur ? "✓ " : "") + p.name + (dead ? " 💤 (기절)" : ` HP ${hp}/${max}`),
      disabled: cur || dead,
      onClick: () => doSwitch(p.id)
    };
  });
  buttons.push({ label:"◀ 돌아가기", back:true, onClick: ()=> setActions(menuMain()) });
  return buttons;
}

function doSwitch(pid){
  const p = window.DATA.POKEDEX.find(x=>x.id===pid);
  current.currentPid = pid;
  updatePlayerCard();
  $("b-msg").textContent = `좋아! ${p.name}, 부탁해!`;
  setActions(menuMain());
}

function menuSkills(){
  const G = window.Game.getState();
  const pid = current.currentPid;
  const p = window.DATA.POKEDEX.find(x=>x.id===pid);
  const opts = [];
  if(p && p.skills){
    const learnedLv = (pid===1) ? 1 : (G.skills[p.name] || 1);
    Object.keys(p.skills).forEach(lvStr => {
      const lv = parseInt(lvStr);
      if(lv > learnedLv) return;
      const skillLabel = p.skills[lv];
      const skill = skillLabel.replace(/\(.*\)/,"").trim();
      opts.push({ label:`Lv${lv} — ${skillLabel}`, skill, owner: p.name, level: lv });
    });
  }
  if(opts.length === 0){
    opts.push({ label:"이 포켓몬은 배틀 스킬이 없어요", disabled:true });
  }
  const buttons = opts.map(o => o.disabled
    ? { label: o.label, disabled: true, onClick: ()=>{} }
    : { label: o.label, onClick: () => useSkill(o.skill, o.owner, o.level) }
  );
  buttons.push({ label:"◀ 돌아가기", back:true, onClick: ()=> setActions(menuMain()) });
  return buttons;
}

function useSkill(skill, owner, level){
  if(busy) return;
  busy = true;
  const def = current.def;
  const needSkill = def.requiredSkill;
  const pid = current.currentPid;

  // 스킬 사용 SFX
  if(window.AUDIO) window.AUDIO.playAttackSFX();

  if(skill !== needSkill){
    $("b-msg").textContent = `${owner}의 [${skill}]! …이 스킬은 이 포켓몬에게 효과가 없어요!`;
    const damage = Math.ceil(window.Game.getMaxHP(pid) / 2);
    const remain = window.Game.damagePokemon(pid, damage);
    updatePlayerCard();
    setTimeout(()=>{
      if(remain <= 0){
        $("b-msg").textContent = `${owner}이(가) 쓰러졌어요…`;
        const G = window.Game.getState();
        const alive = G.dex.filter(id => window.Game.getHP(id) > 0);
        if(alive.length === 0){
          setTimeout(()=> {
            $("b-msg").textContent = "모든 포켓몬이 지쳤어요! 센터에서 회복해야 해요…";
            setActions([{ label:"센터로", onClick: ()=> close(false) }]);
            busy = false;
          }, 900);
        } else {
          setTimeout(()=> {
            $("b-msg").textContent = `${def.failHint || "다른 포켓몬으로 교체해보세요!"}`;
            setActions(menuMain());
            busy = false;
          }, 900);
        }
      } else {
        setTimeout(()=> {
          $("b-msg").textContent = `${def.failHint || "다른 스킬을 써보세요!"}`;
          setActions(menuMain());
          busy = false;
        }, 900);
      }
    }, 1100);
    return;
  }

  // 올바른 스킬 — 승리
  $("b-msg").textContent = `${owner}의 [${skill}]! 효과가 굉장했다!\n${def.concept}`;
  setEnemyHPBar(30);
  setTimeout(()=>{
    setEnemyHPBar(0);
    // 승리 SFX
    if(window.AUDIO) window.AUDIO.playVictorySFX();
    setTimeout(()=>{
      $("b-msg").textContent = def.victory;
      setActions([{ label:"계속", onClick: ()=> { close(true); } }]);
      busy = false;
    }, 700);
  }, 800);
}

function runAway(){
  if(current.def.id === "B00"){
    window.UI.toast("이세린 독재자에게서 도망칠 수 없어요!");
    return;
  }
  close(false);
}

return { open, close, isOpen: ()=> !!current };
})();
