#!/usr/bin/env bash
# claude-series-toolkit installer
# 把 skill + scripts symlink 到 ~/.claude/，Remotion 複製到 ~/Projects/claude-series/
#
# 用法（從 toolkit clone 後 cd 進去）：
#   ./install.sh

set -euo pipefail

TOOLKIT="$(cd "$(dirname "$0")" && pwd)"
CLAUDE_HOME="$HOME/.claude"
PROJECTS_HOME="$HOME/Projects"

cyan()  { printf "\033[36m%s\033[0m\n" "$*"; }
green() { printf "\033[32m%s\033[0m\n" "$*"; }
red()   { printf "\033[31m%s\033[0m\n" "$*"; }
warn()  { printf "\033[33m%s\033[0m\n" "$*"; }

cyan "═══ claude-series-toolkit installer ═══"
echo ""

# ── 1. 檢查 prereqs ─────────────────────────────────────────────────────
cyan "[1/6] 檢查 prereqs..."
MISSING=()
for cmd in ffmpeg node npm git rclone python3 curl; do
  command -v $cmd >/dev/null 2>&1 || MISSING+=("$cmd")
done
# Whisper（pip 裝）
command -v whisper >/dev/null 2>&1 || MISSING+=("whisper (pip install openai-whisper)")

if [ ${#MISSING[@]} -gt 0 ]; then
  red "❌ 缺少: ${MISSING[*]}"
  echo "Mac 安裝指令："
  echo "  brew install ffmpeg node git rclone python3"
  echo "  pip3 install openai-whisper"
  exit 1
fi
green "✅ prereqs 都在"
echo ""

# ── 2. ~/.claude 目錄 ─────────────────────────────────────────────────────
cyan "[2/6] 建 ~/.claude 目錄結構..."
mkdir -p "$CLAUDE_HOME"/{skills,scripts,secrets}
green "✅ $CLAUDE_HOME/{skills,scripts,secrets} 就緒"
echo ""

# ── 3. Skill symlink ─────────────────────────────────────────────────────
cyan "[3/6] Symlink skill → ~/.claude/skills/claude-series/"
SKILL_DST="$CLAUDE_HOME/skills/claude-series"
if [ -L "$SKILL_DST" ] || [ -d "$SKILL_DST" ]; then
  warn "  既有 $SKILL_DST 先備份"
  mv "$SKILL_DST" "${SKILL_DST}.bak-$(date +%Y%m%d-%H%M%S)"
fi
ln -s "$TOOLKIT/skill" "$SKILL_DST"
green "✅ skill 已 symlink"
echo ""

# ── 4. Scripts symlink ──────────────────────────────────────────────────
cyan "[4/6] Symlink scripts → ~/.claude/scripts/"
for f in "$TOOLKIT/scripts/"*; do
  base=$(basename "$f")
  dst="$CLAUDE_HOME/scripts/$base"
  if [ -L "$dst" ] || [ -f "$dst" ]; then
    warn "  既有 $dst 先備份"
    mv "$dst" "${dst}.bak-$(date +%Y%m%d-%H%M%S)"
  fi
  ln -s "$f" "$dst"
  chmod +x "$f" 2>/dev/null || true
done
green "✅ scripts 全部 symlink + chmod +x"
echo ""

# ── 5. Remotion repo ──────────────────────────────────────────────────────
cyan "[5/6] Remotion 程式碼 → ~/Projects/claude-series/"
REMOTION_DST="$PROJECTS_HOME/claude-series"
if [ -d "$REMOTION_DST" ]; then
  warn "  $REMOTION_DST 已存在 — 不會覆蓋。若想重新部署請先 mv 走"
else
  mkdir -p "$REMOTION_DST"
  cp -R "$TOOLKIT/remotion/." "$REMOTION_DST/"
  green "✅ Remotion 程式碼已複製"
  echo ""
  cyan "  跑 npm install（可能要 1-3 分鐘）..."
  cd "$REMOTION_DST"
  npm install --no-fund --no-audit 2>&1 | tail -3
  green "✅ npm install 完成"
fi
echo ""

# ── 6. .env 模板 ─────────────────────────────────────────────────────────
cyan "[6/6] 設定 .env 模板..."
ENV_DST="$CLAUDE_HOME/secrets/claude-series.env"
if [ -f "$ENV_DST" ]; then
  warn "  $ENV_DST 已存在 — 不覆蓋"
else
  cp "$TOOLKIT/.env.example" "$ENV_DST"
  chmod 600 "$ENV_DST"
  green "✅ 範本已放 $ENV_DST（chmod 600）"
fi
echo ""

# ── 完成 ─────────────────────────────────────────────────────────────────
cyan "═══ 安裝完成 ═══"
echo ""
echo "📝 接下來你要做："
echo ""
echo "  1️⃣  編輯 $ENV_DST，填上："
echo "      • BOT_UPLOAD_TOKEN  ← 向 James 拿 machine_token"
echo "      • 確認 BOT_UPLOAD_URL / DRIVE_FOLDER_ID"
echo ""
echo "  2️⃣  設 rclone gdrive remote（你自己的 Google 帳號）："
echo "      rclone config"
echo "      → 選 New remote、name 填 gdrive、type 選 Google Drive、其他預設"
echo ""
echo "  3️⃣  確認 James 已 share Drive folder 給你的 Google 帳號："
echo "      https://drive.google.com/drive/folders/1ljbamIk9reIFPs3_YqVj1eTn_cNZ194p"
echo ""
echo "  4️⃣  確認 iMessage 通知能 send 出去（一次性測試）："
echo "      osascript -e 'tell application \"Messages\" to send \"test\" to buddy \"0981928525\"'"
echo ""
echo "  5️⃣  做第一集："
echo "      • 把 raw.mkv + slides.md + transcript.md 放進 ~/Projects/claude-series/inbox/<slug>/"
echo "      • Claude Code 啟動 → 對話打：「/claude-series 處理 <slug>」"
echo ""
echo "📚 詳細 SOP：~/.claude/skills/claude-series/SKILL.md + pipeline.md"
echo ""
