/**
 * QuoteScene — 報價場景
 * 玩家選擇報價方案，影響客人滿意度與糾紛風險
 */
export class QuoteScene extends Phaser.Scene {
  constructor() { super({ key: 'QuoteScene' }); }

  init(data) {
    this.gameState  = data.gameState;
    this.dataLoader = data.dataLoader;
    this.uiManager  = data.uiManager;
  }

  create() {
    const { width: W, height: H } = this.scale;

    // 報價面板由 UIManager 處理
    this.uiManager.showQuotePanel(this.levelData(), (chosen) => {
      this.gameState.chosenPrice     = chosen.price;
      this.gameState.chosenPriceTier = chosen.tier;

      const result = this.gameState.evaluateQuote(this.levelData());
      this._showFeedback(result, () => {
        this.scene.start('NailGameScene', {
          gameState:  this.gameState,
          dataLoader: this.dataLoader,
          uiManager:  this.uiManager,
        });
      });
    });

    // 簡單背景
    this.add.rectangle(W / 2, H / 2, W, H, 0xFDF6F0);
  }

  levelData() {
    return this.dataLoader.getLevel(this.gameState.currentLevel);
  }

  _showFeedback(result, onDone) {
    let msg;
    if (result === 'ok')       msg = '✓ 報價被接受！客人表示在預算內。';
    else if (result === 'too_high') msg = '⚠ 報價略超出客人預算，有點猶豫……';
    else                            msg = '報價偏低，但客人很高興！';

    this.uiManager.showToast(msg, 2000);
    this.time.delayedCall(2200, onDone);
  }
}
