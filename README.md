# 徒手健身 PWA

繁體中文徒手健身 App。Vite + React + TypeScript + Three.js；資料儲存在裝置本機。

## 功能

- 34 個動作的完整人體立體示範；動作詳細頁和訓練主畫面使用同一個人物。
- 正面、側面、斜側面三個固定視角，0.5× / 0.75× / 1× / 2× 播放，紅色主要肌群與橘色輔助肌群。標色為概略體表區域。
- 動作庫、計畫及下一個動作的圖片，使用同一模型的靜態姿勢縮圖，避免清單同時啟用多個 WebGL context。
- 內建和自訂訓練計畫、倒數及休息計時、語音、音效、螢幕常亮與歷史紀錄。
- 訓練暫停同步停止人物；示範速度不改變訓練計時。載入失敗顯示重試操作，不切回舊版動畫。
- PWA 預先快取程式、模型和縮圖。模型以 gzip 無損壓縮分塊存放，下載約 2.5 MB，瀏覽器合併解壓後載入。

## 開發與部署

```sh
npm ci
npm run dev
npm run build
npm run preview
npm run deploy
```

`main` 為原始碼；GitHub Pages 發布 `gh-pages` 分支的建置輸出。
正式網址：https://pmebruce.github.io/bodyweight-pwa/

## 動作與資產

- `src/components/figure/demos.ts` / `rig.ts`：關節關鍵影格、節奏、深度提示與插值資料。
- `src/components/figure/motion-library.ts`：完整動作清單與對應訓練肌群。
- `scripts/build-motion-library.mjs`：建置供獨立 viewer 載入的 motion library，於 `prebuild` 自動執行。
- `public/movement3d/natural-rig.js`：3D 骨架、四個原有動作、其他動作的骨架重新定向、支撐點與肌群標色。
- `body-fullness.js`：保留骨架比例的小幅體型調整；`soften-face.js`：局部臉部表面柔化，保留鼻梁與頭部輪廓。
- `scene-props.js`：椅凳、牆面和單槓支撐物。
- `scripts/export-3d-stills.mjs`、`scripts/render-3d-stills.py`：重建姿勢檢查圖及縮圖；Python 需要 NumPy、Pillow。預設中間結果存於 `/tmp/bodyweight-3d-poses`，可透過 `BODYWEIGHT_POSE_OUTPUT` 指定。

```sh
node scripts/export-3d-stills.mjs
python scripts/render-3d-stills.py
npm run build
```

獨立 viewer 頁面排除於 SPA navigation fallback，並在 precache 配對時忽略 exercise/playing 參數。主 App 亦禁止在 viewer 子框架內啟動，防止舊快取造成重複嵌套。

## 授權

人體：Human base mesh with editable 53-bone rig，MakeHuman / MPFB，Innerscene library，CC0。
https://www.innerscene.com/tools/library/3d-parts/human-base-mesh-with-editable-53-bone-rig-8e7c8ab1

已調整統一身高、材質、局部體型與臉部表面；動作為程序式骨架動畫，並非真人動作捕捉。
Three.js 0.186.1：MIT，見 `public/movement3d/assets/THREE-LICENSE.txt`。
