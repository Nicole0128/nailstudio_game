/**
 * GameState — 遊戲狀態管理器
 * 管理所有隱藏數值、跨場景資料、關卡進度
 */
export class GameState {
  constructor() {
    this.reset();
  }

  reset() {
    // ── 關卡設定 ──
    this.currentLevel = 1;
    this.currentCustomer = null;
    this.currentPattern = null;

    // ── 隱藏數值（每關重置）──
    this.rapport       = 50;   // 好感度 0–100
    this.demandClarity = 30;   // 需求清晰度 0–100
    this.disputeRisk   = 20;   // 糾紛風險 0–100（越高越危險）

    // ── 報價 ──
    this.chosenPrice    = 0;
    this.chosenPriceTier = null;  // 'basic' | 'design' | 'premium'

    // ── Mini game 分數 ──
    this.scores = {
      coverage:     0,   // 覆蓋率 0–100
      neatness:     0,   // 整齊度 0–100
      restoration:  0,   // 圖案還原度 0–100
      speed:        0,   // 速度分 0–100
    };

    // ── 跨關卡數值 ──
    this.money     = 3000;   // 起始資金
    this.reputation = 50;    // 聲譽值 0–100

    // ── 經營選擇 ──
    this.materialTier   = 'basic';    // 'basic' | 'brand'
    this.equipmentTier  = 'basic';    // 'basic' | 'pro'
    this.clientsPerDay  = 1;          // 1 or 2

    // ── 對話紀錄（申訴時使用）──
    this.dialogueLog    = [];
    this.hasGoodEvidence = false;

    // ── 當前場景時間 ──
    this.nailGameTimeLeft = 180;
    this.nailGameStartTime = null;
  }

  // 每關開始時只重置關卡相關數值，保留跨關數值
  resetForNewLevel() {
    this.rapport       = 50;
    this.demandClarity = 30;
    this.disputeRisk   = 20;
    this.chosenPrice    = 0;
    this.chosenPriceTier = null;
    this.scores = { coverage: 0, neatness: 0, restoration: 0, speed: 0 };
    this.dialogueLog    = [];
    this.hasGoodEvidence = false;
  }

  // ── 對話選項效果 ──
  applyDialogueEffect(effect) {
    if (effect.rapport)       this.rapport       = clamp(this.rapport       + effect.rapport,       0, 100);
    if (effect.demandClarity) this.demandClarity = clamp(this.demandClarity + effect.demandClarity, 0, 100);
    if (effect.disputeRisk)   this.disputeRisk   = clamp(this.disputeRisk   + effect.disputeRisk,   0, 100);
  }

  // ── 記錄對話紀錄 ──
  logDialogue(speaker, text, chosenOption = null) {
    this.dialogueLog.push({ speaker, text, chosenOption, time: Date.now() });
    // 如果做了好的需求確認，算作有有效書面證據
    if (chosenOption && chosenOption.effect && chosenOption.effect.demandClarity >= 15) {
      this.hasGoodEvidence = true;
    }
  }

  // ── 報價判定 ──
  evaluateQuote(levelData) {
    const { budgetMin, budgetMax } = levelData;
    const price = this.chosenPrice;
    if (price <= budgetMax && price >= budgetMin) {
      this.rapport      = clamp(this.rapport + 10, 0, 100);
      this.disputeRisk  = clamp(this.disputeRisk - 10, 0, 100);
      return 'ok';
    } else if (price > budgetMax) {
      this.rapport      = clamp(this.rapport - 10, 0, 100);
      this.disputeRisk  = clamp(this.disputeRisk + 15, 0, 100);
      return 'too_high';
    } else {
      // 太低（低於成本）
      this.disputeRisk  = clamp(this.disputeRisk + 5, 0, 100);
      return 'too_low';
    }
  }

  // ── 計算最終結果 ──
  calculateFinalResult() {
    const { coverage, neatness, restoration, speed } = this.scores;

    // 加權平均
    const nailScore = Math.round(
      coverage    * 0.25 +
      neatness    * 0.30 +
      restoration * 0.30 +
      speed       * 0.15
    );

    // 對話與報價的修正
    const clarityBonus  = this.demandClarity >= 60 ? 5 : 0;
    const rapportBonus  = this.rapport >= 70 ? 5 : 0;
    const disputePenalty = this.disputeRisk >= 60 ? -10 : 0;

    const totalScore = clamp(nailScore + clarityBonus + rapportBonus + disputePenalty, 0, 100);

    // 評語選擇
    let review, stars;
    if (totalScore >= 85) {
      stars  = 5;
      review = this._pickReview('excellent');
    } else if (totalScore >= 70) {
      stars  = 4;
      review = this._pickReview('good');
    } else if (totalScore >= 50) {
      stars  = 3;
      review = this._pickReview('average');
    } else if (totalScore >= 35) {
      stars  = 2;
      review = this._pickReview('poor');
    } else {
      stars  = 1;
      review = this._pickReview('bad');
    }

    // 計算收入
    const income = stars >= 3 ? this.chosenPrice : Math.round(this.chosenPrice * 0.5);
    this.money += income;
    this.reputation = clamp(this.reputation + (stars - 3) * 5, 0, 100);

    return { nailScore, totalScore, stars, review, income, passed: stars >= 3 };
  }

  _pickReview(level) {
    const reviews = {
      excellent: [
        '完全超出我的預期！粉色的深淺剛剛好，愛心也很精緻，下次還要來找你！',
        '哇做得好漂亮！跟我想像中的一模一樣，謝謝你那麼認真確認我的需求！',
      ],
      good: [
        '整體還不錯喔！愛心有點小差異，但整體我很喜歡。',
        '粉色選得很好！圖案再精緻一點就完美了。',
      ],
      average: [
        '還可以，但跟我心裡的感覺有一點落差。',
        '大致上好看，但覺得整齊度可以再好一點。',
      ],
      poor: [
        '有點失望……感覺跟我說的不太一樣。',
        '塗色好像有點不均勻，愛心也偏移了一些。',
      ],
      bad: [
        '說實話做得不太好，我覺得沒辦法接受這個結果。',
        '跟我想要的差很多，之後可能不會再來了。',
      ],
    };
    const arr = reviews[level];
    return arr[Math.floor(Math.random() * arr.length)];
  }

  // ── 材料加成 ──
  getMaterialBonus() {
    return this.materialTier === 'brand' ? 8 : 0;
  }

  // ── 設備加成（容錯率）──
  getToleranceBonus() {
    return this.equipmentTier === 'pro' ? 6 : 0;
  }
}

function clamp(val, min, max) {
  return Math.min(Math.max(val, min), max);
}
