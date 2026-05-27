/* 엔진 — 게임 루프, 입력, 카메라, 렌더링 (포켓몬 센터 내 포켓몬 표시 포함) */
window.ENGINE = (() => {

const canvas = document.getElementById("world");
const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;

canvas.width  = 320;
canvas.height = 180;

let TILE = 16;

const state = {
  world: null,
  px: 20*TILE + 8,
  py: 22*TILE + 8,
  facing: "down",
  moving: false,
  moveTimer: 0,
  speed: 60,
  keys: new Set(),
  touchDir: null,
  cam: { x: 0, y: 0 },
  lastTime: 0,
  hooks: { onInteract: null, onStep: null }
};

function init(){
  state.world = window.WORLD.buildWorld();
  resizeListeners();
  hookInput();
  setupTouch();
  state.lastTime = performance.now();
  setInterval(tick, 1000/60);
}

function tick(){
  const t = performance.now();
  loop(t);
}

function hookInput(){
  window.addEventListener("keydown", e => {
    const k = e.key.toLowerCase();
    if(["arrowup","arrowdown","arrowleft","arrowright","w","a","s","d"].includes(k)){
      state.keys.add(k); e.preventDefault();
    }
    if(k===" "||k==="enter"||k==="z"){
      e.preventDefault();
      if(state.hooks.onInteract) state.hooks.onInteract();
    }
    if(k==="escape"){
      window.UI && window.UI.escape && window.UI.escape();
    }
  });
  window.addEventListener("keyup", e => {
    state.keys.delete(e.key.toLowerCase());
  });
}

function setupTouch(){
  const isTouch = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
  if(isTouch || window.innerWidth < 900){
    document.getElementById("touch").classList.add("show");
  }
  const dpad = document.querySelectorAll(".dpad button");
  dpad.forEach(btn => {
    const dir = btn.dataset.dir;
    const start = (e) => { e.preventDefault(); state.touchDir = dir; };
    const end   = (e) => { e.preventDefault(); if(state.touchDir===dir) state.touchDir=null; };
    btn.addEventListener("touchstart", start, {passive:false});
    btn.addEventListener("touchend",   end,   {passive:false});
    btn.addEventListener("touchcancel",end,   {passive:false});
    btn.addEventListener("mousedown", start);
    btn.addEventListener("mouseup",   end);
    btn.addEventListener("mouseleave",end);
  });
  const actBtn = document.getElementById("action-btn");
  actBtn.addEventListener("click", (e)=>{
    e.preventDefault();
    if(state.hooks.onInteract) state.hooks.onInteract();
  });
}

function resizeListeners(){}

function getInputDir(){
  if(state.touchDir && state.touchDir!=="center") return state.touchDir;
  if(state.keys.has("arrowup")   || state.keys.has("w")) return "up";
  if(state.keys.has("arrowdown") || state.keys.has("s")) return "down";
  if(state.keys.has("arrowleft") || state.keys.has("a")) return "left";
  if(state.keys.has("arrowright")|| state.keys.has("d")) return "right";
  return null;
}

function isPassable(gx, gy){
  if(gx<0||gy<0||gx>=window.WORLD.W||gy>=window.WORLD.H) return false;
  const t = state.world[gy][gx];
  return window.WORLD.PASSABLE.has(t);
}

function tryMove(dt){
  if(window.UI && window.UI.isModalOpen && window.UI.isModalOpen()) return;
  const dir = getInputDir();
  if(!dir){ state.moving = false; return; }
  state.facing = dir;
  const dxy = { up:[0,-1], down:[0,1], left:[-1,0], right:[1,0] }[dir];
  const speed = state.speed * dt;
  let nx = state.px + dxy[0] * speed;
  let ny = state.py + dxy[1] * speed;
  const probeX = nx;
  const probeY = ny + 4;
  const gx = Math.floor(probeX / TILE);
  const gy = Math.floor(probeY / TILE);
  if(isPassable(gx, gy)){
    state.px = nx; state.py = ny;
    state.moving = true;
    state.moveTimer += dt;
    if(state.hooks.onStep) state.hooks.onStep(gx, gy);
  } else {
    state.moving = false;
  }
}

function updateCamera(){
  const vw = canvas.width, vh = canvas.height;
  state.cam.x = Math.max(0, Math.min(window.WORLD.W*TILE - vw, state.px - vw/2));
  state.cam.y = Math.max(0, Math.min(window.WORLD.H*TILE - vh, state.py - vh/2));
}

// 포켓몬 센터 내 포켓몬 표시용 슬롯 (센터: cx=28, cy=20, 내부 x:25-31, y:18-21)
const CENTER_SLOTS = [
  [26,19],[27,19],[29,19],[30,19],
  [26,20],[27,20],[29,20],[30,20],
  [25,19],[31,19]
];

function render(){
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const cx = Math.floor(state.cam.x);
  const cy = Math.floor(state.cam.y);
  const startX = Math.floor(cx / TILE);
  const startY = Math.floor(cy / TILE);
  const endX = Math.min(window.WORLD.W, startX + Math.ceil(canvas.width/TILE) + 2);
  const endY = Math.min(window.WORLD.H, startY + Math.ceil(canvas.height/TILE) + 2);

  // 타일
  for(let gy=startY; gy<endY; gy++){
    for(let gx=startX; gx<endX; gx++){
      const t = state.world[gy][gx];
      const px = gx*TILE - cx;
      const py = gy*TILE - cy;
      window.WORLD.drawTile(ctx, t, px, py, TILE, gx, gy);
    }
  }

  const G = window.Game ? window.Game.getState() : {flags:{}, dex:[]};

  // ── 포켓몬 센터 내부에 수집된 포켓몬 표시 ──
  if(G.dex && G.dex.length > 0){
    G.dex.forEach((pid, i) => {
      if(i >= CENTER_SLOTS.length) return;
      const [sgx, sgy] = CENTER_SLOTS[i];
      const sx = sgx*TILE - cx;
      const sy = sgy*TILE - cy;
      if(sx < -TILE*2 || sx > canvas.width+TILE || sy < -TILE*2 || sy > canvas.height+TILE) return;
      // 반짝임 효과
      const t2 = performance.now()/600 + i * 0.8;
      const bob = Math.abs(Math.sin(t2)) * 1.5;
      // 그림자
      ctx.fillStyle = "rgba(0,0,0,0.18)";
      ctx.beginPath();
      ctx.ellipse(sx + TILE*0.5, sy + TILE*0.92, TILE*0.32, TILE*0.1, 0, 0, Math.PI*2);
      ctx.fill();
      window.SPRITES.drawPokemon(ctx, pid, sx, sy - bob, TILE);
      // 빛나는 테두리 (하트 아이콘)
      ctx.fillStyle = "#ff8aa0";
      ctx.font = `${Math.floor(TILE*0.5)}px sans-serif`;
      ctx.fillText("♥", sx + TILE*0.5, sy - TILE*0.1 - bob);
    });
  }

  // NPC들
  window.DATA.NPCS.forEach(npc => {
    if(!shouldShowNPC(npc, G)) return;
    const [gx, gy] = npc.pos;
    const px = gx*TILE - cx, py = gy*TILE - cy;
    if(px < -TILE || px > canvas.width || py < -TILE || py > canvas.height) return;
    window.SPRITES.drawNPC(ctx, npc.kind, px, py-TILE*0.3, TILE, "down");
    // 엔딩 후 이벤트 NPC에 반짝이는 포켓몬 스프라이트 오버레이
    if(isPostEndingNPC(npc) && !isEventDone(npc, G)){
      const t3 = performance.now()/400;
      const glow = 0.5 + Math.sin(t3) * 0.3;
      ctx.fillStyle = `rgba(255,215,0,${glow})`;
      ctx.beginPath();
      ctx.arc(px+TILE/2, py-TILE*0.2, TILE*0.55, 0, Math.PI*2);
      ctx.fill();
      // 물음표
      ctx.fillStyle = "#2a1a05";
      ctx.font = `bold ${TILE}px sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText("?", px+TILE/2, py-TILE*0.5);
      ctx.textAlign = "left";
    }
  });

  // 배틀 트리거
  window.DATA.BATTLE_TRIGGERS.forEach(bt => {
    if(G.battlesDone && G.battlesDone.includes(bt.id)) return;
    const [gx, gy] = bt.pos;
    const px = gx*TILE - cx, py = gy*TILE - cy;
    if(px < -TILE*2 || px > canvas.width || py < -TILE*2 || py > canvas.height) return;
    const t4 = performance.now()/300;
    const a = 0.45 + Math.sin(t4)*0.25;
    ctx.fillStyle = `rgba(180, 60, 240, ${a})`;
    ctx.beginPath();
    ctx.arc(px+TILE/2, py+TILE/2, TILE*0.7, 0, Math.PI*2);
    ctx.fill();
    const bd = window.DATA.BATTLES[bt.id];
    if(bd && bd.enemy){
      const wobble = Math.sin(t4*2) * 1;
      window.SPRITES.drawShape(ctx, bd.enemy.shape, bd.enemy.kind,
        px + wobble, py - TILE*0.2, TILE);
      ctx.fillStyle = "rgba(80, 0, 120, 0.35)";
      ctx.fillRect(px, py - TILE*0.2, TILE, TILE);
      ctx.fillStyle = "#ff40ff";
      ctx.fillRect(px+TILE-3, py-TILE*0.2, 2, 4);
      ctx.fillRect(px+TILE-3, py-TILE*0.2+5, 2, 2);
    }
  });

  // 야생 포켓몬
  window.DATA.ENCOUNTERS.forEach(en => {
    if(G.dex && G.dex.includes(en.pid)) return;
    if(!encounterAvailable(en, G)) return;
    const [gx, gy] = en.pos;
    const px = gx*TILE - cx, py = gy*TILE - cy;
    if(px < -TILE*2 || px > canvas.width || py < -TILE*2 || py > canvas.height) return;
    const t5 = performance.now()/400 + en.pid*0.7;
    const bob = Math.abs(Math.sin(t5)) * 2;
    ctx.fillStyle = "rgba(0, 0, 0, 0.25)";
    ctx.beginPath();
    ctx.ellipse(px+TILE/2, py+TILE*0.9, TILE*0.35, TILE*0.12, 0, 0, Math.PI*2);
    ctx.fill();
    window.SPRITES.drawPokemon(ctx, en.pid, px, py - TILE*0.3 - bob, TILE);
  });

  // 플레이어
  const ppx = Math.floor(state.px - cx - TILE/2);
  const ppy = Math.floor(state.py - cy - TILE*0.8);
  const bob2 = state.moving ? Math.sin(state.moveTimer*8)*1 : 0;
  window.SPRITES.drawPlayer(ctx, ppx, ppy+Math.round(bob2), TILE, state.facing);
}

function shouldShowNPC(npc, G){
  if(npc.id==="hyeon_npc")     return G.flags && G.flags.warehouseTransformed;
  if(npc.id==="nurse")          return G.flags && G.flags.bossBeaten;
  if(npc.id==="principal")      return false;
  if(npc.id==="boss_lee")       return !(G.flags && G.flags.bossBeaten);
  if(npc.id==="heun_event")     return G.flags && G.flags.finalDone;
  if(npc.id==="family_event")   return G.flags && G.flags.finalDone;
  if(npc.id==="supreme_event")  return G.flags && G.flags.finalDone;
  if(npc.id==="sejong_event")   return G.flags && G.flags.finalDone;
  if(npc.id==="patent_event")   return G.flags && G.flags.finalDone;
  if(npc.id==="library_event")  return G.flags && G.flags.finalDone;
  return true;
}

function isPostEndingNPC(npc){
  return ["heun_event","family_event","supreme_event","sejong_event","patent_event","library_event"].includes(npc.id);
}

function isEventDone(npc, G){
  if(!G.flags) return false;
  if(npc.id==="heun_event")    return G.flags.gotHeun;
  if(npc.id==="family_event")  return G.flags.gotFamily;
  if(npc.id==="supreme_event") return G.flags.gotSupreme;
  if(npc.id==="sejong_event")  return G.flags.gotSejong;
  return false;
}

function encounterAvailable(en, G){
  if(en.pid === 5)  return G.flags && G.flags.budgetQuiz;
  if(en.pid === 6)  return G.flags && G.flags.billQuiz;
  if(en.pid === 21) return G.flags && G.flags.metBallot;
  if(en.pid === 22) return G.flags && G.flags.finalDone;
  return true;
}

function loop(t){
  const dt = Math.min(0.05, (t - state.lastTime)/1000) || 0;
  state.lastTime = t;
  tryMove(dt);
  updateCamera();
  render();
}

function setPlayer(gx, gy){
  state.px = gx*TILE + TILE/2;
  state.py = gy*TILE + TILE/2;
}
function getTilePos(){ return [Math.floor(state.px/TILE), Math.floor((state.py+4)/TILE)]; }
function getFacingTile(){
  const [gx, gy] = getTilePos();
  const d = { up:[0,-1], down:[0,1], left:[-1,0], right:[1,0] }[state.facing];
  return [gx + d[0], gy + d[1]];
}
function setHook(name, fn){ state.hooks[name] = fn; }
function getWorld(){ return state.world; }
function setTile(gx, gy, t){ if(state.world[gy]) state.world[gy][gx] = t; }
function getFacing(){ return state.facing; }

return { init, setPlayer, getTilePos, getFacingTile, setHook, getWorld, setTile, getFacing,
         get canvas(){ return canvas; }, get ctx(){ return ctx; }, TILE };
})();
