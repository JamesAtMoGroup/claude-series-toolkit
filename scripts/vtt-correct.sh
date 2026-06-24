#!/usr/bin/env bash
# Whisper VTT 校正 — Whisper 中文常見錯字 / 同音字 / 技術名詞 / 課程系列累積詞庫
# 用法: vtt-correct.sh <input.vtt> <output.vtt>
#
# 累積規則來源：
#   - claude-series 通用詞表（Claude/HTML/Prompt 等專有名詞、逐字稿等）
#   - vibe-coding-video 1-1 / 1-2 / 1-3 三集 99agent audit 抓出
#   - 跑完後仍建議人工掃過時間戳跨度大的 cue

set -euo pipefail

IN="${1:?Usage: $0 <input.vtt> <output.vtt>}"
OUT="${2:?Usage: $0 <input.vtt> <output.vtt>}"

# 注意 sed 順序：長 string 先處理、避免 substring 被先 replace
sed -E \
  -e 's/特奧的/Claude/g' \
  -e 's/特奧/Claude/g' \
  -e 's/特勞的/Claude/g' \
  -e 's/特勞/Claude/g' \
  -e 's/[Cc]row[Jj]et/Claude/g' \
  -e 's/克勞的/Claude/g' \
  -e 's/克勞/Claude/g' \
  -e 's/Claudeproject的/Claude Projects 的/g' \
  -e 's/Claudeproject/Claude Projects/g' \
  -e 's/Cloud券/Claude Chat/g' \
  -e 's/Claude券/Claude Chat/g' \
  -e 's/[Pp]ront/Prompt/g' \
  -e 's/[Pp]rote/Prompt/g' \
  -e 's/[Pp]rount/Prompt/g' \
  -e 's/[Cc]ontest/Context/g' \
  -e 's/S&ITES/Action Items/g' \
  -e 's/Sianitis/Action Items/g' \
  -e 's/[Cc]laude[Ss]hare/Claude Chat/g' \
  -e 's/可要確/Claude/g' \
  -e 's/客套的/Claude/g' \
  -e 's/阻止搞/逐字稿/g' \
  -e 's/阻止稿/逐字稿/g' \
  -e 's/主制搞/逐字稿/g' \
  -e 's/主資稿/逐字稿/g' \
  -e 's/足資稿/逐字稿/g' \
  -e 's/主製稿/逐字稿/g' \
  -e 's/組織搞/逐字稿/g' \
  -e 's/組織稿/逐字稿/g' \
  -e 's/示範用的逐字搞/示範用的逐字稿/g' \
  -e 's/這兩刻/這堂課/g' \
  -e 's/兩刻/這堂課/g' \
  -e 's/這樣客/這堂課/g' \
  -e 's/亂招造/亂糟糟/g' \
  -e 's/亂召召/亂糟糟/g' \
  -e 's/亂照照/亂糟糟/g' \
  -e 's/輿住址/語助詞/g' \
  -e 's/宇宙池/語助詞/g' \
  -e 's/輿諸子/語助詞/g' \
  -e 's/重點在咬/重點摘要/g' \
  -e 's/重點摘咬/重點摘要/g' \
  -e 's/在咬/摘要/g' \
  -e 's/摘咬/摘要/g' \
  -e 's/動時開桶/動詞開頭/g' \
  -e 's/正式輸面中文/正式書面中文/g' \
  -e 's/結取/擷取/g' \
  -e 's/天馬行通/天馬行空/g' \
  -e 's/脫意進來/拖曳進來/g' \
  -e 's/官號裡面/括號裡面/g' \
  -e 's/上下午的記憶/上下文的記憶/g' \
  -e 's/壓收/壓縮/g' \
  -e 's/Kerl 卻的/Claude Chat/g' \
  -e 's/Kerl卻的/Claude Chat/g' \
  -e 's/Kerl/Claude/g' \
  -e 's/[客靠]的/Claude/g' \
  -e 's/cloud shared/Claude Chat/g' \
  -e 's/Cloud/Claude/g' \
  -e 's/Bullshit/Claude Chat/g' \
  -e 's/卻的/Chat/g' \
  -e 's/STNL/HTML/g' \
  -e 's/HTN/HTML/g' \
  -e 's/agmail/HTML/g' \
  -e 's/公文詩/工程師/g' \
  -e 's/稱之不起/參差不齊/g' \
  -e 's/把它伸出來/把它生出來/g' \
  -e 's/方法叫出去/方法教出去/g' \
  -e 's/整套新法/整套心法/g' \
  -e 's/歷史新之一九/歷史行之已久/g' \
  -e 's/比例這一堂課/畢竟這一堂課/g' \
  -e 's/平感覺寫程式/憑感覺寫程式/g' \
  -e 's/降為打擊/降維打擊/g' \
  -e 's/Portal Type/Prototype/g' \
  -e 's/螢幕級類/emoji 之類/g' \
  -e 's/挑一些全線/挑一些權限/g' \
  -e 's/細細的雕/細細的刁/g' \
  -e 's/Landing Patch/Landing Page/g' \
  -e 's/夜市的頁面/一頁式的頁面/g' \
  -e 's/外邊具/外邊距/g' \
  -e 's/需要的這個地圖/需要的這個圖片/g' \
  -e 's/這樣刻目標/這樣的目標/g' \
  -e 's/錢在流量/潛在流量/g' \
  -e 's/讓AIS自動/讓AI自動/g' \
  -e 's/超我這個努力/朝我這個努力/g' \
  -e 's/黃雲軒/黃仁勳/g' \
  -e 's/疊帶/迭代/g' \
  -e 's/跌帶/迭代/g' \
  -e 's/抵叫起來/比較起來/g' \
  -e 's/正在藏我/正在幫我/g' \
  -e 's/夜市工程師/Yes 工程師/g' \
  -e 's/bug 生素/bug 申訴/g' \
  -e 's/bug生素/bug 申訴/g' \
  -e 's/不會予取/不會允許/g' \
  -e 's/微送體/微宋體/g' \
  -e 's/深層對你的圖片/生成對應的圖片/g' \
  -e 's/疹病回前一行/整併回前一行/g' \
  -e 's/直播獎做/直播講座/g' \
  -e 's/斷引/短影音/g' \
  -e 's/排版熱/排版類/g' \
  -e 's/我們也很著急/我們以前早期/g' \
  -e 's/哎哎哎/欸 AI/g' \
  -e 's/哎哎/AI/g' \
  -e 's/且使用的東西/且實用的東西/g' \
  -e 's/新銷人/行銷人/g' \
  -e 's/作為未來/所以未來/g' \
  -e 's/34篇文章/3、4篇文章/g' \
  -e 's/程度跟鏡頭/程度跟盡頭/g' \
  -e 's/Trap GPT/ChatGPT/g' \
  -e 's/Claude Co,/Claude Code,/g' \
  -e 's/VSCore/VS Code/g' \
  -e 's/Claude Core/Claude Code/g' \
  -e 's/SARS/SaaS/g' \
  -e 's/這兩課/這兩堂課/g' \
  -e 's/Vibecoding/Vibe Coding/g' \
  -e 's/[Vv]ive ?[Cc]oding/Vibe Coding/g' \
  -e 's/[Ff]ive ?[Cc]oding/Vibe Coding/g' \
  -e 's/[Ll]ive ?[Aa]pp ?[Cc]oding/來 Vibe Coding/g' \
  -e 's/Vive Code/Vibe Coding/g' \
  -e 's/一%/1%/g' \
  -e 's/你是先先想好/你事先先想好/g' \
  -e 's/我不需要開課程/我必須要開課程/g' \
  -e 's/不應該在為了任何事情/不應該再為了任何事情/g' \
  -e 's/可以達到出來/可以做出來/g' \
  -e 's/也是要很重要帶大家思考的/也很重要、要帶大家思考的/g' \
  -e 's/全部也都是/都是/g' \
  -e 's/讓人家說服來用/說服人家來用/g' \
  -e 's/梳理了你們的/整理了你們的/g' \
  -e 's/上帳課/上這堂課/g' \
  -e 's/人手要購/人手要夠/g' \
  -e 's/狀況型企業/傳統型企業/g' \
  -e 's/承接的按量/承接的案量/g' \
  -e 's/創作者生氣/創作者神器/g' \
  -e 's/字卡生氣/字卡神器/g' \
  -e 's/微調時間走/微調時間軸/g' \
  -e 's/前進一多/情境一多/g' \
  -e 's/穿一個Whisper/串一個 Whisper/g' \
  -e 's/它是鋼區/它是剛需/g' \
  -e 's/沒有退訂月/沒有退訂/g' \
  -e 's/拼一個設計師/聘一個設計師/g' \
  -e 's/廚紙點數/儲值點數/g' \
  -e 's/老闆要自己廚紙/老闆要自己儲值/g' \
  -e 's/腳電費/繳電費/g' \
  -e 's/發不到廣告/發布廣告/g' \
  -e 's/每邊人員/美編人員/g' \
  -e 's/FD ?人才團隊/FDE 人才團隊/g' \
  -e 's/注射一個網域/註冊一個網域/g' \
  -e 's/時報時銷/實報實銷/g' \
  -e 's/PodCase/Podcast/g' \
  -e 's/有所錯誤/有所收穫/g' \
  -e 's/擁唱出來/詠唱出來/g' \
  -e 's/自動把雲露出來/自動把錄音出來/g' \
  -e 's/久久A卷/99Agent/g' \
  -e 's/達到一個出來/打造一個出來/g' \
  -e 's/這個歷史/這個歷史紀錄/g' \
  -e 's/[Bb]ybe ?[Cc]oding/Vibe Coding/g' \
  -e 's/中端機板/終端機版/g' \
  -e 's/中端機/終端機/g' \
  -e 's/秘密碼碼/密密麻麻/g' \
  -e 's/有全線/有權限/g' \
  -e 's/整個全線/整個權限/g' \
  -e 's/天寫表單/填寫表單/g' \
  -e 's/用的用者發現/用著用著發現/g' \
  -e 's/很多大小小/很多大大小小/g' \
  -e 's/登錄給大家看/登入給大家看/g' \
  -e 's/從登錄就要/從登入就要/g' \
  -e 's/急著登錄/急著登入/g' \
  -e 's/桌面板/桌面版/g' \
  -e 's/外掛板/外掛版/g' \
  -e 's/應用板/應用版/g' \
  -e 's/這個 codex/這個 Codex/g' \
  -e 's/[Pp]amp/Prompt/g' \
  -e 's/[Pp]ound/Prompt/g' \
  -e 's/Planter/Prompt/g' \
  -e 's/\bprompt\b/Prompt/g' \
  -e 's/[Gg]i[th]+ub/GitHub/g' \
  -e 's/GitHub[ 的]+[Pp]ages?/GitHub Pages/g' \
  -e 's/報名業/報名頁/g' \
  -e 's/活動報名業/活動報名頁/g' \
  "$IN" > "$OUT"

MODIFIED=$(diff <(cat "$IN") <(cat "$OUT") | grep -c "^>" || true)
echo "Corrected: $IN → $OUT"
echo "Modified lines: $MODIFIED"
