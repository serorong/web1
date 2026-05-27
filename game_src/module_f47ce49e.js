/* 픽셀 스프라이트 렌더러 (귀여운 스타일 v2)
   16x16 픽셀 시트 — 큰 눈 + 분홍 볼 + 미소가 있는 포켓몬 디자인
   색 키:
     b=body, d=dark(outline), l=light(highlight),
     e=eye(black), w=eye sparkle(white),
     p=blush(pink), m=mouth(dark red),
     a=accent (특수), s=secondary, x=accent2
     숫자/특수 키는 각 sprite 정의에서 별도 매핑
*/
window.SPRITES = (() => {

// 16x16 픽셀 시트 정의
const SHAPES = {
  // ============ 핵심 포켓몬 ============
  // 민쥬 — 동그란 햇님 같은 노란 포켓몬
  round: [
    "................",
    "......dddd......",
    "....ddllllbd....",
    "...dlllllllbd...",
    "..dlllllllllbd..",
    "..dlweelweelbd..",
    "..dllellelllbd..",
    "..bllllllllllbd.",
    "..blplllmllplbd.",
    "..bllllmmmlllbd.",
    "..blllllllllbbd.",
    "..bllllllllbbbd.",
    "..dblllllllbbd..",
    "...dbbbbbbbbd...",
    "....ddbbbbdd....",
    "......dddd......"
  ],

  // 국이 — 새 모양 (의회의 독수리), 둥근 머리 + 작은 날개 + 부리 + 넥타이
  bird: [
    "................",
    "......dddd......",
    ".....dllllbd....",
    "....dlllllllbd..",
    "...dlllllllllbd.",
    "...dlweelweelbd.",
    "...dllelleelllbd",
    "..dlaaalllllllbd",
    "..dllllpllllpbd.",
    ".dbllllllmllllbd",
    ".dbsssssssssslbd",
    ".dbsxxxxxxxxsbd.",
    "..dbsssssssbbd..",
    "...dbbbbbbbbd...",
    "....ddbbbbdd....",
    "......dddd......"
  ],

  // 입이 — 두루마리 캐릭터 (얼굴 + 두루마리 몸)
  scroll: [
    "................",
    "....ddddddd.....",
    "...dlllllllbd...",
    "..dlllllllllbd..",
    "..dlweelweelbd..",
    "..dllellelllbd..",
    "..blplllmllplbd.",
    "..blllllmllllbd.",
    "..dbbsssssbbd...",
    "..bssaaaaasssbd.",
    "..bsssssssssbd..",
    "..bssaaaaasssbd.",
    "..bsssssssssbd..",
    "..dbsssssssbd...",
    "...ddbbbbbdd....",
    "................"
  ],

  // 감사리 — 돋보기 든 탐정 캐릭터
  magni: [
    "................",
    "......dddd......",
    "....ddllllbd....",
    "...dllllllllbd..",
    "..dllweelweelbd.",
    "..dllellellllbd.",
    "..bllllllllllbd.",
    "..blplllmllplbd.",
    "..blllllmmlllbd.",
    "..dbllllllllbd..",
    "..aaalllllllbd..",
    "..awalllllllbd..",
    "..aaa..ddbd.....",
    ".....ddd........",
    "....dd..........",
    "................"
  ],

  // 예산이 — 동전 모양
  coin: [
    "................",
    ".....dddddd.....",
    "...ddaaaaaadd...",
    "..dalllllllllad.",
    ".dallweelweelad.",
    ".dallllellllllad",
    ".dalllllpllllad.",
    ".dalmllllllmad..",
    ".dalpllllllpad..",
    ".dalwllllllllad.",
    ".daallllllllad..",
    "..dallllllllad..",
    "...dallllllad...",
    "....daaaaaad....",
    ".....dddddd.....",
    "................"
  ],

  // 법안이 — 펼쳐진 책에서 얼굴이 빼꼼
  book: [
    "................",
    ".dddddd..dddddd.",
    ".dllllbddbllllbd",
    ".dlweebllbweelbd",
    ".dllellbblellbd.",
    ".dlplmllllmlplbd",
    ".dllllllllllllbd",
    ".dlssssddssssbd.",
    "ddsssaaddaasssbd",
    "dsssssssssssssd.",
    "dssaaaaaaaaassd.",
    "dsssssssssssssd.",
    "ddbsssssssssbdd.",
    "..ddbbbbbbbdd...",
    "....dddddd......",
    "................"
  ],

  // 행이 — 불꽃 캐릭터 (둥근 머리 + 불꽃 꼬리)
  flame: [
    "......d.........",
    ".....da.d.......",
    "....dabad.......",
    "....dabad...d...",
    "...ddbbbddd.d...",
    "..dlllllllldd...",
    "..dlweelwelldd..",
    "..dllellelllld..",
    "..blplmmmllplld.",
    "..bllllllllllbd.",
    "..bssssssssssbd.",
    "..baxxxxxxxxabd.",
    "..bssssssssssbd.",
    "..dbbssssbbdbd..",
    "...ddbbbbbdd....",
    "................"
  ],

  // 장관이 — 정장 모자 쓴 캐릭터
  hat: [
    "................",
    "...ddddddddd....",
    "..dlllllllllld..",
    ".dlsssssssssdd..",
    "dssssssssssssssd",
    "dssaaaaaaaaaassd",
    "ddssssssssssssdd",
    "..ddddddddddd...",
    "..dlllllllllbd..",
    "..dlweelweelbd..",
    "..dllellelllbd..",
    "..blplllmllplbd.",
    "..blllmmmlllbd..",
    "..dbllllllllbd..",
    "...dddbbbbddd...",
    "................"
  ],

  // 총리 — 왕관 쓴 캐릭터
  crown: [
    "................",
    "..a...a...a.....",
    "..aa..aa..aaa...",
    ".aaaa.aaa.aaaaa.",
    "aaxxxaaxxxaaaxa.",
    "aaaaaaaaaaaaaaad",
    "ddddddddddddddd.",
    "dlllllllllllllbd",
    "dlweelllweelllbd",
    "dllellllellllbd.",
    "blplllllmllllpbd",
    "bllllllmmmlllbd.",
    "bllssssssssllbd.",
    "dbbssssssssbbd..",
    ".ddbbbbbbbbdd...",
    "....dddddd......"
  ],

  // 살림이 — 작은 집 캐릭터 (지붕 + 얼굴 + 문)
  home: [
    "......d.........",
    ".....dad........",
    "....dabad.......",
    "...dabbbad......",
    "..daabbbbaad....",
    ".daabbbbbbaad...",
    "ddssssssssssdd..",
    "dssweessweessd..",
    "dssellsslllllsd.",
    "dsplsslmlsplssd.",
    "dsssssmmmsssssd.",
    "dssaaaaaaaaassd.",
    "dssamlllllmassd.",
    "dssamlllllmassd.",
    "ddssamlllmassdd.",
    "...ddddddddd...."
  ],

  // 부처리 — 기어 캐릭터
  gear: [
    "....a..a..a.....",
    "...aaaaaaaa.....",
    "..addddddddda...",
    ".addlllllllddad.",
    "addllweelweelbdad",
    "addllellelllbdd.",
    "addlplllmllplbda",
    "..dlllllmmlllbd.",
    "addbllllllllbdd.",
    "addbbbbbbbbbbdda",
    ".addbbbbbbbbdda.",
    "..addddddddda...",
    "...aaaaaaaa.....",
    "....a..a..a.....",
    "................",
    "................"
  ],

  // 거부 — 방패 캐릭터
  shield: [
    "................",
    "..ddddddddddd...",
    ".dlllllllllllbd.",
    ".dlllllllllllbd.",
    ".dlweellweelbd..",
    ".dllellelllbd...",
    "dlplllllllplbd..",
    "dllllmlllmlllbd.",
    "dlllllmmmlllbbd.",
    "dllsaaaaaaaslbd.",
    ".dllsaxxxasllbd.",
    "..dllsaaaslbd...",
    "...dllsslbd.....",
    "....dlllbd......",
    ".....dlbd.......",
    "......dd........"
  ],

  // 법이 — 의사봉 든 판사 캐릭터
  gavel: [
    "................",
    "......dddd......",
    "....ddllllbd....",
    "...dlllllllbd...",
    "..dlllllllllbd..",
    "..dlweelweelbd..",
    "..dllellelllbd..",
    "..blplmmmllplbd.",
    "..bllllllllllbd.",
    "dbsssssssssssbd.",
    "dssaaaaaaaaassd.",
    "ddssssssssssddd.",
    "...dbbbsbbbd....",
    "....abbsbba.....",
    "...aaabsbaaa....",
    "...aaaaaaaa....."
  ],

  // 재판이 — 저울 캐릭터
  scale: [
    "......daad......",
    "....ddaaaaad....",
    "..ddaaaaaaaadd..",
    ".daaaaaaaaaaaad.",
    "dlllllbblllllld.",
    "dlweelbblweellbd",
    "dllellbbleelllbd",
    "dlplllbblmlplbd.",
    "dllllllllllllbd.",
    "dlllssssssslllbd",
    "dssssaaaaassssbd",
    "ddssssssssssbdd.",
    "..ddssssssbdd...",
    "....dbsssbd.....",
    "......dbd.......",
    "................"
  ],

  // 삼심이 — 숫자 3 모양 캐릭터
  three: [
    "................",
    "..ddddddddddd...",
    ".dllllllllllld..",
    "dllweelllweellbd",
    "dlllellllellllbd",
    "dlllllllllllllbd",
    "dlplaaaaaaaaplbd",
    "dllllllllaaallbd",
    "dlllmmmllllaaabd",
    "dllllllllllaaabd",
    "dllaaaaaaaaaabd.",
    ".dllllllllllbd..",
    "..dbbbbbbbbbd...",
    "...ddddddddd....",
    "................",
    "................"
  ],

  // 헌이 — 그리스 기둥 캐릭터
  pillar: [
    "..ddddddddddd...",
    ".daaaaaaaaaaad..",
    "ddddddddddddddd.",
    "dlllllllllllllbd",
    "dlweellllweellbd",
    "dllellllllellbd.",
    "dlplllllllplbd..",
    "dllllmmmllllbd..",
    "dbsssssssssbbd..",
    "dbsxxxxxxxsbbd..",
    "dbsssssssssbbd..",
    "dbsxxxxxxxsbbd..",
    "dbsssssssssbbd..",
    "ddddddddddddd...",
    "daaaaaaaaaaad...",
    "ddddddddddddd..."
  ],

  // 가정이 — 하트 캐릭터
  heart: [
    "................",
    "..ddd.....ddd...",
    ".daaad...daaad..",
    "daallad.dallaad.",
    "dallwlaadlweelad",
    "dlllellllellllad",
    "dlllllllllllllad",
    "dlplmllllllmplad",
    ".dllllmmmllllad.",
    ".dlllllllllllad.",
    "..daaaaaaaaaad..",
    "...daaaaaaaad...",
    "....daaaaaad....",
    ".....daaaad.....",
    "......daad......",
    "................"
  ],

  // 특허 — 전구 캐릭터
  bulb: [
    "................",
    "......aaa.......",
    ".....aaaaa......",
    "....dddddddd....",
    "...dllllllllbd..",
    "..dllweelweelbd.",
    "..dllellelllllbd",
    "..blplllmlllplbd",
    "..bllllmmmllllbd",
    "..bllaaaaaallbd.",
    "..dbllllllllbd..",
    "...ddddddddd....",
    "...sssssssss....",
    "....sssssss.....",
    "....s.....s.....",
    "................"
  ],

  // 선거이 — 별 캐릭터
  star: [
    "................",
    "........a.......",
    ".......aaa......",
    "......daaad.....",
    "....ddaaaadd....",
    "aaaadddddddaaaa.",
    "addlllllllldda..",
    "ddlweelweellbdda",
    "dllellelllllbd..",
    "dlplllllmllplbd.",
    "dllllllmmlllbd..",
    ".dbllllllllbdd..",
    "addbbbbbbbdda...",
    "addbbb.bbbdda...",
    "aa.aaa...aaa.aa.",
    "................"
  ],

  // 투표리 — 투표용지 캐릭터
  check: [
    "................",
    "ddddddddddddddd.",
    "dlllllllllllllbd",
    "dlweellweellllbd",
    "dllellelllllllbd",
    "dlllllllllaalbbd",
    "dlpllllllaalplbd",
    "dlllllllaallllbd",
    "dlllmmmaalllbbd.",
    "dlllllaalllbbd..",
    "dllllaalllbbd...",
    "dlllllllllbd....",
    "dssssssssbd.....",
    "ddddddddbd......",
    "................",
    "................"
  ],

  // 주권이 — 주먹 들고 있는 캐릭터
  fist: [
    "................",
    "......dddd......",
    "....ddllllbd....",
    "...dlllllllbd...",
    "..dlllllllllbd..",
    "..dlweelweelbd..",
    "..dllellelllbd..",
    "..blplmmmllplbd.",
    "..bllllllllllbd.",
    "..dbssssssssbd..",
    "....dbbbbbd.....",
    "..ddaaaaaaaad...",
    "..dawlwlwlwlad..",
    "..dawlwlwlwlad..",
    "..ddaaaaaaaad...",
    "................"
  ],

  // 배심이 — 12명의 배심원 (여러 작은 얼굴)
  jury: [
    "................",
    ".ddd..ddd..ddd..",
    "dlllddllldddllld",
    "dleldllldllldlld",
    "dllldllldllldlld",
    "ddddddddddddddd.",
    ".ddd..ddd..ddd..",
    "dlllddllldddllld",
    "dleldllldllldlld",
    "dllldllldllldlld",
    "ddddddddddddddd.",
    ".ddd..ddd..ddd..",
    "dlllddllldddllld",
    "dleldllldllldlld",
    "dllldllldllldlld",
    "ddddddddddddddd."
  ],
};

// ===== 색 매핑 (Pokémon 종류별 팔레트) =====
const KIND_PALETTE = (window.DATA && window.DATA.KIND_PALETTE) || {
  "민주":   { body:"#ffd23f", dark:"#7a4a05", light:"#fff5b0", eye:"#1a0e02", accent:"#ff6b35" },
  "국회":   { body:"#5cb3ff", dark:"#103860", light:"#c8e4ff", eye:"#0a1830", accent:"#ffd23f" },
  "행정":   { body:"#ff7a5c", dark:"#5a1a08", light:"#ffd0bc", eye:"#1a0808", accent:"#ffd23f" },
  "법원":   { body:"#c8a0ff", dark:"#3a1a60", light:"#ecd8ff", eye:"#1a0838", accent:"#ffd23f" },
  "선거":   { body:"#7ad77a", dark:"#1a4a1a", light:"#c8eec8", eye:"#0a1f0a", accent:"#ffd23f" },
  "이세린": { body:"#a01818", dark:"#300404", light:"#e04040", eye:"#fff5b0", accent:"#ffd23f" },
};

// 글로벌 색 키
const COMMON = {
  w: "#ffffff",        // 눈동자 하이라이트
  p: "#ff8aa0",        // 분홍 볼
  m: "#5a1a05",        // 입
};

// 픽셀 시트 → 캔버스
function drawSheet(ctx, sheet, ox, oy, scale, pal){
  // 'b','d','l','e','a' 외 키는 보조 색상으로 매핑
  const sec = pal.dark; // 'x' (보조 어두운) 기본
  for(let y=0; y<sheet.length; y++){
    const row = sheet[y];
    for(let x=0; x<row.length; x++){
      const ch = row[x];
      if(ch==='.' || ch===' ') continue;
      let color;
      switch(ch){
        case 'b': color = pal.body; break;
        case 'd': color = pal.dark; break;
        case 'l': color = pal.light; break;
        case 'e': color = pal.eye; break;
        case 'a': color = pal.accent; break;
        case 'w': color = COMMON.w; break;
        case 'p': color = COMMON.p; break;
        case 'm': color = COMMON.m; break;
        case 's': color = pal.shirt || pal.dark; break;
        case 'x': color = pal.pants || pal.accent; break;
        default:  color = pal.body;
      }
      ctx.fillStyle = color;
      ctx.fillRect(ox + x*scale, oy + y*scale, scale, scale);
    }
  }
}

function paletteFor(kindKey){
  return KIND_PALETTE[kindKey] || KIND_PALETTE["민주"];
}

// 포켓몬 그리기
function drawPokemon(ctx, pid, x, y, size){
  const p = window.DATA.POKEDEX.find(p=>p.id===pid);
  if(!p) return;
  const pal = paletteFor(p.kind);
  const sheet = SHAPES[p.shape] || SHAPES.round;
  const scale = Math.max(1, Math.floor(size/16));
  drawSheet(ctx, sheet, x, y, scale, pal);
}

// 임의 shape 그리기
function drawShape(ctx, shape, kind, x, y, size){
  const pal = paletteFor(kind);
  const sheet = SHAPES[shape] || SHAPES.round;
  const scale = Math.max(1, Math.floor(size/16));
  drawSheet(ctx, sheet, x, y, scale, pal);
}

// ============ 어린이 플레이어 (school kid) ============
// 큰 머리 + 큰 눈 + 학교 유니폼
const PLAYER_SHEETS = {
  down: [
    "................",
    "....hhhhhhhh....",
    "...hhhhhhhhhh...",
    "..hffffffffffh..",
    ".hffffffffffffh.",
    ".hffweefweefffh.",
    ".hffellelleffh..",
    ".hffpfffffpffh..",
    ".hfffmmmmmfffh..",
    "..hhhhfffhhhh...",
    "...sssssssss....",
    "..sssrrrrrsss...",
    "..sssrrrrrsss...",
    "..sssrrrrrsss...",
    "..pppp...pppp...",
    "..nnn.....nnn..."
  ],
  up: [
    "................",
    "....hhhhhhhh....",
    "...hhhhhhhhhh...",
    "..hhhhhhhhhhhh..",
    ".hhhhhhhhhhhhhh.",
    ".hhhhhhhhhhhhh..",
    ".hhhhhhhhhhhh...",
    ".hffffffffffh...",
    ".hfffffffffh....",
    "..hhhhhhhhh.....",
    "...sssssssss....",
    "..sssssssssss...",
    "..sssssssssss...",
    "..sssssssssss...",
    "..pppp...pppp...",
    "..nnn.....nnn..."
  ],
  left: [
    "................",
    "....hhhhhhhh....",
    "...hhhhhhhhhh...",
    "..hffffffffhh...",
    ".hffffffffhhh...",
    ".hweeffffhhhh...",
    ".hellffhhhhhhh..",
    ".hpfffffhhhhhh..",
    ".hffmmmfhhhhh...",
    "..hhhfffhhhh....",
    "...sssssssss....",
    "..ssrrrrrsss....",
    "..sssrrrrrss....",
    "..sssrrrrrss....",
    "..pppp...pppp...",
    "..nnn.....nnn..."
  ],
  right: [
    "................",
    "....hhhhhhhh....",
    "...hhhhhhhhhh...",
    "...hhffffffffh..",
    "...hhhffffffffh.",
    "...hhhhffffweeh.",
    "..hhhhhhhffellh.",
    "..hhhhhhfffffph.",
    "...hhhhhfmmmffh.",
    "....hhhhfffhhh..",
    "...sssssssss....",
    "....sssrrrrrss..",
    "....ssrrrrrsss..",
    "....ssrrrrrsss..",
    "..pppp...pppp...",
    "..nnn.....nnn..."
  ]
};

const PLAYER_PALETTE = {
  h: "#3a2a18",    // 머리 (갈색)
  f: "#fce0c0",    // 피부
  e: "#1a0e02",    // 눈
  w: "#ffffff",
  p: "#ff8aa0",    // 볼
  m: "#5a1a05",    // 입
  s: "#ff8a5c",    // 셔츠 (오렌지 — 신의반 컬러)
  r: "#ffd23f",    // 셔츠 액센트 (노랑)
  P: "#2a3a5a",    // 바지 (어두운 파랑)
  n: "#1a1a2a"     // 신발
};
// 위 키들과 별도 매핑 (소문자 p가 'pink blush'와 'pants' 둘 다 쓰여서 별도 함수 필요)
function drawPlayerSheet(ctx, sheet, ox, oy, scale){
  const pal = {
    h:"#3a2a18", f:"#fce0c0", e:"#1a0e02", w:"#ffffff",
    p:"#ff8aa0", m:"#5a1a05",
    s:"#ff8a5c", r:"#ffd23f",
    // 'P' 대문자는 바지, 시트에서 'p'와 구분
    // 'n' 신발
    n:"#1a1a2a"
  };
  // 단, 시트의 'p'는 blush와 pants 충돌 → 시트 라인 인덱스 10 이상은 pants로 매핑
  for(let y=0; y<sheet.length; y++){
    const row = sheet[y];
    for(let x=0; x<row.length; x++){
      const ch = row[x];
      if(ch==='.' || ch===' ') continue;
      let color = pal[ch];
      // 'p' 처리: y>=10 (하의 영역)은 바지 색
      if(ch==='p'){
        color = y>=10 ? "#2a3a5a" : "#ff8aa0";
      }
      if(!color) color = "#888";
      ctx.fillStyle = color;
      ctx.fillRect(ox + x*scale, oy + y*scale, scale, scale);
    }
  }
}

function drawPlayer(ctx, x, y, size, facing){
  const sheet = PLAYER_SHEETS[facing] || PLAYER_SHEETS.down;
  const scale = Math.max(1, Math.floor(size/16));
  drawPlayerSheet(ctx, sheet, x, y, scale);
}

// ============ NPC ============
const NPC_SHEETS = {
  // 어른 (얼굴 더 길쭉)
  보통: [
    "....HHHHHHHH....",
    "...HHHHHHHHHH...",
    "..Hffffffffffh..",
    ".hffffffffffffh.",
    ".hffeeffffeeffh.",
    ".hffffffffffffh.",
    ".hfffffmmmfffh..",
    "..hhhhfffhhhh...",
    "...sssssssss....",
    "..sssssssssss...",
    "..sssaaaaasss...",
    "..sssssssssss...",
    "..sssssssssss...",
    "..pppp...pppp...",
    "..pppp...pppp...",
    "..nnn.....nnn..."
  ]
};

const NPC_PALETTES = {
  "보통":  { H:"#5a3a18", f:"#f0c890", e:"#1a0e02", m:"#5a1a05", s:"#5cb3ff", a:"#ffffff", p:"#2a3a5a", n:"#1a1a2a", h:"#5a3a18" },
  "보스":  { H:"#2a0a0a", f:"#e0b090", e:"#fff5b0", m:"#400404", s:"#a01818", a:"#ffd23f", p:"#300404", n:"#0a0a0a", h:"#2a0a0a" },
  "반장":  { H:"#3a2a18", f:"#fce0c0", e:"#1a0e02", m:"#5a1a05", s:"#7ad77a", a:"#ffd23f", p:"#2a3a5a", n:"#1a1a2a", h:"#3a2a18" },
  "의사":  { H:"#a07050", f:"#fee4c0", e:"#1a0e02", m:"#5a1a05", s:"#ffffff", a:"#ff6b35", p:"#ffffff", n:"#ffffff", h:"#a07050" },
  "교장":  { H:"#dddddd", f:"#f0c890", e:"#1a0e02", m:"#5a1a05", s:"#5a4a30", a:"#ffd23f", p:"#3a3a30", n:"#1a1a1a", h:"#cccccc" }
};

function drawNPCSheet(ctx, sheet, pal, ox, oy, scale){
  for(let y=0; y<sheet.length; y++){
    const row = sheet[y];
    for(let x=0; x<row.length; x++){
      const ch = row[x];
      if(ch==='.' || ch===' ') continue;
      let color = pal[ch];
      if(!color) color = "#888";
      ctx.fillStyle = color;
      ctx.fillRect(ox + x*scale, oy + y*scale, scale, scale);
    }
  }
}

function drawNPC(ctx, kind, x, y, size, facing){
  const pal = NPC_PALETTES[kind] || NPC_PALETTES["보통"];
  const sheet = NPC_SHEETS["보통"];
  const scale = Math.max(1, Math.floor(size/16));
  drawNPCSheet(ctx, sheet, pal, x, y, scale);
  // 보스 왕관
  if(kind==="보스"){
    ctx.fillStyle = "#ffd23f";
    ctx.fillRect(x+3*scale, y, 10*scale, 2*scale);
    ctx.fillStyle = "#ff4040";
    ctx.fillRect(x+3*scale, y-2*scale, 2*scale, 2*scale);
    ctx.fillRect(x+7*scale, y-2*scale, 2*scale, 2*scale);
    ctx.fillRect(x+11*scale, y-2*scale, 2*scale, 2*scale);
    ctx.fillStyle = "#ffd23f";
    ctx.fillRect(x+3*scale, y-3*scale, 1*scale, 1*scale);
    ctx.fillRect(x+8*scale, y-4*scale, 1*scale, 1*scale);
    ctx.fillRect(x+12*scale, y-3*scale, 1*scale, 1*scale);
  }
  // 교장 안경
  if(kind==="교장"){
    ctx.fillStyle = "#1a1a1a";
    ctx.fillRect(x+3*scale, y+4*scale, 4*scale, 1*scale);
    ctx.fillRect(x+9*scale, y+4*scale, 4*scale, 1*scale);
    ctx.fillRect(x+3*scale, y+5*scale, 1*scale, 1*scale);
    ctx.fillRect(x+6*scale, y+5*scale, 1*scale, 1*scale);
    ctx.fillRect(x+9*scale, y+5*scale, 1*scale, 1*scale);
    ctx.fillRect(x+12*scale, y+5*scale, 1*scale, 1*scale);
  }
  // 의사 모자
  if(kind==="의사"){
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(x+4*scale, y-1*scale, 8*scale, 2*scale);
    ctx.fillStyle = "#ff4040";
    ctx.fillRect(x+7*scale, y+0*scale, 2*scale, 1*scale);
    ctx.fillRect(x+6*scale, y+0*scale, 4*scale, 1*scale);
  }
}

// 포켓볼
function drawPokeball(ctx, x, y, size){
  const scale = Math.max(1, Math.floor(size/16));
  const sheet = [
    "....dddddd......",
    "..ddrrrrrrdd....",
    ".drrrrrrrrrrd...",
    ".drrrrrrrrrrd...",
    "drrrrrrrrrrrrd..",
    "drrrrrrrrrrrrd..",
    "dddddddddddddd..",
    "dlllllldllllld..",
    "dllllddddllldd..",
    "dlllddeedllldd..",
    "dlllddeedllldd..",
    "dllllddddlllbd..",
    "dlllllldllllld..",
    ".dllllllllllld..",
    "..dddllllldd....",
    "....dddddd......"
  ];
  for(let y2=0; y2<sheet.length; y2++){
    const row = sheet[y2];
    for(let x2=0; x2<row.length; x2++){
      const ch = row[x2];
      if(ch==='.') continue;
      let color;
      switch(ch){
        case 'r': color = "#ff4040"; break;
        case 'l': color = "#ffffff"; break;
        case 'd': color = "#1a1010"; break;
        case 'e': color = "#1a1010"; break;
        case 'b': color = "#1a1010"; break;
        default: color = "#1a1010";
      }
      ctx.fillStyle = color;
      ctx.fillRect(x + x2*scale, y + y2*scale, scale, scale);
    }
  }
}

return { drawPokemon, drawShape, drawPlayer, drawNPC, drawPokeball, SHAPES, paletteFor };
})();
