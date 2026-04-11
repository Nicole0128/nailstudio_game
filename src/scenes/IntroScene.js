/**
 * IntroScene — 前導新聞場景
 * 社群介面滑動 + 3 張資訊卡 + 旁白
 */
export class IntroScene extends Phaser.Scene {
  constructor() { super({ key: 'IntroScene' }); }

  create() {
    const { width: W, height: H } = this.scale;
    this.cardIndex = 0;

    // ── 背景 ──
    this.add.rectangle(W / 2, H / 2, W, H, 0xFDF6F0);

    // ── 假社群介面框架 ──
    this._buildSocialFeed(W, H);

    // ── 資訊卡 ──
    this.infoCards = [
      {
        title: '產業擴張',
        items: [
          '美甲美睫業五年成長超過 1.2 倍',
          '個人工作室快速增加',
          '成為年輕人的創業選項',
        ],
      },
      {
        title: '低門檻與模糊標準',
        items: [
          '社群讓接案更容易、門檻更低',
          '不一定需要證照也能從業',
          '消費者多看風格，不一定看證照',
        ],
      },
      {
        title: '風險與糾紛',
        items: [
          '修圖落差、技術不穩可能受傷',
          '放鳥、奧客、消費糾紛時有所聞',
          '流程麻煩，多數人選擇私下和解',
        ],
      },
    ];

    // ── 底部資訊卡觸發按鈕 ──
    this._buildCardTriggers(W, H);

    // ── 旁白文字區 ──
    this._buildNarrative(W, H);

    // ── 開始按鈕 ──
    this._buildStartBtn(W, H);

    // 啟動序列
    this.time.delayedCall(600, () => this._startNarrative());
  }

  _buildSocialFeed(W, H) {
    // 手機框
    const phoneW = Math.min(320, W * 0.7);
    const phoneH = H * 0.52;
    const phoneX = W / 2 - phoneW / 2;
    const phoneY = H * 0.03;

    const phone = this.add.graphics();
    phone.fillStyle(0xFFFFFF, 1);
    phone.fillRoundedRect(phoneX, phoneY, phoneW, phoneH, 18);
    phone.lineStyle(1.5, 0xE8C9A8);
    phone.strokeRoundedRect(phoneX, phoneY, phoneW, phoneH, 18);

    // IG 模擬貼文
    const posts = [
      { color: 0xFFB3CF, text: '甜甜圈美甲爆紅 🍩' },
      { color: 0xF5E6D8, text: '工作室開張！歡迎預約 ✨' },
      { color: 0xFFD6E7, text: '徵模特兒 🎀 限時動態' },
      { color: 0xE8C9A8, text: '作品牆更新 👐' },
    ];

    let yOff = phoneY + 20;
    posts.forEach((p, i) => {
      const card = this.add.graphics();
      card.fillStyle(p.color, 0.6);
      card.fillRoundedRect(phoneX + 10, yOff, phoneW - 20, 58, 8);
      this.add.text(phoneX + 20, yOff + 14, p.text, {
        fontSize: '13px',
        color: '#6B4226',
        fontFamily: 'sans-serif',
      });
      yOff += 66;
    });

    // 模擬滑動動畫
    this.tweens.add({
      targets: [phone],
      y: '-=30',
      ease: 'Sine.easeInOut',
      duration: 2000,
      yoyo: true,
      repeat: -1,
    });
  }

  _buildCardTriggers(W, H) {
    const y = H * 0.6;
    const labels = ['產業擴張', '低門檻', '風險與糾紛'];
    const colors = [0xFFB3CF, 0xAFA9EC, 0xF5C4B3];

    labels.forEach((label, i) => {
      const x = W / 2 - 140 + i * 140;
      const btn = this.add.graphics();
      btn.fillStyle(colors[i], 0.85);
      btn.fillRoundedRect(x - 55, y - 18, 110, 36, 8);

      const txt = this.add.text(x, y, label, {
        fontSize: '13px',
        color: '#2D1B0E',
        fontFamily: 'sans-serif',
      }).setOrigin(0.5);

      const zone = this.add.zone(x, y, 110, 36).setInteractive();
      zone.on('pointerup', () => this._showInfoCard(i));

      // hover
      zone.on('pointerover', () => btn.setAlpha(1));
      zone.on('pointerout',  () => btn.setAlpha(0.85));
    });

    this.add.text(W / 2, H * 0.57, '點擊卡片了解更多', {
      fontSize: '11px',
      color: '#A08060',
      fontFamily: 'sans-serif',
    }).setOrigin(0.5);
  }

