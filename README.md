# 指尖上的創業 — 美甲工作室模擬遊戲

從政大大學報報導《[指尖上的產業擴張：美甲熱潮下的制度隱憂](https://unews.nccu.edu.tw/unews/nails-beauty-nailartist/)》延伸的融媒體互動遊戲。

## 關於這個遊戲

玩家扮演一名美甲師，經歷接客、溝通、報價、施作、客訴等完整流程，體驗美甲產業的創業壓力與制度現實。

**核心玩法**
- 與客人對話，確認需求（影響後續隱藏數值）
- 選擇報價方案（影響客人滿意度與糾紛風險）
- 親手完成美甲 mini game（塗底色 + 畫圖案）
- 面對申訴流程，處理消費糾紛

## 技術架構

```
nail-game/
├── index.html
├── src/
│   ├── main.js                  # 遊戲入口
│   ├── scenes/
│   │   ├── IntroScene.js        # 前導新聞
│   │   ├── StudioScene.js       # 工作室主畫面
│   │   ├── DialogueScene.js     # 對話系統
│   │   ├── QuoteScene.js        # 報價
│   │   ├── NailGameScene.js     # 美甲 mini game（核心）
│   │   └── ResultComplaintEndingScenes.js
│   ├── systems/
│   │   ├── GameState.js         # 數值管理
│   │   ├── DataLoader.js        # JSON 資料載入
│   │   ├── UIManager.js         # HTML overlay UI
│   │   └── NailCanvas.js        # Canvas 2D 繪圖引擎
│   ├── data/
│   │   ├── levels.json          # 關卡設定
│   │   ├── customers.json       # 客人資料
│   │   ├── dialogues.json       # 對話劇本
│   │   ├── nailPatterns.json    # 美甲圖案參數
│   │   └── complaints.json      # 申訴流程
│   └── ui/
│       └── style.css
```

## 本地開發

由於使用 ES Modules 和 fetch，需要透過本地 HTTP server 執行（直接開 HTML 會有 CORS 問題）：

```bash
# 方式一：Python
python3 -m http.server 8080

# 方式二：Node.js (需安裝 serve)
npx serve .

# 方式三：VS Code Live Server 插件
```

然後開啟 `http://localhost:8080`

## 部署到 GitHub Pages

1. 將整個 `nail-game` 資料夾推上 GitHub
2. Settings → Pages → Source：選 `main` branch，根目錄 `/`
3. 等待部署完成（約 1–3 分鐘）

## 擴充新關卡

只需要在以下 JSON 檔新增資料，**不需動程式碼**：

- `src/data/levels.json` — 新增關卡設定
- `src/data/dialogues.json` — 新增對話劇本（`level{N}` key）
- `src/data/nailPatterns.json` — 新增圖案參數
- `src/data/customers.json` — 新增客人資料（如需要）

## 開發優先順序（Phase 1 → 3）

| Phase | 項目 |
|-------|------|
| Phase 1 MVP | 場景切換 + 對話 + 報價 + mini game 基本版 + 結算 |
| Phase 2 | 申訴流程 + 完整分支判定 + 前導動畫 + 全關卡劇本 |
| Phase 3 | 美術替換 + 音效 + 動畫 + 行動觸控優化 |

## 技術依賴

- [Phaser 3.60](https://phaser.io/) — 遊戲場景與互動
- HTML5 Canvas 2D — 美甲繪圖引擎
- 純前端，無後端依賴，可直接部署至 GitHub Pages

---

延伸報導：[指尖上的產業擴張：美甲熱潮下的制度隱憂](https://unews.nccu.edu.tw/unews/nails-beauty-nailartist/)  
製作：政大大學報融媒體作品
