#!/usr/bin/env python3
"""
Re-bundle: 수정된 모듈들을 gzip 압축하여 HTML에 삽입
"""
import json, base64, gzip, re, os

SRC = "/home/user/web1/game_src"
ORIG = "/root/.claude/uploads/ad2bec30-06d0-4594-8351-eaacb14b217d/ea14f38e-index.html"
OUT  = "/home/user/web1/index.html"

with open(ORIG, 'r') as f:
    orig = f.read()

# 원본 manifest 파싱
manifest_match = re.search(r'<script type="__bundler/manifest">(.*?)</script>', orig, re.DOTALL)
orig_manifest = json.loads(manifest_match.group(1))

# 원본 template 파싱 (수정된 template으로 교체)
with open(os.path.join(SRC, "template.html"), 'r') as f:
    new_template = f.read()

# 수정된 모듈 파일 매핑 (uuid → filename)
UUID_TO_FILE = {
    "f47ce49e-66ce-4ac7-a1f5-4bbed4b76b3d": "module_f47ce49e.js",  # Sprites
    "14e3bafe-286f-4f66-9af1-6dabcacc149a": "module_14e3bafe.js",  # Battle
    "edb567c9-0f69-4b49-af2b-4f7031060c92": "module_edb567c9.js",  # Quiz
    "063ad6e0-138a-4fbe-b087-f191f3728068": "module_063ad6e0.js",  # Data
    "6cc4d545-5c95-460e-bd5e-561eac36bd14": "module_6cc4d545.js",  # World
    "4744a30d-61ce-4df5-8b00-13f0e3b137a3": "module_4744a30d.js",  # Engine
    "d87d5949-cc0a-457b-8088-45ce48f0fa7d": "module_d87d5949.js",  # UI
    "c9738931-9db2-4e86-a318-a0a05e46e597": "module_c9738931.js",  # Game
}

# 새 오디오 모듈 UUID (신규)
AUDIO_UUID = "audio001-0000-0000-0000-000000000001"

def compress_js(code):
    """JavaScript 코드를 gzip 압축 후 base64 인코딩"""
    data = code.encode('utf-8')
    compressed = gzip.compress(data, compresslevel=9)
    return base64.b64encode(compressed).decode('ascii')

def safe_json(obj):
    """HTML <script> 안에 JSON 삽입 시 </script> 조기 종료 방지.
    </  →  <\/  (유효한 JSON 이스케이프, HTML 파서는 <\/script> 를 무시함)"""
    return json.dumps(obj).replace('</', '<\\/')

# 새 manifest 구성
new_manifest = {}

# 원본 모듈들 재압축
for uuid, orig_entry in orig_manifest.items():
    filename = UUID_TO_FILE.get(uuid)
    filepath = os.path.join(SRC, filename) if filename else None
    
    if filepath and os.path.exists(filepath):
        with open(filepath, 'r') as f:
            code = f.read()
        print(f"  Compressing {filename} ({len(code)} chars)")
        new_manifest[uuid] = {
            "mime": "application/javascript",
            "compressed": True,
            "data": compress_js(code)
        }
    else:
        # 원본 유지
        new_manifest[uuid] = orig_entry
        print(f"  Keeping original for {uuid[:8]}")

# 오디오 모듈 추가
audio_path = os.path.join(SRC, "module_audio.js")
with open(audio_path, 'r') as f:
    audio_code = f.read()
print(f"  Compressing module_audio.js ({len(audio_code)} chars)")
new_manifest[AUDIO_UUID] = {
    "mime": "application/javascript",
    "compressed": True,
    "data": compress_js(audio_code)
}

# template에 오디오 모듈 script 태그 삽입 (DATA 모듈 직전에)
# 원본 template의 DATA 모듈 script 태그 앞에 AUDIO 삽입
new_template = new_template.replace(
    '<script src="063ad6e0-138a-4fbe-b087-f191f3728068"></script>',
    f'<script src="{AUDIO_UUID}"></script>\n  <script src="063ad6e0-138a-4fbe-b087-f191f3728068"></script>'
)

