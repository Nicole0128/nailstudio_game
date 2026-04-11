import { NailCanvas } from '../systems/NailCanvas.js';

/**
 * NailGameScene — 美甲 mini game 核心場景
 * 步驟：0 上底色 → 1 畫圖案 → 2 完成
 */
export class NailGameScene extends Phaser.Scene {
  constructor() { super({ key: 'NailGameScene' }); }

  init(data) {
    this.gameState  = data.gameState;
    this.dataLoader = data.dataLoader;
    this.uiManager  = data.uiManager;
  }

  create() {
    const { width: W, height: H } = this.scale;
    const pattern   = this.gameState.currentPattern;
    const levelData = this.dataLoader.getLevel(this.gameState.currentLevel);

    // ── 顯示 Mini game UI ──
    this.uiManager.showNailGame();

    // ── 取得 Canvas 元素 ──
    const nailCanvasEl = document.getElementById('nail-canvas');
    const refCanvasEl  = document.getElementById('ref-canvas');

    // 設定 Canvas 尺寸
    const workArea = document.getElementById('work-area');
    const rect = workArea.getBoundingClientRect();
    nailCanvasEl.width  = Math.min(280, rect.width  - 20);
    nailCanvasEl.height = Math.min(360, rect.height - 20);

    // ── 建立 NailCanvas 引擎 ──
    this.nailCanvas = new NailCanvas(nailCanvasEl, refCanvasEl, pattern);
    this.step = 0;

    // ── 顏色選盤（步驟 0：底色）──
    this._setupStep0();

    // ── 計時器 ──
    this.timeLeft = levelData.timeLimitSeconds + this.gameState.getToleranceBonus() * 10;
    this.timerEvent = this.time.addEvent({
      delay: 1000,
      callback: this._onTick,
      callbackScope: this,
      loop: true,
    });
    this.uiManager.updateTimer(this.timeLeft);

    // 材料加成提示
    if (this.gameState.materialTier === 'brand') {
      this.uiManager.showToast('✨ 使用品牌材料，容錯率 +8%', 2500);
    }

    // ── 撤銷 / 清除 ──
    this.uiManager.setUndoBtn(() => this.nailCanvas.undo());
    this.uiManager.setClearBtn(() => this.nailCanvas.clear());
  }

  _setupStep0() {
    const pattern = this.gameState.currentPattern;
    const colors  = [
      { name: pattern.baseColorName, value: pattern.baseColor },
      { name: '白色',   value: '#FFFFFF' },
      { name: '裸色',   value: '#E8C9A8' },
      { name: '霧粉',   value: '#FFD6E7' },
    ];

    this.uiManager.buildColorSwatches(colors, (c) => this.nailCanvas.setColor(c.value));
    this.uiManager.buildBrushSizes([10, 14, 20], (s) => this.nailCanvas.setBrushSize(s));
    this.uiManager.updateStepDots(0);
    this.uiManager.setStepHint('步驟 1：幫指甲塗上底色');
    this.uiManager.setNextStepBtn('完成底色，進行圖案 →', () => this._goToStep1());
  }

  _goToStep1() {
    const coverage = this.nailCanvas.getLiveCoverage();
    if (coverage < 40) {
      this.uiManager.showToast('⚠ 底色還沒塗滿！請再塗一下', 2000);
      return;
    }
    this.step = 1;
    this.nailCanvas.enterDecorStep();

    const pattern = this.gameState.currentPattern;
    const colors  = [
      { name: pattern.decorColorName, value: pattern.decorColor },
      { name: '白色', value: '#FFFFFF' },
      { name: '金色', value: '#C4956A' },
    ];

    this.uiManager.buildColorSwatches(colors, (c) => this.nailCanvas.setColor(c.value));
    this.uiManager.buildBrushSizes([6, 10, 14], (s) => this.nailCanvas.setBrushSize(s));
    this.uiManager.updateStepDots(1);
    this.uiManager.setStepHint('步驟 2：照著參考圖，畫上圖案');
    this.uiManager.setNextStepBtn('完成施作 ✓', () => this._finish());
  }

  _finish() {
    // 停止計時
    if (this.timerEvent) this.timerEvent.remove();

    const levelData = this.dataLoader.getLevel(this.gameState.currentLevel);
    const scores    = this.nailCanvas.calculateScores(this.timeLeft, levelData.timeLimitSeconds);

    // 材料加成
    const bonus = this.gameState.getMaterialBonus();
    scores.coverage    = Math.min(100, scores.coverage    + bonus);
    scores.neatness    = Math.min(100, scores.neatness    + bonus);
    scores.restoration = Math.min(100, scores.restoration + bonus);

    this.gameState.scores = scores;
    this.uiManager.updateLiveScore(scores.coverage, scores.neatness);

    this.uiManager.hideNailGame();

    // 進入結算
    this.scene.start('ResultScene', {
      gameState:  this.gameState,
      dataLoader: this.dataLoader,
      uiManager:  this.uiManager,
    });
  }

  _onTick() {
    this.timeLeft--;
    this.uiManager.updateTimer(this.timeLeft);

    // 即時分數更新
    if (this.nailCanvas) {
      const cov = this.nailCanvas.getLiveCoverage();
      this.uiManager.updateLiveScore(cov, 0);
    }

    if (this.timeLeft <= 0) {
      this.uiManager.showToast('時間到！自動完成施作', 2000);
      this._finish();
    }
  }

  shutdown() {
    this.uiManager.hideNailGame();
    if (this.timerEvent) this.timerEvent.remove();
  }
}
