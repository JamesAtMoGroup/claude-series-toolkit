# claude-series-toolkit

> James 的「Claude 實戰」課程影片製作 pipeline，打包成可在任一台 Mac 安裝跑的 toolkit。
>
> Pipeline：真人錄影 (.mkv) + Remotion 疊層 + Editorial Doc 全幕場景切換。

---

## 你會拿到什麼

| 元件 | 路徑 | 用途 |
|---|---|---|
| 🤖 Skill | `skill/` | Claude Code skill 4 個 md（活化後 `/claude-series` 觸發完整 director） |
| 🔧 Scripts | `scripts/` | VTT 校正 / shift / bot endpoint 上傳 |
| 🎬 Remotion | `remotion/` | TypeScript composition + 7 個 reference topic |
| 📋 .env | `.env.example` | bot endpoint + Drive 設定 |
| ⚙️  Installer | `install.sh` | 一鍵裝 + symlink + npm install |

---

## 機器需求（Mac）

1. **macOS** + Apple Silicon 建議（Whisper / Remotion render 都吃 CPU）
2. **prereqs**：`ffmpeg`, `node` ≥ 20, `npm`, `git`, `rclone`, `python3`, `whisper`
3. **磁碟**：至少 30 GB free（render 中 + raw mkv + intermediate）

裝齊：
```bash
brew install ffmpeg node git rclone python3
pip3 install openai-whisper
```

---

## 安裝

```bash
# 1. clone（James 加你 collaborator 後）
git clone https://github.com/JamesAtMoGroup/claude-series-toolkit ~/claude-series-toolkit
cd ~/claude-series-toolkit

# 2. 跑 installer
./install.sh
```

`install.sh` 會：
- 檢查 prereqs
- symlink `skill/` → `~/.claude/skills/claude-series/`
- symlink `scripts/*` → `~/.claude/scripts/`
- 複製 `remotion/` → `~/Projects/claude-series/` + `npm install`
- 複製 `.env.example` → `~/.claude/secrets/claude-series.env`（chmod 600）

裝完還要你手動做 4 件事（installer 結尾會印一遍）：

1. **編輯 `~/.claude/secrets/claude-series.env`** 填上：
   - `BOT_UPLOAD_TOKEN` — 向 James 拿（machine_token，James admin mint 給你）
   - 確認 `BOT_UPLOAD_URL` / `DRIVE_FOLDER_ID` 不要改

2. **`rclone config`** 設你的 Google 帳號的 gdrive remote：
   - New remote → name=`gdrive` → type=Google Drive → 其他預設

3. **確認 James 已把 Drive folder share 給你**：
   ```
   https://drive.google.com/drive/folders/1ljbamIk9reIFPs3_YqVj1eTn_cNZ194p
   ```

4. **iMessage 通知測試**（你 Mac 用自己 Apple ID 登入即可，James 收 SMS）：
   ```bash
   osascript -e 'tell application "Messages" to send "test" to buddy "0981928525"'
   ```

---

## 第一次做一集

1. 拿到素材後放進 `~/Projects/claude-series/inbox/<slug>/`：
   - `raw.mkv` — 原始錄影
   - `slides.md` — 投影片大綱
   - `transcript.md` — 規劃稿（含【畫面】標記）

2. 啟動 Claude Code，輸入：
   ```
   /claude-series 處理 <slug>
   ```

3. Director 會：
   - Phase 1: 決定 trim + transitions
   - Phase 2: Footage / Audio / Whisper / Slide mapping（平行）
   - Phase 3: Overlay Spec
   - Phase 4: Scene Dev 寫 TSX
   - Phase 5: QA + 視覺 premortem + 預覽 gate（會 ping 你看 Studio）
   - Phase 6: Render + VTT shift + Drive upload + Bot endpoint POST + iMessage

---

## Pipeline 詳細

| 文件 | 對應 |
|---|---|
| `~/.claude/skills/claude-series/SKILL.md` | 啟動 + 6 phase 概覽 + 26 條鐵律 |
| `~/.claude/skills/claude-series/pipeline.md` | 每 phase 詳細指令 + 範例 |
| `~/.claude/skills/claude-series/design.md` | Editorial Doc design tokens + 7 種 overlay + audio chain |
| `~/.claude/skills/claude-series/vtt-corrections.md` | Whisper 中文錯字對照（200+ 條 sed 規則） |

---

## 兩台機器並行注意事項

- **Bot endpoint** 走 DB upsert idempotent — 兩台機器同時跑不同 topic 安全
- **同 topic 同時跑** 兩台會打架（最後 POST 贏）— 別這樣做
- **Drive folder** 大家進同一個 — `Claude Chat - {中文標題}` 前綴一致
- **iMessage** 都發給 James 0981928525

---

## 維護

- Skill / scripts 更新：`git pull` 後 symlink 自動生效（不用重跑 install）
- Remotion 程式碼更新：`git pull` 後手動 `cp -R remotion/. ~/Projects/claude-series/` 或重跑 install
- `.env` **永遠不上 git** — 在 `.gitignore` 排除了

---

## 出問題找誰

- Bot endpoint 401 / 404：跟 James 確認 token 還活著（admin 端 `GET /admin/machine-tokens` 看 list）
- Drive 上傳失敗：rclone config 跑一次確認 gdrive remote、確認你的 Google account 能進 share folder
- Remotion render 卡：看 `pipeline.log`、確認 Mac 有沒有其他 render 在跑（vibe-coding-video / article-video）
- VTT 通讀錯字漏：用 `99agent` skill 三視角 review（typo-hunter + curious-student + chinese-grammarian）

---

🤖 Generated with [Claude Code](https://claude.com/claude-code)
