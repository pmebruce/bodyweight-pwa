# 徒手健身 PWA

不需器材的徒手健身 Progressive Web App（繁體中文）。Vite + React + TypeScript + Framer Motion + vite-plugin-pwa。

## 功能
- 動作庫：20 個徒手動作，含部位、難度、動作要點與 SVG 人形循環示範動畫（骨架關鍵影格 + 正向/反向運動學，有頭髮、T 恤、短褲、球鞋與陰影，支援深色模式、0.5× 慢速與「減少動態效果」）；可依部位篩選、搜尋
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

示範動畫程式在 `src/components/figure/`：`rig.ts`（骨架、FK/IK、關鍵影格插值）、`draw.ts`（身體形狀）、`demos.ts`（20 個動作的關鍵影格）。
開發時可開 `http://localhost:5173/bodyweight-pwa/dev/figures.html?phases=0,0.5` 一次檢查所有動作的姿勢（只在 dev server 有，不會打包進正式版）。

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

## 3D 自然體型示範

深蹲、伏地挺身、弓箭步、開合跳：動作詳細頁與訓練主畫面預設使用稍豐腴完整人體，支援旋轉、正側視角、主要區域標示，以及原動畫切換。詳細頁速度包含 2×；訓練暫停同步停止人物，示範速度不影響計時。其餘動作與動作庫縮圖維持原 SVG。
模型隨 App 部署並由 PWA 快取，不依賴私人 Sites；GLB 以 gzip 無損壓縮分塊存放，瀏覽器合併解壓再載入。WebGL 或載入失敗時自動切回原動畫。
模型來源：https://www.innerscene.com/tools/library/3d-parts/human-base-mesh-with-editable-53-bone-rig-8e7c8ab1 (MakeHuman/MPFB, CC0)。軀幹與四肢略增厚，保留骨架比例；程序式動畫並非真人捕捉。Three.js MIT 授權見 public/movement3d/assets/THREE-LICENSE.txt。

### 3D 快取路由修正

獨立 3D 頁面排除於 SPA 導覽 fallback，並在 precache 對應時忽略 exercise/playing 參數，避免載入主 App 造成 iframe 遞迴。主 App 啟動時也阻止在 movement3d 子框架內執行，讓舊快取錯誤時能安全回到原動畫。