# 번들 로더 가져오기 (원본의 script 태그들)
loader_match = re.search(r'<script>(.*?)</script>', orig, re.DOTALL)
loader_js = loader_match.group(1) if loader_match else ""

# 최종 HTML 구성
html = f'''<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>신의국 민주주의 프로젝트 — 포켓몬 RPG</title>
  <style>
    * {{ margin: 0; padding: 0; box-sizing: border-box; }}
    body {{ background: #0a0a12; display: flex; align-items: center; justify-content: center; min-height: 100vh; font-family: -apple-system, BlinkMacSystemFont, sans-serif; }}
    #__bundler_loading {{ position: fixed; bottom: 20px; right: 20px; font: 13px/1.4 -apple-system, BlinkMacSystemFont, sans-serif; color: #666; background: #fff; padding: 8px 14px; border-radius: 8px; box-shadow: 0 1px 4px rgba(0,0,0,0.12); z-index: 10000; }}
    #__bundler_thumbnail {{ position: fixed; inset: 0; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: #0a0a12; z-index: 9999; }}
    #__bundler_thumbnail svg {{ width: 100%; height: 100%; object-fit: contain; }}
    #__bundler_placeholder {{ color: #999; font-size: 14px; }}
  </style>
  <noscript>
    <style>#__bundler_loading {{ display: none; }}</style>
    <div style="position:fixed;bottom:12px;left:12px;font:13px/1.4 -apple-system,BlinkMacSystemFont,sans-serif;color:#999;background:rgba(255,255,255,0.9);padding:6px 12px;border-radius:6px;box-shadow:0 1px 4px rgba(0,0,0,0.08);z-index:10000;">
      This page requires JavaScript to display.
    </div>
  </noscript>
</head>
<body>
  <div id="__bundler_thumbnail">
    <svg viewBox="0 0 1200 800" xmlns="http://www.w3.org/2000/svg">
      <rect width="1200" height="800" fill="#0a0a12"></rect>
      <g transform="translate(600,400)">
        <circle cx="0" cy="0" r="200" fill="#ff4040" stroke="#1a1010" stroke-width="14"></circle>
        <path d="M -200 0 A 200 200 0 0 0 200 0 Z" fill="#fffaf0"></path>
        <rect x="-200" y="-10" width="400" height="20" fill="#1a1010"></rect>
        <circle cx="0" cy="0" r="50" fill="#fffaf0" stroke="#1a1010" stroke-width="14"></circle>
        <circle cx="0" cy="0" r="22" fill="#1a1010"></circle>
        <g fill="#ffd23f">
          <polygon points="-360,-260 -340,-300 -320,-260 -280,-250 -320,-230 -340,-190 -360,-230 -400,-250"></polygon>
          <polygon points="340,-220 354,-248 368,-220 396,-214 368,-200 354,-172 340,-200 312,-214"></polygon>
        </g>
        <text x="0" y="280" text-anchor="middle" fill="#ffd23f" font-family="sans-serif" font-weight="900" font-size="64" stroke="#1a1010" stroke-width="6" paint-order="stroke">신의국</text>
        <text x="0" y="340" text-anchor="middle" fill="#f5f1e8" font-family="sans-serif" font-weight="700" font-size="32">민주주의 프로젝트</text>
      </g>
    </svg>
  </div>
  <div id="__bundler_loading">Unpacking...</div>

  <script>
    {loader_js}
  </script>
  <script type="__bundler/manifest">{safe_json(new_manifest)}</script>
  <script type="__bundler/ext_resources">[]</script>
  <script type="__bundler/template">{safe_json(new_template)}</script>
</body>
</html>'''

with open(OUT, 'w') as f:
    f.write(html)

size_kb = os.path.getsize(OUT) / 1024
print(f"\n✅ Built: {OUT}")
print(f"   Size: {size_kb:.1f} KB")
print(f"   Modules: {len(new_manifest)}")
