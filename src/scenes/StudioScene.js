/**
 * StudioScene — 工作室主畫面
 * 玩家在這裡選擇材料、設備、接客安排，然後進入對話
 */
export class StudioScene extends Phaser.Scene {
  constructor() { super({ key: 'StudioScene' }); }

  init(data) {
    this.gameState  = data.gameState;
    this.dataLoader = data.dataLoader;
    this.uiManager  = data.uiManager;
  }

  create() {
    const { width: W, height: H } = this.scale;

    this.gameState.resetForNewLevel();

    // 取得本關資料
    this.levelData = this.dataLoader.getLevel(this.gameState.currentLevel);
    const customer = this.dataLoader.getCustomer(this.levelData.customerId);
    this.gameState.currentCustomer = customer;
    this.gameState.currentPattern  = this.dataLoader.getPattern(this.levelData.patternId);

    // ── 背景 ──
    this.add.rectangle(W / 2, H / 2, W, H, 0xFDF6F0);

    // ── 工作室桌面 ──
    this._drawStudio(W, H);

    // ── 今日預約 ──
    this._drawAppointment(W, H, customer);

    // ── 材料選擇 ──
    this._drawMaterialChoice(W, H);

    // ── 開始接客按鈕 ──
    this._drawStartBtn(W, H);

    // ── 狀態列 ──
    this._drawStatusBar(W, H);
  }

  _drawStudio(W, H) {
    // 桌面
    const desk = this.add.graphics();
    desk.fillStyle(0xE8C9A8, 1);
    desk.fillRect(0, H * 0.35, W, H * 0.65);
    desk.lineStyle(1, 0xC4956A);
    desk.lineBetween(0, H * 0.35, W, H * 0.35);

    // 牆壁
    this.add.rectangle(W / 2, H * 0.175, W, H * 0.35, 0xFFEEF3);

    // 工作室標題
    this.add.text(20, 16, '✧ 我的美甲工作室', {
      fontSize: '15px',
      color: '#6B4226',
      fontFamily: 'sans-serif',
      fontStyle: 'bold',
    });

    // 裝飾品
    this._drawDecoration(W, H);
  }

  _drawDecoration(W, H) {
    // 工具罐
    const g = this.add.graphics();
    g.fillStyle(0xFFB3CF, 0.8);
    g.fillRoundedRect(W - 80, H * 0.38, 30, 60, 5);
    g.fillStyle(0xAFA9EC, 0.8);
    g.fillRoundedRect(W - 40, H * 0.41, 25, 50, 5);

    // 燈具
    g.fillStyle(0xFFF8F5, 1);
    g.fillRoundedRect(W / 2 - 50, H * 0.37, 100, 14, 4);

    // 色膠展示
    const gelColors = [0xFFB3CF, 0xF5E6D8, 0xE8C9A8, 0xAFA9EC, 0xFF8FAB];
    gelColors.forEach((c, i) => {
      g.fillStyle(c, 1);
      g.fillCircle(30 + i * 26, H * 0.44, 10);
    });
  }

