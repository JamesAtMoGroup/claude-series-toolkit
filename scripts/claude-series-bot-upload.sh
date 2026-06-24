#!/usr/bin/env bash
# claude-series-bot-upload.sh
# 取代「cp 進 ~/claude-line-bot-v2/knowledge/courses/claude-實戰/ + git push」舊路線
# 直接 POST 到 bot endpoint /admin/knowledge — DB upsert idempotent、多機並行安全
#
# 用法:
#   claude-series-bot-upload.sh <slug> <vtt> <transcript> <slides> [title]
#
# 需要環境變數（從 ~/.claude/secrets/claude-series.env 或 ~/Projects/article-video/.env 讀）:
#   BOT_UPLOAD_URL   e.g. https://claude-ai-futurecoach.zeabur.app
#   BOT_UPLOAD_TOKEN <machine_token>

set -euo pipefail

usage() {
  echo "Usage: $0 <slug> <vtt-file> <transcript.md> <slides.md> [title]"
  echo ""
  echo "範例: $0 think-clearly out/think-clearly/foo.vtt inbox/think-clearly/transcript.md inbox/think-clearly/slides.md \"Claude 思考夥伴\""
  exit 1
}

[ $# -lt 4 ] && usage

SLUG="$1"
VTT="$2"
TRANSCRIPT="$3"
SLIDES="$4"
TITLE="${5:-$SLUG}"

# ── 載 env ────────────────────────────────────────────────────────────────
for envfile in ~/.claude/secrets/claude-series.env ~/Projects/article-video/.env; do
  if [ -f "$envfile" ]; then
    set -a
    # shellcheck disable=SC1090
    source "$envfile"
    set +a
    break
  fi
done

: "${BOT_UPLOAD_URL:?BOT_UPLOAD_URL 未設（~/.claude/secrets/claude-series.env）}"
: "${BOT_UPLOAD_TOKEN:?BOT_UPLOAD_TOKEN 未設（~/.claude/secrets/claude-series.env）}"

# ── 檔案存在性檢查 ────────────────────────────────────────────────────────
for f in "$VTT" "$TRANSCRIPT" "$SLIDES"; do
  [ -f "$f" ] || { echo "❌ 檔案不存在: $f"; exit 1; }
done

# ── POST 到 endpoint ──────────────────────────────────────────────────────
COURSE_TYPE="claude-實戰"
DATE=$(date +%F)

METADATA=$(printf '{"title":"%s","date":"%s","auto_uploaded":true,"slug":"%s"}' \
  "$TITLE" "$DATE" "$SLUG")

echo "📤 POST $BOT_UPLOAD_URL/admin/knowledge"
echo "   course_type=$COURSE_TYPE"
echo "   episode_id=$SLUG"
echo "   title=$TITLE"

RESP=$(curl -sS -X POST "$BOT_UPLOAD_URL/admin/knowledge" \
  -H "Authorization: Bearer $BOT_UPLOAD_TOKEN" \
  -F "course_type=$COURSE_TYPE" \
  -F "episode_id=$SLUG" \
  -F "metadata=$METADATA" \
  -F "vtt=@$VTT" \
  -F "script=@$TRANSCRIPT" \
  -F "article=@$SLIDES")

if echo "$RESP" | grep -q '"episode_id"'; then
  echo "✅ Upload 成功"
  echo "$RESP" | python3 -m json.tool 2>/dev/null || echo "$RESP"
else
  echo "❌ Upload 失敗"
  echo "$RESP"
  exit 1
fi
