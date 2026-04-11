/**
 * ResultScene — 結算場景
 */
export class ResultScene extends Phaser.Scene {
  constructor() { super({ key: 'ResultScene' }); }

  init(data) {
    this.gameState  = data.gameState;
    this.dataLoader = data.dataLoader;
    this.uiManager  = data.uiManager;
  }

  create() {
    const { width: W, height: H } = this.scale;
    this.add.rectangle(W / 2, H / 2, W, H, 0xFDF6F0);

    const result = this.gameState.calculateFinalResult();

    this.uiManager.showResult(result, (r) => {
      if (r.passed) {
        // 過關 → 下一關
        this.gameState.currentLevel++;
        const nextLevel = this.dataLoader.getLevel(this.gameState.currentLevel);
        if (nextLevel) {
          this.scene.start('StudioScene', {
            gameState:  this.gameState,
            dataLoader: this.dataLoader,
            uiManager:  this.uiManager,
          });
        } else {
          this.scene.start('EndingScene', {
            gameState:  this.gameState,
            dataLoader: this.dataLoader,
            uiManager:  this.uiManager,
          });
        }
      } else {
        // 失敗 → 申訴
        this.scene.start('ComplaintScene', {
          gameState:  this.gameState,
          dataLoader: this.dataLoader,
          uiManager:  this.uiManager,
        });
      }
    });
  }
}

/**
 * ComplaintScene — 申訴場景
 */
export class ComplaintScene extends Phaser.Scene {
  constructor() { super({ key: 'ComplaintScene' }); }

  init(data) {
    this.gameState  = data.gameState;
    this.dataLoader = data.dataLoader;
    this.uiManager  = data.uiManager;
  }

  create() {
    const { width: W, height: H } = this.scale;
    this.add.rectangle(W / 2, H / 2, W, H, 0xFAFAF8);

    const complaintData = this.dataLoader.getComplaint(this.gameState.currentLevel);

    if (!complaintData) {
      // 沒有申訴資料，直接過關
      this.gameState.currentLevel++;
      this.scene.start('StudioScene', {
        gameState:  this.gameState,
        dataLoader: this.dataLoader,
        uiManager:  this.uiManager,
      });
      return;
    }

    this.uiManager.showComplaint(complaintData, this.gameState, (action) => {
      // 申訴處理完，根據結果決定下一步
      if (action.effect.disputeResolved) {
        this.gameState.currentLevel++;
      }
      const nextLevel = this.dataLoader.getLevel(this.gameState.currentLevel);
      if (nextLevel) {
        this.scene.start('StudioScene', {
          gameState:  this.gameState,
          dataLoader: this.dataLoader,
          uiManager:  this.uiManager,
        });
      } else {
        this.scene.start('EndingScene', {
          gameState:  this.gameState,
          dataLoader: this.dataLoader,
          uiManager:  this.uiManager,
        });
      }
    });
  }
}

/**
 * EndingScene — 結局場景
 */
export class EndingScene extends Phaser.Scene {
  constructor() { super({ key: 'EndingScene' }); }

  init(data) {
    this.gameState  = data.gameState;
    this.uiManager  = data.uiManager;
  }

  create() {
    const { width: W, height: H } = this.scale;

    this.add.rectangle(W / 2, H / 2, W, H, 0xFFF0F5);

    // 標題
    this.add.text(W / 2, H * 0.12, '✧ 工作室總結 ✧', {
      fontSize: '20px', color: '#2D1B0E', fontFamily: 'sans-serif', fontStyle: 'bold',
    }).setOrigin(0.5);

    // 最終數值
    const g = this.gameState;
    const lines = [
      `聲譽值：${g.reputation} / 100`,
      `累積資金：NT$ ${g.money}`,
      '',
      '你在這個遊戲中體驗了：',
      '美甲師的日常——接客、溝通、報價、施作、客訴',
      '',
      '在台灣，美甲業五年成長超過 1.2 倍，',
      '但制度規範的模糊，讓許多糾紛只能私下解決。',
      '',
      '每一次清楚溝通、合理報價、留下紀錄，',
      '都是保護自己也保護客人的方式。',
    ];

    lines.forEach((line, i) => {
      this.add.text(W / 2, H * 0.22 + i * 28, line, {
        fontSize: line ? '13px' : '6px',
        color: line.startsWith('你') || line.startsWith('在') || line.startsWith('每') ? '#2D1B0E' : '#6B4226',
        fontFamily: 'sans-serif',
        align: 'center',
        wordWrap: { width: W * 0.85 },
      }).setOrigin(0.5);
    });

    // 再玩一次
    const btnY = H * 0.9;
    const bg = this.add.graphics();
    bg.fillStyle(0xF472B6, 1).fillRoundedRect(W / 2 - 100, btnY - 22, 200, 44, 12);
    this.add.text(W / 2, btnY, '再玩一次', {
      fontSize: '15px', color: '#FFFFFF', fontFamily: 'sans-serif', fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.zone(W / 2, btnY, 200, 44).setInteractive().on('pointerup', () => {
      this.gameState.reset();
      this.scene.start('IntroScene');
    });

    // 新聞連結提示
    this.add.text(W / 2, H * 0.95, '延伸閱讀：指尖上的產業擴張 — 政大大學報', {
      fontSize: '10px', color: '#C4956A', fontFamily: 'sans-serif',
    }).setOrigin(0.5).setInteractive().on('pointerup', () => {
      window.open('https://unews.nccu.edu.tw/unews/nails-beauty-nailartist/', '_blank');
    });
  }
}
