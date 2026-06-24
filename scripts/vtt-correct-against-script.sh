#!/usr/bin/env bash
# vtt-correct-against-script.sh — 用 LLM 修 Whisper 同音字 typo（保留 audio reality）
#
# 2026-06-11 策略修正：vtt 字幕對齊 audio reality (講者實際說的)，不是 script 文章版
# 之前版本錯了 — 把字幕改寫成 script 書面版，導致字幕跟講者聲音對不上
#
# Usage: vtt-correct-against-script.sh <input.vtt> <script.md> <output.vtt>
set -euo pipefail

IN_VTT="${1:?Usage: $0 <input.vtt> <script.md> <output.vtt>}"
SCRIPT="${2:?missing script.md}"
OUT_VTT="${3:?missing output.vtt}"

[ -f "$IN_VTT" ] || { echo "❌ vtt 不在: $IN_VTT"; exit 1; }
[ -f "$SCRIPT" ] || { echo "❌ script 不在: $SCRIPT"; exit 1; }

PROMPT=$(cat <<'EOF'
你是字幕「同音字校正」助手 — **只修錯字、不改寫**。

═══ 輸入 ═══
1. WEBVTT 字幕檔（Whisper 自動轉，時間軸對、但 Whisper 把音素聽錯導致同音字錯誤）
2. 逐字稿 script.md（字 100% 正確，但寫的是書面文章版）

═══ 你的工作（極其重要、不准搞錯）═══

只修「Whisper 把音素聽成錯誤的同音字 / 形近字」這類錯誤：
- 「蒸餾」聽成「增6」 → 改回「蒸餾」
- 「Claude」聽成「Cloud」/「Code」 → 改回「Claude」
- 「比利時」聽成「比例是」 → 改回「比利時」
- 「Anthropic」聽成「Ansorbic」/「Antrobic」 → 改回「Anthropic」
- 「董事會」聽成「懂事會」 → 改回「董事會」
- 「興衰」聽成「新衰」 → 改回「興衰」
- 「Phi」聽成「Fee」 → 改回「Phi」
- 「播報員」聽成「博報員」 → 改回「播報員」
- 「掰掰」聽成「bye bye」 → 改回「掰掰」
- 數字寫法 cue 內已用阿拉伯（9,650 億）就保留，不轉中文版（九千六百五十億）

═══ 絕對不准做 ═══

⛔ **不准改寫字句結構** — 講者實際說「想想看」就保留「想想看」，不可改成 script 的「思考一下」
⛔ **不准補 spoken filler 也不准移除 spoken filler** — 講者說「就」「呢」「一個」「比較」「啊」就保留；script 沒寫不代表要移
⛔ **不准把「一問一答」改成「問與答」** — Whisper 沒打書名號就不要補；保留 Whisper 的標點
⛔ **不准合併 / 拆 cue** — cue 邊界跟 Whisper 給的完全一樣，cue 數量不變
⛔ **不准補 script 的書面標點**（「」、——、「以...為例」等書面結構）
⛔ **不准把「一句話塞給他」對齊 script 改成「丟給它全部」** — 講者實際說什麼就什麼
⛔ **拿不準是否是同音字錯時保留 Whisper 版本** — 寧可少改、不要改錯

═══ 判斷原則 ═══

判斷某個字要不要改的唯一準則：
**這個字是「Whisper 把音聽錯」(同音字錯誤) 嗎？** 是 → 改。不是 → 保留 Whisper 原文。

例：
- Whisper「我想想看」script「我來思考一下」
  → 「想」不是同音字錯（講者真的說「想」），保留「我想想看」
- Whisper「Cloud Opus」script「Claude Opus」
  → 「Cloud」是同音字錯（講者說的是 Claude），改成「Claude Opus」

═══ 輸出格式 ═══

完整 WEBVTT（含 WEBVTT header + 所有 cue），cue 數量跟 input 完全一樣。
**只輸出 vtt 內容、不要解釋、不要 markdown code fence**。

═══ INPUT VTT (Whisper transcription，audio reality，含同音字 typo) ═══
EOF
)

echo "$PROMPT" > /tmp/_vtt_fix_prompt.txt
echo "" >> /tmp/_vtt_fix_prompt.txt
cat "$IN_VTT" >> /tmp/_vtt_fix_prompt.txt
echo "" >> /tmp/_vtt_fix_prompt.txt
echo "═══ INPUT SCRIPT (參考字、書面文章版) ═══" >> /tmp/_vtt_fix_prompt.txt
echo "" >> /tmp/_vtt_fix_prompt.txt
cat "$SCRIPT" >> /tmp/_vtt_fix_prompt.txt

echo "→ 跑 LLM 同音字校正（~30-90 秒）..."
# 🚨 token limit bump — 預設 32k 會把長 vtt 切尾 (06-12 案：18 cue truncated)
# 7 分鐘 vtt 約 100-150 cue ≈ 8-12k tokens output；64k 給安全 buffer
CLAUDE_CODE_MAX_OUTPUT_TOKENS=64000 \
  claude -p "$(cat /tmp/_vtt_fix_prompt.txt)" --model sonnet 2>/dev/null > "$OUT_VTT"

# 驗：output 應該以 WEBVTT 開頭 + cue 數量一樣
if head -1 "$OUT_VTT" | grep -q "WEBVTT"; then
  IN_CUES=$(grep -c '\-\->' "$IN_VTT")
  OUT_CUES=$(grep -c '\-\->' "$OUT_VTT")
  echo "✓ 校正完成 → $OUT_VTT"
  echo "  原 vtt: $IN_CUES cue / 新 vtt: $OUT_CUES cue"
  if [ "$IN_CUES" != "$OUT_CUES" ]; then
    echo "  ⚠️ cue 數量變了！LLM 違反「不准合併/拆 cue」規則"
  fi
else
  echo "⚠️ output 不像 vtt — 看 $OUT_VTT 確認"
  head -5 "$OUT_VTT"
fi