  _drawAppointment(W, H, customer) {
    // 預約卡
    const cardY = H * 0.50;
    const g = this.add.graphics();
    g.fillStyle(0xFFFFFF, 0.95);
    g.fillRoundedRect(20, cardY, W - 40, 110, 12);
    g.lineStyle(1, 0xFFD6E7);
    g.strokeRoundedRect(20, cardY, W - 40, 110, 12);

    this.add.text(36, cardY + 14, '今日預約', {
      fontSize: '11px', color: '#A08060',
      fontFamily: 'sans-serif', fontStyle: 'bold',
    });

    // 客人頭像
    const avatarG = this.add.graphics();
    avatarG.fillStyle(parseInt(customer.avatarColor.replace('#', ''), 16), 1);
    avatarG.fillCircle(62, cardY + 64, 30);
    this.add.text(62, cardY + 64, customer.avatarInitials.slice(0, 2), {
      fontSize: '13px', color: '#2D1B0E', fontFamily: 'sans-serif', fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(104, cardY + 38, customer.name, {
      fontSize: '16px', color: '#2D1B0E', fontFamily: 'sans-serif', fontStyle: 'bold',
    });
    this.add.text(104, cardY + 60, customer.description, {
      fontSize: '11px', color: '#6B4226', fontFamily: 'sans-serif',
      wordWrap: { width: W - 160 },
    });
    this.add.text(104, cardY + 84, `預算：NT$ ${this.levelData.budgetMin}–${this.levelData.budgetMax}`, {
      fontSize: '11px', color: '#C4956A', fontFamily: 'sans-serif',
    });
  }

  _drawMaterialChoice(W, H) {
    const y = H * 0.73;
    this.add.text(20, y, '施作材料', {
      fontSize: '12px', color: '#6B4226', fontFamily: 'sans-serif', fontStyle: 'bold',
    });

    const options = [
      { id: 'basic', label: '一般材料', sub: '標準品質', price: 0 },
      { id: 'brand', label: '品牌材料', sub: '品質 +8%', price: 200 },
    ];

    options.forEach((opt, i) => {
      const x = 20 + i * ((W - 40) / 2 + 8);
      const w = (W - 48) / 2;
      const g = this.add.graphics();
      const isSelected = this.gameState.materialTier === opt.id;

      g.fillStyle(isSelected ? 0xFFD6E7 : 0xFFFFFF, 1);
      g.fillRoundedRect(x, y + 24, w, 52, 8);
      g.lineStyle(1.5, isSelected ? 0xF472B6 : 0xE8C9A8);
      g.strokeRoundedRect(x, y + 24, w, 52, 8);

      this.add.text(x + w / 2, y + 38, opt.label, {
        fontSize: '13px', color: '#2D1B0E', fontFamily: 'sans-serif', fontStyle: 'bold',
      }).setOrigin(0.5);

      this.add.text(x + w / 2, y + 56, opt.sub, {
        fontSize: '10px', color: '#A08060', fontFamily: 'sans-serif',
      }).setOrigin(0.5);

      const zone = this.add.zone(x + w / 2, y + 50, w, 52).setInteractive();
      zone.on('pointerup', () => {
        this.gameState.materialTier = opt.id;
        this.scene.restart({ gameState: this.gameState, dataLoader: this.dataLoader, uiManager: this.uiManager });
      });
    });
  }

  _drawStartBtn(W, H) {
    const y = H * 0.88;
    const g = this.add.graphics();
    g.fillStyle(0xF472B6, 1);
    g.fillRoundedRect(W / 2 - 120, y - 22, 240, 48, 14);

    this.add.text(W / 2, y, '迎接客人 →', {
      fontSize: '16px', color: '#FFFFFF', fontFamily: 'sans-serif', fontStyle: 'bold',
    }).setOrigin(0.5);

    const zone = this.add.zone(W / 2, y, 240, 48).setInteractive();
    zone.on('pointerup', () => {
      this.scene.start('DialogueScene', {
        gameState:  this.gameState,
        dataLoader: this.dataLoader,
        uiManager:  this.uiManager,
      });
    });
    zone.on('pointerover', () => { g.fillStyle(0xDB2777, 1).fillRoundedRect(W / 2 - 120, y - 22, 240, 48, 14); });
    zone.on('pointerout',  () => { g.fillStyle(0xF472B6, 1).fillRoundedRect(W / 2 - 120, y - 22, 240, 48, 14); });
  }

  _drawStatusBar(W, H) {
    this.add.text(W - 20, 16, `聲譽 ${this.gameState.reputation} ／ NT$ ${this.gameState.money}`, {
      fontSize: '12px', color: '#6B4226', fontFamily: 'sans-serif',
    }).setOrigin(1, 0);

    this.add.text(W / 2, 16, `第 ${this.gameState.currentLevel} 關`, {
      fontSize: '12px', color: '#A08060', fontFamily: 'sans-serif',
    }).setOrigin(0.5, 0);
  }
}
