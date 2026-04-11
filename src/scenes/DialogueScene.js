/**
 * DialogueScene — 對話場景
 * 客人需求確認、選項選擇、影響隱藏數值
 */
export class DialogueScene extends Phaser.Scene {
  constructor() { super({ key: 'DialogueScene' }); }

  init(data) {
    this.gameState  = data.gameState;
    this.dataLoader = data.dataLoader;
    this.uiManager  = data.uiManager;
  }

  create() {
    const { width: W, height: H } = this.scale;
    const customer  = this.gameState.currentCustomer;
    const levelKey  = `level${this.gameState.currentLevel}`;
    this.dialogue   = this.dataLoader.getLevelDialogue(levelKey);

    // ── 背景 ──
    this.add.rectangle(W / 2, H / 2, W, H, 0xFFF0F5);

    // ── 客人立繪區 ──
    this._drawCustomerAvatar(W, H, customer);

    // ── 參考圖預覽 ──
    this._drawPatternPreview(W, H);

    // ── 對話框 (HTML) ──
    this.uiManager.showDialogueBox();
    this.uiManager.setSpeaker(customer.name);

    // 啟動對話序列
    this.dialogQueue = [];
    this._buildQueue();
    this._runNextLine();
  }

  _drawCustomerAvatar(W, H, customer) {
    const g = this.add.graphics();
    // 大頭像背景
    const color = parseInt(customer.avatarColor.replace('#', ''), 16);
    g.fillStyle(color, 0.25);
    g.fillCircle(W / 2, H * 0.22, 65);
    g.fillStyle(color, 0.8);
    g.fillCircle(W / 2, H * 0.22, 50);

    this.add.text(W / 2, H * 0.22, customer.avatarInitials.slice(0, 2), {
      fontSize: '22px', color: '#2D1B0E', fontFamily: 'sans-serif', fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(W / 2, H * 0.35, customer.name, {
      fontSize: '14px', color: '#2D1B0E', fontFamily: 'sans-serif', fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(W / 2, H * 0.39, customer.age, {
      fontSize: '11px', color: '#A08060', fontFamily: 'sans-serif',
    }).setOrigin(0.5);
  }

  _drawPatternPreview(W, H) {
    const pattern = this.gameState.currentPattern;
    if (!pattern) return;

    const g = this.add.graphics();
    g.fillStyle(0xFFFFFF, 0.9);
    g.fillRoundedRect(W - 90, H * 0.08, 76, 96, 8);
    g.lineStyle(1, 0xFFD6E7);
    g.strokeRoundedRect(W - 90, H * 0.08, 76, 96, 8);

    // 指甲迷你預覽
    const nx = W - 52, ny = H * 0.08 + 28;
    const color = parseInt(pattern.baseColor.replace('#', ''), 16);
    g.fillStyle(0xEDCFB8, 1);
    g.fillRoundedRect(nx - 18, ny - 20, 36, 56, 14);
    g.fillStyle(color, 1);
    g.fillEllipse(nx, ny + 2, 28, 40);
    g.fillStyle(parseInt(pattern.decorColor.replace('#', ''), 16), 1);
    g.fillCircle(nx + 7, ny - 8, 6);  // 裝飾點

    this.add.text(nx, H * 0.08 + 82, pattern.baseColorName, {
      fontSize: '9px', color: '#A08060', fontFamily: 'sans-serif',
    }).setOrigin(0.5);
  }

  _buildQueue() {
    if (!this.dialogue) return;
    const { greeting, needs } = this.dialogue;

    // 打招呼序列
    greeting.forEach(line => {
      this.dialogQueue.push({ type: 'narrate', ...line });
    });

    // 需求確認問題
    needs.forEach(q => {
      this.dialogQueue.push({ type: 'question', ...q });
    });

    // 對話結束
    this.dialogQueue.push({ type: 'done' });
  }

  _runNextLine() {
    if (!this.dialogQueue.length) return;
    const line = this.dialogQueue.shift();

    if (line.type === 'narrate') {
      this.uiManager.setSpeaker(line.speaker === 'player' ? '你' : line.speaker);
      this.uiManager.typeText(line.text, () => {
        // 點擊繼續
        this.time.delayedCall(1200, () => this._runNextLine());
      });
    } else if (line.type === 'question') {
      this.uiManager.setSpeaker('你');
      this.uiManager.typeText(line.text, () => {
        this.uiManager.showOptions(line.options, (chosen) => {
          // 套用效果
          this.gameState.applyDialogueEffect(chosen.effect);
          this.gameState.logDialogue('player', chosen.text, chosen);

          // 顯示反饋
          if (chosen.feedback) {
            this.uiManager.showToast(chosen.feedback, 2500);
          }

          this.time.delayedCall(400, () => this._runNextLine());
        });
      });
    } else if (line.type === 'done') {
      // 對話結束，進入報價
      this.uiManager.clearOptions();
      this.uiManager.setSpeaker('你');
      this.uiManager.typeText('好，那我來說明一下報價方案。', () => {
        this.time.delayedCall(1000, () => {
          this.uiManager.hideDialogueBox();
          this._goToQuote();
        });
      });
    }
  }

  _goToQuote() {
    this.scene.start('QuoteScene', {
      gameState:  this.gameState,
      dataLoader: this.dataLoader,
      uiManager:  this.uiManager,
    });
  }

  shutdown() {
    this.uiManager.hideDialogueBox();
  }
}
