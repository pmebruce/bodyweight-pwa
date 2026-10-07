# 徒手健身 PWA

不需器材的徒手健身 Progressive Web App（繁體中文）。Vite + React + TypeScript + Framer Motion + vite-plugin-pwa。

## 功能
- 動作庫：20 個徒手動作，含部位、難度、動作要點與 SVG 火柴人循環動畫；可依部位篩選、搜尋
- 訓練計畫：4 個內建計畫（新手全身、核心強化、下肢燃脂、7 分鐘 HIIT）＋自訂計畫（新增 / 編輯 / 拖曳排序 / 刪除 / 複製內建計畫）
- 訓練進行中：倒數圓環、組數、次數點擊完成、休息計時（+10 秒 / 跳過）、暫停 / 上一個 / 跳過、進度條、轉場動畫、中文語音提示、嗶聲、震動（支援的裝置）、螢幕常亮（Wake Lock）、完成彩帶與總結
- 訓練紀錄：本週次數、連續天數、總分鐘、本週長條圖、歷史清單
- 設定：暱稱、每週目標、預設休息秒數、準備倒數、語音 / 音效 / 震動開關、JSON 匯出 / 匯入、清除資料
- 離線可用（Service Worker 預先快取），資料存在 localStorage

## 開發
```bash
npm install
npm run dev        # 開發伺服器
npm run build      # 型別檢查 + 產生 dist/
npm run preview    # 預覽 production build（port 4173）
node scripts/gen-icons.mjs   # 重新產生 PWA / apple-touch 圖示
```

## 部署（GitHub Pages）
網址：https://pmebruce.github.io/bodyweight-pwa/

```bash
npm run deploy     # build 並把 dist/ 推到 gh-pages 分支，約 1 分鐘後上線
```

Pages 來源是 `gh-pages` 分支。`ci/github-pages-deploy.yml` 是 GitHub Actions 版本的部署流程：
若要改成「push 到 main 就自動部署」，把它移到 `.github/workflows/deploy.yml` 推上去（需要有 `workflow` 權限的帳號 / token），
再到 Settings → Pages 把 Source 改成 GitHub Actions。

## 安裝到 iPhone
用 Safari 開啟網址 → 分享 → 加入主畫面。
