import { GameState }  from './systems/GameState.js';
import { DataLoader }  from './systems/DataLoader.js';
import { UIManager }   from './systems/UIManager.js';

import { IntroScene }    from './scenes/IntroScene.js';
import { StudioScene }   from './scenes/StudioScene.js';
import { DialogueScene } from './scenes/DialogueScene.js';
import { QuoteScene }    from './scenes/QuoteScene.js';
import { NailGameScene } from './scenes/NailGameScene.js';
import {
  ResultScene,
  ComplaintScene,
  EndingScene,
} from './scenes/ResultComplaintEndingScenes.js';

// ── 全域單例 ──
const gameState  = new GameState();
const dataLoader = new DataLoader();
const uiManager  = new UIManager();

// 掛到 window 方便各 Scene 取用
window.__nail = { gameState, dataLoader, uiManager };

// ── 資料載入完成後啟動 ──
dataLoader.loadAll().then(() => {

  const config = {
    type:   Phaser.AUTO,
    parent: 'game-container',
    backgroundColor: '#FDF6F0',
    scale: {
      mode:       Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width:      390,
      height:     844,
    },
    scene: [
      IntroScene,
      StudioScene,
      DialogueScene,
      QuoteScene,
      NailGameScene,
      ResultScene,
      ComplaintScene,
      EndingScene,
    ],
  };

  const game = new Phaser.Game(config);

  game.events.on('ready', () => {
    // 代理 SceneManager.start，自動合併全域物件
    const manager   = game.scene;
    const _origStart = manager.start.bind(manager);
    manager.start = function(key, data) {
      return _origStart(key, {
        gameState:  window.__nail.gameState,
        dataLoader: window.__nail.dataLoader,
        uiManager:  window.__nail.uiManager,
        ...(data || {}),
      });
    };

    // 給首個 IntroScene 也注入
    const intro = manager.getScene('IntroScene');
    if (intro) {
      intro.gameState  = window.__nail.gameState;
      intro.dataLoader = window.__nail.dataLoader;
      intro.uiManager  = window.__nail.uiManager;
    }

    uiManager.hideLoading();
  });

}).catch(err => {
  console.error('初始化失敗：', err);
  const ls = document.getElementById('loading-screen');
  if (ls) ls.innerHTML = '<div style="padding:40px;text-align:center;color:#DB2777;font-size:15px;">資料載入失敗，請重新整理頁面</div>';
});