  _showInfoCard(index) {
    // 移除已有的卡片
    if (this._activeCard) {
      this._activeCard.remove();
      this._activeCard = null;
    }

    const card = this.infoCards[index];
    const el = document.createElement('div');
    el.className = 'info-card';
    el.innerHTML = `
      <h3>${card.title}</h3>
      <ul>${card.items.map(i => `<li>${i}</li>`).join('')}</ul>
      <button class="close-btn" onclick="this.parentElement.remove()">關閉</button>
    `;
    document.getElementById('html-overlay').appendChild(el);
    requestAnimationFrame(() => el.classList.add('visible'));
    this._activeCard = { remove: () => el.remove() };
  }

  _buildNarrative(W, H) {
    const narrative = [
      '近年，美甲從一項美容服務，\n變成許多年輕人眼中的創業選項。',
      '但在流量、審美與低門檻之外，\n這份工作真的只有「把指甲做漂亮」嗎？',
      '接下來，你要成為一名美甲師。\n你要接客、報價、施作、面對客訴。\n你的每個選擇，都會決定這間工作室能不能活下來。',
    ];

    this.narrativeIndex = 0;
    this.narrativeText  = this.add.text(W / 2, H * 0.75, '', {
      fontSize: '14px',
      color: '#2D1B0E',
      fontFamily: 'sans-serif',
      align:  'center',
      lineSpacing: 8,
      wordWrap: { width: W * 0.8 },
    }).setOrigin(0.5).setAlpha(0);

    this._narr = narrative;
  }

  _startNarrative() {
    this._showNextNarrative();
  }

  _showNextNarrative() {
    if (this.narrativeIndex >= this._narr.length) return;
    const text = this._narr[this.narrativeIndex];
    this.narrativeText.setText(text).setAlpha(0);
    this.tweens.add({
      targets: this.narrativeText,
      alpha: 1,
      duration: 700,
      ease: 'Power2',
    });
    this.narrativeIndex++;
    if (this.narrativeIndex < this._narr.length) {
      this.time.delayedCall(3500, () => this._showNextNarrative());
    }
  }

  _buildStartBtn(W, H) {
    // 延遲顯示開始按鈕
    this.time.delayedCall(4000, () => {
      const btn = this.add.graphics();
      btn.fillStyle(0xF472B6, 1);
      btn.fillRoundedRect(W / 2 - 90, H * 0.9 - 22, 180, 44, 12);

      const txt = this.add.text(W / 2, H * 0.9, '【 開始營業 】', {
        fontSize: '16px',
        color: '#FFFFFF',
        fontFamily: 'sans-serif',
        fontStyle: 'bold',
      }).setOrigin(0.5);

      const zone = this.add.zone(W / 2, H * 0.9, 180, 44).setInteractive();
      zone.on('pointerup', () => {
        this.scene.start('StudioScene');
      });
      zone.on('pointerover', () => btn.fillStyle(0xDB2777, 1).fillRoundedRect(W / 2 - 90, H * 0.9 - 22, 180, 44, 12));
      zone.on('pointerout',  () => btn.fillStyle(0xF472B6, 1).fillRoundedRect(W / 2 - 90, H * 0.9 - 22, 180, 44, 12));

      // 淡入
      btn.setAlpha(0);
      txt.setAlpha(0);
      this.tweens.add({ targets: [btn, txt], alpha: 1, duration: 600, ease: 'Power2' });
    });
  }
}
