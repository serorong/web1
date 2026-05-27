/* 오버월드 맵 시스템 v2 — 건물별 외관 차별화 + 꽃 + 지붕 장식
   타일 코드:
     0  grass        1  tall_grass     2  path
     3  tree         4  water          5  wall(회색)
     6  floor        7  carpet         8  door
     9  sign         10 stone          11 fence
     12 flower(기본) 13 fountain       14 ballotbox
     30 행정부꽃     31 국회꽃         32 법원꽃
     40 흰 대리석    41 빨간 벽돌      42 갈색 나무벽
     43 파란 벽      44 책장 벽
     50 청록 돔      51 빨간 십자가    52 시계
     53 파란 지붕    54 그리스 기둥    55 책더미
     56 별 장식      57 짚더미         58 가족 표식
     59 전구 장식    60 투표함 표식
*/
window.WORLD = (() => {

const W = 60, H = 42;
const TILE = 16;

// 통과 가능 — 꽃(30~32) 추가, 길 / 잔디 등
const PASSABLE = new Set([0,1,2,6,7,8,10,12,30,31,32]);

function makeWorld(){
  const grid = [];
  for(let y=0; y<H; y++){
    const row = [];
    for(let x=0; x<W; x++){
      if(x===0||y===0||x===W-1||y===H-1) row.push(3);
      else row.push(0);
    }
    grid.push(row);
  }
  return grid;
}

function fillRect(g, x1, y1, x2, y2, t){
  for(let y=y1; y<=y2; y++)
    for(let x=x1; x<=x2; x++)
      if(x>=0&&x<W&&y>=0&&y<H) g[y][x] = t;
}

// 건물 — 외벽/문/지붕 장식 / 변형 벽 타일
function building(g, cx, cy, w, h, opts){
  opts = opts || {};
  const wallTile = opts.wallTile || 5;
  const floorTile = opts.floorTile || 6;
  const x1 = cx - Math.floor(w/2), y1 = cy - Math.floor(h/2);
  const x2 = x1 + w - 1, y2 = y1 + h - 1;
  for(let y=y1; y<=y2; y++)
    for(let x=x1; x<=x2; x++){
      if(x<0||x>=W||y<0||y>=H) continue;
      if(y===y1||y===y2||x===x1||x===x2) g[y][x] = wallTile;
      else g[y][x] = floorTile;
    }
  // 문 (남쪽 벽 중앙)
  const dx = opts.doorX!=null ? opts.doorX : cx;
  const dy = opts.doorY!=null ? opts.doorY : y2;
  if(dy<H && dx<W) g[dy][dx] = 8;
  // 지붕 장식 (y1-1 위치)
  if(opts.roofDec != null){
    const rx = opts.roofX != null ? opts.roofX : cx;
    const ry = y1 - 1;
    if(ry>=0 && rx<W) g[ry][rx] = opts.roofDec;
  }
  // 추가 지붕 장식 2개 (대법원/헌재 기둥 양쪽)
  if(opts.roofDec2 != null && opts.roofX2 != null){
    const ry = y1 - 1;
    if(ry>=0 && opts.roofX2 < W) g[ry][opts.roofX2] = opts.roofDec2;
  }
  if(opts.roofDec3 != null && opts.roofX3 != null){
    const ry = y1 - 1;
    if(ry>=0 && opts.roofX3 < W) g[ry][opts.roofX3] = opts.roofDec3;
  }
}

function tallGrassPatch(g, cx, cy, r){
  for(let dy=-r; dy<=r; dy++){
    for(let dx=-r; dx<=r; dx++){
      const d = Math.hypot(dx, dy);
      if(d <= r && Math.random() < 0.7) {
        const x = cx+dx, y = cy+dy;
        if(x>0&&x<W-1&&y>0&&y<H-1 && g[y][x]===0) g[y][x] = 1;
      }
    }
  }
}

function pathBetween(g, a, b, t=2){
  let [x,y] = a; const [tx,ty] = b;
  while(x !== tx){
    if(g[y][x] === 0 || g[y][x] === 1) g[y][x] = t;
    x += Math.sign(tx-x);
  }
  while(y !== ty){
    if(g[y][x] === 0 || g[y][x] === 1) g[y][x] = t;
    y += Math.sign(ty-y);
  }
  if(g[y][x] === 0 || g[y][x] === 1) g[y][x] = t;
}

function treeBlob(g, cx, cy, r){
  for(let dy=-r; dy<=r; dy++)
    for(let dx=-r; dx<=r; dx++){
      const d = Math.hypot(dx, dy);
      if(d <= r && Math.random() < 0.6){
        const x = cx+dx, y = cy+dy;
        if(x>1&&x<W-2&&y>1&&y<H-2 && g[y][x]===0) g[y][x] = 3;
      }
    }
}

function buildWorld(){
  const g = makeWorld();
  const M = window.DATA.MAPS;
  const hub = [28, 20];
  // 광장
  fillRect(g, 26, 18, 30, 22, 10);
  // 경로
  M.forEach(m => pathBetween(g, m.center, hub, 2));

  // ── 건물별 외관 차별화 ──
  // 국회의사당 — 흰 대리석 + 청록 돔
  building(g, 10, 12, 8, 6, { wallTile:40, doorY:14, roofDec:50 });
  // 국회도서관 — 갈색 + 책더미
  building(g, 10, 26, 7, 5, { wallTile:42, doorY:28, roofDec:55 });
  // 정부서울청사 — 회색 + 깃대(별)
  building(g, 32, 12, 8, 6, { wallTile:5, doorY:14, roofDec:56 });
  // 정부세종청사 — 회색
  building(g, 44, 22, 7, 5, { wallTile:5, doorY:24 });
  // 대통령 집무실 — 흰 벽 + 파란 지붕
  building(g, 32, 28, 8, 6, { wallTile:40, doorY:30, roofDec:53 });
  // 대법원 — 흰 대리석 + 그리스 기둥 3개
  building(g, 20, 8, 9, 5, { wallTile:40, doorY:10,
    roofDec:54, roofX:20,
    roofDec2:54, roofX2:18,
    roofDec3:54, roofX3:22 });
  // 헌법재판소 — 흰 대리석 + 기둥 3개
  building(g, 20, 36, 9, 5, { wallTile:40, doorY:38,
    roofDec:54, roofX:20,
    roofDec2:54, roofX2:18,
    roofDec3:54, roofX3:22 });
  // 가정법원 — 회색 + 하트(가족)
  building(g, 8, 34, 5, 4, { wallTile:5, doorY:35, roofDec:58 });
  // 특허법원 — 회색 + 전구
  building(g, 52, 34, 5, 4, { wallTile:5, doorY:35, roofDec:59 });
  // 선관위 — 흰 대리석 + 투표함
  building(g, 44, 6, 6, 4, { wallTile:40, doorY:7, roofDec:60 });
  // 신의국 교실 — 빨간 벽돌 + 시계
  building(g, 8, 6, 7, 5, { wallTile:41, doorY:8, roofDec:52 });
  // 센터 내부 카펫 추가
  fillRect(g, 25, 18, 31, 21, 7);
  // 숨겨진 창고 — 갈색 나무 + 짚더미
  building(g, 2, 20, 4, 4, { wallTile:42, doorY:21, roofDec:57 });

  // 투표함 공터
  fillRect(g, 50, 13, 54, 16, 10);
  g[15][52] = 14;

  // 풀숲
  tallGrassPatch(g, 19, 22, 3);
  tallGrassPatch(g, 22, 22, 2);
  tallGrassPatch(g, 12, 14, 2);
  tallGrassPatch(g, 33, 14, 2);
  tallGrassPatch(g, 35, 11, 1);
  tallGrassPatch(g, 34, 30, 2);
  tallGrassPatch(g, 22, 10, 2);
  tallGrassPatch(g, 22, 38, 2);
  tallGrassPatch(g, 46, 8, 2);

  // 자연 장식
  treeBlob(g, 5, 16, 3);
  treeBlob(g, 55, 9, 3);
  treeBlob(g, 50, 28, 3);
  treeBlob(g, 5, 28, 2);
  treeBlob(g, 15, 20, 2);
  treeBlob(g, 40, 35, 3);
  fillRect(g, 38, 18, 40, 20, 4);
  g[24][20] = 13; // 분수

  // 표지판
  M.forEach(m => {
    const [cx, cy] = m.center;
    const sx = cx, sy = cy + 4;
    if(sy<H-1 && (g[sy][sx]===0||g[sy][sx]===2||g[sy][sx]===10)){
      g[sy][sx] = 9;
    }
  });

  // 광장 일반 꽃 장식 — 제거 (학습 꽃만 보이게)
  // for(let i=0;i<10;i++){ ... }

  // ── 학습 꽃 (FLOWERS 데이터에서 자동 배치) ──
  (window.DATA.FLOWERS || []).forEach(f => {
    const [x, y] = f.pos;
    if(g[y] && g[y][x] !== undefined){
      const t = g[y][x];
      if(t===0||t===1||t===2||t===10||t===12) g[y][x] = f.color;
    }
  });

  return g;
}

function signTextAt(x, y){
  const m = window.DATA.MAPS.find(m => {
    const [cx, cy] = m.center;
    return cx === x && cy === y - 4;
  });
  return m ? `[ ${m.id} ] ${m.name}` : "표지판";
}

// ============ 타일 그리기 ============
function drawTile(ctx, t, px, py, size, gx, gy){
  switch(t){
    case 0: { // grass
      const bg = ((gx+gy)%2===0) ? "#6fb55a" : "#5aa847";
      ctx.fillStyle = bg; ctx.fillRect(px,py,size,size);
      if((gx*7+gy*3)%9===0){
        ctx.fillStyle = "#4a8a3a";
        ctx.fillRect(px+size*0.3, py+size*0.4, 2, 2);
      }
      return;
    }
    case 1: { // tall grass
      const bg = ((gx+gy)%2===0) ? "#6fb55a" : "#5aa847";
      ctx.fillStyle = bg; ctx.fillRect(px,py,size,size);
      ctx.fillStyle = "#2d5a1f";
      const s = size/8;
      ctx.fillRect(px+s, py+s*4, s, s*3);
      ctx.fillRect(px+s*3, py+s*3, s, s*4);
      ctx.fillRect(px+s*5, py+s*4, s, s*3);
      ctx.fillRect(px+s*7-1, py+s*5, s, s*2);
      ctx.fillStyle = "#3d7a2b";
      ctx.fillRect(px+s*2, py+s*5, s, s);
      ctx.fillRect(px+s*4, py+s*4, s, s);
      ctx.fillRect(px+s*6, py+s*5, s, s);
      return;
    }
    case 2: { // path
      ctx.fillStyle = "#d4b896"; ctx.fillRect(px,py,size,size);
      ctx.fillStyle = "#b8a070";
      ctx.fillRect(px, py, size, 1);
      ctx.fillRect(px, py+size-1, size, 1);
      if((gx*5+gy*7)%6===0){
        ctx.fillStyle = "#8c7050";
        ctx.fillRect(px+size*0.3, py+size*0.4, 2, 2);
      }
      return;
    }
    case 3: { // tree
      ctx.fillStyle = "#5aa847"; ctx.fillRect(px,py,size,size);
      ctx.fillStyle = "#5a3a1a";
      ctx.fillRect(px+size*0.4, py+size*0.6, size*0.2, size*0.4);
      ctx.fillStyle = "#2d5a1f";
      ctx.fillRect(px+size*0.15, py+size*0.1, size*0.7, size*0.55);
      ctx.fillStyle = "#3d7a2b";
      ctx.fillRect(px+size*0.25, py+size*0.2, size*0.5, size*0.3);
      return;
    }
    case 4: { // water
      ctx.fillStyle = "#3a7dc4"; ctx.fillRect(px,py,size,size);
      ctx.fillStyle = "#5a9dd6";
      ctx.fillRect(px, py+size*0.3, size, 2);
      ctx.fillRect(px, py+size*0.7, size, 2);
      ctx.fillStyle = "#8acdf6";
      ctx.fillRect(px+size*0.5, py+size*0.5, 2, 2);
      return;
    }
    case 5: { // wall — 회색 (정부청사, 일반 법원)
      ctx.fillStyle = "#9a8060"; ctx.fillRect(px,py,size,size);
      ctx.fillStyle = "#7a6040";
      ctx.fillRect(px, py+size*0.3, size, 2);
      ctx.fillRect(px, py+size*0.7, size, 2);
      ctx.fillStyle = "#b8a080";
      ctx.fillRect(px+size*0.1, py+size*0.05, size*0.2, size*0.2);
      return;
    }
    case 40: { // 흰 대리석 벽 (국회, 대법원, 헌재, 선관위)
      ctx.fillStyle = "#e8e0d0"; ctx.fillRect(px,py,size,size);
      ctx.fillStyle = "#b8b0a0";
      ctx.fillRect(px, py+size*0.35, size, 1);
      ctx.fillRect(px, py+size*0.7, size, 1);
      // 결
      ctx.fillStyle = "#c8c0b0";
      ctx.fillRect(px+size*0.6, py+size*0.1, size*0.05, size*0.2);
      ctx.fillRect(px+size*0.2, py+size*0.5, size*0.05, size*0.15);
      return;
    }
    case 41: { // 빨간 벽돌 (학교, 센터)
      ctx.fillStyle = "#c84a3a"; ctx.fillRect(px,py,size,size);
      ctx.fillStyle = "#9a3020";
      // 벽돌 격자
      ctx.fillRect(px, py+size*0.33, size, 1);
      ctx.fillRect(px, py+size*0.66, size, 1);
      // 세로 (offset 격자)
      const off = ((gy)%2===0) ? 0 : size*0.5;
      ctx.fillRect(px+off, py, 1, size*0.33);
      ctx.fillRect(px+off+size*0.5-size, py+size*0.33, 1, size*0.33);
      ctx.fillRect(px+off, py+size*0.66, 1, size*0.34);
      // 하이라이트
      ctx.fillStyle = "#e0604a";
      ctx.fillRect(px+size*0.1, py+size*0.08, size*0.2, 2);
      return;
    }
    case 42: { // 갈색 나무 벽 (도서관, 창고)
      ctx.fillStyle = "#8a6040"; ctx.fillRect(px,py,size,size);
      ctx.fillStyle = "#6a4020";
      ctx.fillRect(px, py+size*0.25, size, 1);
      ctx.fillRect(px, py+size*0.5, size, 1);
      ctx.fillRect(px, py+size*0.75, size, 1);
      ctx.fillStyle = "#a07a50";
      ctx.fillRect(px+size*0.6, py+size*0.1, size*0.1, size*0.1);
      return;
    }
    case 43: { // 파란 벽
      ctx.fillStyle = "#4a78a8"; ctx.fillRect(px,py,size,size);
      ctx.fillStyle = "#2a5078";
      ctx.fillRect(px, py+size*0.3, size, 2);
      ctx.fillRect(px, py+size*0.7, size, 2);
      return;
    }
    case 6: { // floor (interior)
      ctx.fillStyle = ((gx+gy)%2===0) ? "#d8c8a8" : "#c8b890";
      ctx.fillRect(px,py,size,size);
      return;
    }
    case 7: { // carpet
      ctx.fillStyle = "#a02020"; ctx.fillRect(px,py,size,size);
      ctx.fillStyle = "#c04040";
      ctx.fillRect(px+size*0.3, py+size*0.3, size*0.4, size*0.4);
      return;
    }
    case 8: { // door
      ctx.fillStyle = "#5a3a1a"; ctx.fillRect(px,py,size,size);
      ctx.fillStyle = "#8a5a2a";
      ctx.fillRect(px+size*0.15, py+size*0.1, size*0.7, size*0.8);
      ctx.fillStyle = "#ffd23f";
      ctx.fillRect(px+size*0.7, py+size*0.5, 2, 2);
      return;
    }
    case 9: { // sign
      ctx.fillStyle = "#5aa847"; ctx.fillRect(px,py,size,size);
      ctx.fillStyle = "#5a3a1a";
      ctx.fillRect(px+size*0.45, py+size*0.4, size*0.1, size*0.6);
      ctx.fillStyle = "#c89060";
      ctx.fillRect(px+size*0.1, py+size*0.1, size*0.8, size*0.4);
      ctx.fillStyle = "#5a3a1a";
      ctx.fillRect(px+size*0.2, py+size*0.2, size*0.6, 2);
      ctx.fillRect(px+size*0.2, py+size*0.3, size*0.4, 2);
      return;
    }
    case 10: { // stone
      ctx.fillStyle = "#a8a098"; ctx.fillRect(px,py,size,size);
      ctx.fillStyle = "#807870";
      ctx.fillRect(px, py, size, 1);
      ctx.fillRect(px, py+size-1, size, 1);
      ctx.fillRect(px, py, 1, size);
      ctx.fillRect(px+size-1, py, 1, size);
      return;
    }
    case 12: { // flower
      ctx.fillStyle = "#5aa847"; ctx.fillRect(px,py,size,size);
      ctx.fillStyle = "#ff6b35";
      ctx.fillRect(px+size*0.35, py+size*0.3, size*0.3, size*0.3);
      ctx.fillStyle = "#ffd23f";
      ctx.fillRect(px+size*0.45, py+size*0.4, size*0.1, size*0.1);
      return;
    }
    case 13: { // fountain
      ctx.fillStyle = "#a8a098"; ctx.fillRect(px,py,size,size);
      ctx.fillStyle = "#3a7dc4";
      ctx.fillRect(px+size*0.2, py+size*0.2, size*0.6, size*0.6);
      ctx.fillStyle = "#8acdf6";
      ctx.fillRect(px+size*0.4, py+size*0.4, size*0.2, size*0.2);
      return;
    }
    case 14: { // 투표함
      ctx.fillStyle = "#d4b896"; ctx.fillRect(px,py,size,size);
      ctx.fillStyle = "#5a3a1a";
      ctx.fillRect(px+size*0.15, py+size*0.3, size*0.7, size*0.6);
      ctx.fillStyle = "#2a1a05";
      ctx.fillRect(px+size*0.35, py+size*0.4, size*0.3, 2);
      ctx.fillStyle = "#ffd23f";
      ctx.fillRect(px+size*0.4, py+size*0.5, size*0.2, size*0.1);
      return;
    }
    case 30: { // 행정부꽃 (오렌지)
      ctx.fillStyle = "#5aa847"; ctx.fillRect(px,py,size,size);
      ctx.fillStyle = "#2d5a1f";
      ctx.fillRect(px+size*0.45, py+size*0.6, 2, size*0.35);
      ctx.fillStyle = "#ff8a3c";
      ctx.fillRect(px+size*0.4, py+size*0.15, size*0.2, size*0.2);
      ctx.fillRect(px+size*0.4, py+size*0.5, size*0.2, size*0.15);
      ctx.fillRect(px+size*0.15, py+size*0.3, size*0.2, size*0.25);
      ctx.fillRect(px+size*0.65, py+size*0.3, size*0.2, size*0.25);
      ctx.fillStyle = "#ffd23f";
      ctx.fillRect(px+size*0.35, py+size*0.3, size*0.3, size*0.25);
      ctx.fillStyle = "#c08020";
      ctx.fillRect(px+size*0.45, py+size*0.4, size*0.1, size*0.05);
      return;
    }
    case 31: { // 국회꽃 (파랑/흰)
      ctx.fillStyle = "#5aa847"; ctx.fillRect(px,py,size,size);
      ctx.fillStyle = "#2d5a1f";
      ctx.fillRect(px+size*0.45, py+size*0.6, 2, size*0.35);
      ctx.fillStyle = "#5cb3ff";
      ctx.fillRect(px+size*0.4, py+size*0.1, size*0.2, size*0.5);
      ctx.fillRect(px+size*0.1, py+size*0.25, size*0.8, size*0.2);
      ctx.fillStyle = "#2a6fbe";
      ctx.fillRect(px+size*0.2, py+size*0.5, size*0.6, size*0.08);
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(px+size*0.4, py+size*0.3, size*0.2, size*0.18);
      return;
    }
    case 32: { // 법원꽃 (보라/금)
      ctx.fillStyle = "#5aa847"; ctx.fillRect(px,py,size,size);
      ctx.fillStyle = "#2d5a1f";
      ctx.fillRect(px+size*0.45, py+size*0.6, 2, size*0.35);
      ctx.fillStyle = "#c8a0ff";
      ctx.fillRect(px+size*0.25, py+size*0.15, size*0.5, size*0.45);
      ctx.fillStyle = "#9070d0";
      ctx.fillRect(px+size*0.2, py+size*0.25, size*0.1, size*0.2);
      ctx.fillRect(px+size*0.7, py+size*0.25, size*0.1, size*0.2);
      ctx.fillRect(px+size*0.35, py+size*0.5, size*0.3, size*0.08);
      ctx.fillStyle = "#ffd23f";
      ctx.fillRect(px+size*0.4, py+size*0.3, size*0.2, size*0.2);
      ctx.fillStyle = "#c08020";
      ctx.fillRect(px+size*0.45, py+size*0.38, size*0.1, size*0.06);
      return;
    }
    // ── 지붕 장식 ──
    case 50: { // 국회 청록 돔
      ctx.fillStyle = "#5aa847"; ctx.fillRect(px,py,size,size);
      // 받침
      ctx.fillStyle = "#b8b0a0";
      ctx.fillRect(px+size*0.1, py+size*0.7, size*0.8, size*0.2);
      // 돔 (반원)
      ctx.fillStyle = "#3aa890";
      ctx.fillRect(px+size*0.25, py+size*0.3, size*0.5, size*0.4);
      ctx.fillRect(px+size*0.15, py+size*0.45, size*0.7, size*0.3);
      ctx.fillRect(px+size*0.35, py+size*0.2, size*0.3, size*0.15);
      // 하이라이트
      ctx.fillStyle = "#5cd0b0";
      ctx.fillRect(px+size*0.35, py+size*0.35, size*0.1, size*0.15);
      // 첨탑
      ctx.fillStyle = "#ffd23f";
      ctx.fillRect(px+size*0.46, py+size*0.05, size*0.08, size*0.2);
      return;
    }
    case 51: { // 빨간 십자가 (포켓몬 센터)
      ctx.fillStyle = "#5aa847"; ctx.fillRect(px,py,size,size);
      // 받침 흰
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(px+size*0.1, py+size*0.45, size*0.8, size*0.5);
      // 빨간 십자
      ctx.fillStyle = "#e02020";
      ctx.fillRect(px+size*0.4, py+size*0.15, size*0.2, size*0.65);
      ctx.fillRect(px+size*0.2, py+size*0.4, size*0.6, size*0.2);
      ctx.fillStyle = "#a01010";
      ctx.fillRect(px+size*0.4, py+size*0.75, size*0.2, size*0.05);
      return;
    }
    case 52: { // 시계 (신의국 교실)
      ctx.fillStyle = "#5aa847"; ctx.fillRect(px,py,size,size);
      // 시계판
      ctx.fillStyle = "#fffaf0";
      ctx.fillRect(px+size*0.15, py+size*0.15, size*0.7, size*0.7);
      ctx.fillStyle = "#2a1a05";
      // 테두리
      ctx.fillRect(px+size*0.15, py+size*0.15, size*0.7, 2);
      ctx.fillRect(px+size*0.15, py+size*0.83, size*0.7, 2);
      ctx.fillRect(px+size*0.15, py+size*0.15, 2, size*0.7);
      ctx.fillRect(px+size*0.83, py+size*0.15, 2, size*0.7);
      // 숫자 점
      ctx.fillRect(px+size*0.47, py+size*0.22, 2, 2);
      ctx.fillRect(px+size*0.47, py+size*0.74, 2, 2);
      ctx.fillRect(px+size*0.74, py+size*0.47, 2, 2);
      ctx.fillRect(px+size*0.22, py+size*0.47, 2, 2);
      // 시침/분침
      ctx.fillRect(px+size*0.48, py+size*0.35, 2, size*0.18);
      ctx.fillRect(px+size*0.5, py+size*0.5, size*0.2, 2);
      return;
    }
    case 53: { // 파란 청기와 지붕 (대통령 집무실)
      ctx.fillStyle = "#5aa847"; ctx.fillRect(px,py,size,size);
      // 본 지붕
      ctx.fillStyle = "#3a78a8";
      ctx.fillRect(px+size*0.1, py+size*0.45, size*0.8, size*0.45);
      ctx.fillRect(px+size*0.15, py+size*0.35, size*0.7, size*0.15);
      ctx.fillRect(px+size*0.25, py+size*0.2, size*0.5, size*0.18);
      // 기와 줄무늬
      ctx.fillStyle = "#5aa0d0";
      ctx.fillRect(px+size*0.15, py+size*0.55, size*0.7, 2);
      ctx.fillRect(px+size*0.15, py+size*0.72, size*0.7, 2);
      // 처마
      ctx.fillStyle = "#2a5078";
      ctx.fillRect(px+size*0.05, py+size*0.85, size*0.9, size*0.08);
      // 봉황 (금)
      ctx.fillStyle = "#ffd23f";
      ctx.fillRect(px+size*0.46, py+size*0.08, size*0.08, size*0.15);
      return;
    }
    case 54: { // 그리스 기둥 (대법원/헌재)
      ctx.fillStyle = "#5aa847"; ctx.fillRect(px,py,size,size);
      // 기둥 본체
      ctx.fillStyle = "#f0e8d8";
      ctx.fillRect(px+size*0.35, py+size*0.15, size*0.3, size*0.7);
      // 받침
      ctx.fillStyle = "#c8b8a0";
      ctx.fillRect(px+size*0.25, py+size*0.85, size*0.5, size*0.1);
      ctx.fillRect(px+size*0.25, py+size*0.08, size*0.5, size*0.1);
      // 결
      ctx.fillStyle = "#d8d0c0";
      ctx.fillRect(px+size*0.42, py+size*0.2, 2, size*0.6);
      ctx.fillRect(px+size*0.5, py+size*0.2, 2, size*0.6);
      ctx.fillRect(px+size*0.58, py+size*0.2, 2, size*0.6);
      return;
    }
    case 55: { // 책더미 (도서관)
      ctx.fillStyle = "#5aa847"; ctx.fillRect(px,py,size,size);
      // 책 3권
      ctx.fillStyle = "#c84a3a";
      ctx.fillRect(px+size*0.15, py+size*0.55, size*0.55, size*0.3);
      ctx.fillStyle = "#3a78a8";
      ctx.fillRect(px+size*0.2, py+size*0.3, size*0.6, size*0.28);
      ctx.fillStyle = "#3a8a3a";
      ctx.fillRect(px+size*0.25, py+size*0.1, size*0.55, size*0.22);
      // 페이지 가닥
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(px+size*0.18, py+size*0.6, size*0.5, 2);
      ctx.fillRect(px+size*0.23, py+size*0.35, size*0.55, 2);
      ctx.fillRect(px+size*0.28, py+size*0.15, size*0.5, 2);
      return;
    }
    case 56: { // 별 (정부청사)
      ctx.fillStyle = "#5aa847"; ctx.fillRect(px,py,size,size);
      // 깃대
      ctx.fillStyle = "#5a3a1a";
      ctx.fillRect(px+size*0.48, py+size*0.4, 2, size*0.55);
      // 별
      ctx.fillStyle = "#ffd23f";
      ctx.fillRect(px+size*0.45, py+size*0.1, size*0.1, size*0.4);
      ctx.fillRect(px+size*0.3, py+size*0.2, size*0.4, size*0.2);
      ctx.fillRect(px+size*0.35, py+size*0.35, size*0.3, size*0.1);
      ctx.fillStyle = "#c08020";
      ctx.fillRect(px+size*0.42, py+size*0.42, size*0.04, size*0.06);
      ctx.fillRect(px+size*0.54, py+size*0.42, size*0.04, size*0.06);
      return;
    }
    case 57: { // 짚더미 (창고)
      ctx.fillStyle = "#5aa847"; ctx.fillRect(px,py,size,size);
      ctx.fillStyle = "#d4a830";
      ctx.fillRect(px+size*0.15, py+size*0.45, size*0.7, size*0.45);
      ctx.fillStyle = "#b88a10";
      ctx.fillRect(px+size*0.2, py+size*0.55, size*0.6, 2);
      ctx.fillRect(px+size*0.2, py+size*0.7, size*0.6, 2);
      ctx.fillStyle = "#e8c050";
      ctx.fillRect(px+size*0.3, py+size*0.3, size*0.4, size*0.18);
      return;
    }
    case 58: { // 가족 표식 (가정법원) — 하트
      ctx.fillStyle = "#5aa847"; ctx.fillRect(px,py,size,size);
      ctx.fillStyle = "#fffaf0";
      ctx.fillRect(px+size*0.1, py+size*0.45, size*0.8, size*0.5);
      ctx.fillStyle = "#ff5a80";
      ctx.fillRect(px+size*0.25, py+size*0.25, size*0.2, size*0.2);
      ctx.fillRect(px+size*0.55, py+size*0.25, size*0.2, size*0.2);
      ctx.fillRect(px+size*0.2, py+size*0.4, size*0.6, size*0.25);
      ctx.fillRect(px+size*0.3, py+size*0.6, size*0.4, size*0.15);
      ctx.fillRect(px+size*0.4, py+size*0.7, size*0.2, size*0.1);
      return;
    }
    case 59: { // 전구 (특허법원)
      ctx.fillStyle = "#5aa847"; ctx.fillRect(px,py,size,size);
      ctx.fillStyle = "#fffaf0";
      ctx.fillRect(px+size*0.1, py+size*0.55, size*0.8, size*0.4);
      // 전구
      ctx.fillStyle = "#ffe488";
      ctx.fillRect(px+size*0.3, py+size*0.18, size*0.4, size*0.4);
      ctx.fillRect(px+size*0.25, py+size*0.25, size*0.5, size*0.3);
      ctx.fillStyle = "#ffd23f";
      ctx.fillRect(px+size*0.35, py+size*0.25, size*0.1, size*0.2);
      ctx.fillStyle = "#7a6040";
      ctx.fillRect(px+size*0.35, py+size*0.55, size*0.3, size*0.1);
      ctx.fillRect(px+size*0.4, py+size*0.65, size*0.2, size*0.05);
      return;
    }
    case 60: { // 투표함 (선관위)
      ctx.fillStyle = "#5aa847"; ctx.fillRect(px,py,size,size);
      ctx.fillStyle = "#5a3a1a";
      ctx.fillRect(px+size*0.15, py+size*0.35, size*0.7, size*0.6);
      ctx.fillStyle = "#8a5a2a";
      ctx.fillRect(px+size*0.2, py+size*0.4, size*0.6, size*0.5);
      // 슬롯
      ctx.fillStyle = "#1a0a05";
      ctx.fillRect(px+size*0.3, py+size*0.45, size*0.4, size*0.06);
      // 종이
      ctx.fillStyle = "#fffaf0";
      ctx.fillRect(px+size*0.4, py+size*0.2, size*0.2, size*0.15);
      // 체크 마크
      ctx.fillStyle = "#5cb55c";
      ctx.fillRect(px+size*0.45, py+size*0.25, 2, 2);
      ctx.fillRect(px+size*0.5, py+size*0.27, 2, 2);
      return;
    }
    default:
      ctx.fillStyle = "#5aa847"; ctx.fillRect(px,py,size,size);
  }
}

return { W, H, TILE, PASSABLE, buildWorld, drawTile, signTextAt };
})();
