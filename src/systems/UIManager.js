/**
 * UIManager — 管理所有 HTML overlay UI
 * 包含：對話框、報價面板、mini game UI、結算面板、申訴面板
 */
export class UIManager {
  constructor() {
    this._buildOverlay();
    this._toastTimer = null;
  }

  _buildOverlay() {
    // 主 overlay 容器
    const overlay = document.createElement('div');
    overlay.id = 'html-overlay';
    document.body.appendChild(overlay);

    // 載入畫面
    overlay.insertAdjacentHTML('beforeend', `
      <div id="loading-screen">
        <div class="title">指尖上的創業</div>
        <div class="subtitle">美甲工作室模擬遊戲</div>
        <div class="loading-dots">
          <div class="loading-dot"></div>
          <div class="loading-dot"></div>
          <div class="loading-dot"></div>
        </div>
      </div>
    `);

    // 對話框
    overlay.insertAdjacentHTML('beforeend', `
      <div id="dialogue-box">
        <div id="dialogue-speaker"></div>
        <div id="dialogue-text"></div>
        <div id="dialogue-options"></div>
      </div>
    `);

    // 報價面板
    overlay.insertAdjacentHTML('beforeend', `
      <div id="quote-panel">
        <h2>報價方案</h2>
        <div class="subtitle" id="quote-subtitle">請根據設計難度與客人預算，選擇合適的方案</div>
        <div class="quote-cards" id="quote-cards"></div>
        <button id="quote-confirm">確認報價</button>
      </div>
    `);

    // Mini game UI
    overlay.insertAdjacentHTML('beforeend', `
      <div id="nail-game-ui">
        <div id="nail-game-header">
          <div>
            <div style="font-size:11px;color:var(--text-soft);margin-bottom:4px;">施作步驟</div>
            <div class="step-indicators">
              <div class="step-dot active" id="dot-0"></div>
              <div class="step-dot" id="dot-1"></div>
              <div class="step-dot" id="dot-2"></div>
            </div>
          </div>
          <div id="nail-timer">03:00</div>
          <div id="live-score">
            <div class="score-row"><span>覆蓋率</span><span id="sc-coverage">-</span></div>
            <div class="score-row"><span>整齊度</span><span id="sc-neatness">-</span></div>
          </div>
        </div>
        <div id="nail-game-main">
          <div id="ref-panel">
            <div class="label">參考圖</div>
            <canvas id="ref-canvas" width="130" height="160"></canvas>
            <div style="font-size:11px;color:var(--text-soft);text-align:center;line-height:1.5;" id="ref-desc"></div>
          </div>
          <div id="work-area">
            <canvas id="nail-canvas"></canvas>
            <div id="step-hint"></div>
          </div>
          <div id="tool-panel">
            <div class="label">顏色</div>
            <div class="color-swatches" id="color-swatches"></div>
            <div class="label" style="margin-top:8px;">筆刷</div>
            <div class="brush-size-row" id="brush-sizes"></div>
            <button class="tool-action-btn" id="btn-undo">↩ 撤銷</button>
            <button class="tool-action-btn" id="btn-clear">清除</button>
            <button class="tool-action-btn primary" id="btn-next-step">下一步 →</button>
          </div>
        </div>
      </div>
    `);

    // 結算面板
    overlay.insertAdjacentHTML('beforeend', `
      <div id="result-panel">
        <div class="result-stars" id="result-stars">★★★</div>
        <h2 id="result-title">完成！</h2>
        <div id="result-customer-comment"></div>
        <div class="result-scores">
          <div class="result-score-card">
            <div class="name">還原度</div>
            <div class="value" id="rs-restoration">0</div>
            <div class="max">/ 100</div>
          </div>
          <div class="result-score-card">
            <div class="name">整齊度</div>
            <div class="value" id="rs-neatness">0</div>
            <div class="max">/ 100</div>
          </div>
          <div class="result-score-card">
            <div class="name">速度</div>
            <div class="value" id="rs-speed">0</div>
            <div class="max">/ 100</div>
          </div>
        </div>
        <button id="result-next-btn">繼續</button>
      </div>
    `);

    // 申訴面板
    overlay.insertAdjacentHTML('beforeend', `
      <div id="complaint-panel">
        <h2>客訴處理</h2>
        <div class="complaint-subtitle">客人對這次服務提出申訴，請選擇你的處理方式</div>
        <div class="complaint-grid">
          <div class="complaint-block">
            <h4>客訴內容</h4>
            <p id="complaint-text"></p>
          </div>
          <div class="complaint-block">
            <h4>對話紀錄</h4>
            <div id="complaint-log"></div>
          </div>
          <div class="complaint-block">
            <h4>報價紀錄</h4>
            <p id="complaint-quote"></p>
          </div>
          <div class="complaint-block">
            <h4>目前狀態</h4>
            <p id="complaint-status"></p>
          </div>
        </div>
        <div class="complaint-options" id="complaint-options"></div>
        <div id="complaint-outcome" style="display:none;margin-top:16px;padding:14px 16px;border-radius:var(--radius-md);background:var(--nude-50);border:1px solid var(--nude-200);">
          <div style="font-size:14px;color:var(--text-dark);line-height:1.7;" id="complaint-outcome-text"></div>
          <div style="margin-top:10px;font-size:12px;color:var(--pink-600);font-style:italic;" id="complaint-tip"></div>
          <button id="complaint-done-btn" style="margin-top:14px;padding:10px 28px;background:var(--nude-400);color:white;border:none;border-radius:var(--radius-sm);font-size:13px;cursor:pointer;">繼續遊戲</button>
        </div>
      </div>
    `);

    // Toast
    const toast = document.createElement('div');
    toast.id = 'toast';
    document.body.appendChild(toast);
  }

  // ── 載入畫面 ──
  hideLoading() {
    const el = document.getElementById('loading-screen');
    if (el) { el.classList.add('hidden'); setTimeout(() => el.remove(), 700); }
  }

  // ── Toast ──
  showToast(msg, duration = 2500) {
    const el = document.getElementById('toast');
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => el.classList.remove('show'), duration);
  }

  // ── 對話框 ──
  showDialogueBox() {
    const el = document.getElementById('dialogue-box');
    el.style.display = 'block';
  }

  hideDialogueBox() {
    document.getElementById('dialogue-box').style.display = 'none';
  }

  setSpeaker(name) {
    document.getElementById('dialogue-speaker').textContent = name;
  }

  // 打字機效果顯示文字
  typeText(text, onDone) {
    const el = document.getElementById('dialogue-text');
    el.innerHTML = '';
    let i = 0;
    const cursor = document.createElement('span');
    cursor.className = 'cursor';
    el.appendChild(cursor);

    const interval = setInterval(() => {
      if (i < text.length) {
        el.insertBefore(document.createTextNode(text[i]), cursor);
        i++;
      } else {
        clearInterval(interval);
        cursor.remove();
        if (onDone) onDone();
      }
    }, 35);
  }

  setDialogueText(text) {
    document.getElementById('dialogue-text').textContent = text;
  }

  showOptions(options, onSelect) {
    const container = document.getElementById('dialogue-options');
    container.innerHTML = '';
    options.forEach((opt, i) => {
      const btn = document.createElement('button');
      btn.className = 'dialogue-option';
      btn.textContent = opt.text;
      btn.onclick = () => {
        container.innerHTML = '';
        onSelect(opt, i);
      };
      container.appendChild(btn);
    });
  }

  clearOptions() {
    document.getElementById('dialogue-options').innerHTML = '';
  }

  // ── 報價面板 ──
  showQuotePanel(levelData, onConfirm) {
    const panel = document.getElementById('quote-panel');
    panel.style.display = 'flex';

    const { budgetMin, budgetMax } = levelData;
    const cards = [
      { tier: 'basic',   label: '基礎款', price: 350, desc: '素色 + 簡單造型' },
      { tier: 'design',  label: '設計款', price: 500, desc: '底色 + 單一圖案' },
      { tier: 'premium', label: '精緻款', price: 750, desc: '多元素 + 細節裝飾' },
    ];

    const container = document.getElementById('quote-cards');
    container.innerHTML = '';
    let selectedTier = null;
    let selectedCard = null;

    cards.forEach(card => {
      let hintClass, hintText;
      if (card.price <= budgetMax && card.price >= budgetMin) {
        hintClass = 'ok'; hintText = '預算內 ✓';
      } else if (card.price > budgetMax) {
        hintClass = 'hi'; hintText = '略超預算';
      } else {
        hintClass = 'ok'; hintText = '預算充裕';
      }

      const el = document.createElement('div');
      el.className = 'quote-card';
      el.innerHTML = `
        <div class="tier">${card.label}</div>
        <div class="price">NT$ ${card.price}</div>
        <div class="desc">${card.desc}</div>
        <div class="budget-hint ${hintClass}">${hintText}</div>
      `;
      el.onclick = () => {
        if (selectedCard) selectedCard.classList.remove('selected');
        el.classList.add('selected');
        selectedCard = el;
        selectedTier = card;
        document.getElementById('quote-confirm').style.display = 'block';
      };
      container.appendChild(el);
    });

    document.getElementById('quote-subtitle').textContent =
      `客人預算約 NT$ ${budgetMin}–${budgetMax}，請選擇合適方案`;

    const confirmBtn = document.getElementById('quote-confirm');
    confirmBtn.style.display = 'none';
    confirmBtn.onclick = () => {
      if (!selectedTier) return;
      panel.style.display = 'none';
      onConfirm(selectedTier);
    };
  }

  // ── Mini game ──
  showNailGame() {
    document.getElementById('nail-game-ui').style.display = 'flex';
  }

  hideNailGame() {
    document.getElementById('nail-game-ui').style.display = 'none';
  }

  updateTimer(secondsLeft) {
    const el = document.getElementById('nail-timer');
    const m = Math.floor(secondsLeft / 60).toString().padStart(2, '0');
    const s = (secondsLeft % 60).toString().padStart(2, '0');
    el.textContent = `${m}:${s}`;
    el.classList.toggle('warning', secondsLeft <= 30);
  }

  updateStepDots(currentStep) {
    [0, 1, 2].forEach(i => {
      const dot = document.getElementById(`dot-${i}`);
      if (!dot) return;
      dot.className = 'step-dot';
      if (i < currentStep) dot.classList.add('done');
      else if (i === currentStep) dot.classList.add('active');
    });
  }

  updateLiveScore(coverage, neatness) {
    const fmt = v => v > 0 ? `${Math.round(v)}%` : '-';
    document.getElementById('sc-coverage').textContent = fmt(coverage);
    document.getElementById('sc-neatness').textContent = fmt(neatness);
  }

  setStepHint(text) {
    const el = document.getElementById('step-hint');
    el.textContent = text;
    el.style.opacity = '1';
    setTimeout(() => { el.style.opacity = '0'; }, 3000);
  }

  buildColorSwatches(colors, onSelect) {
    const container = document.getElementById('color-swatches');
    container.innerHTML = '';
    colors.forEach((c, i) => {
      const el = document.createElement('div');
      el.className = 'color-swatch' + (i === 0 ? ' selected' : '');
      el.style.background = c.value;
      el.title = c.name;
      el.onclick = () => {
        container.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('selected'));
        el.classList.add('selected');
        onSelect(c);
      };
      container.appendChild(el);
    });
  }

  buildBrushSizes(sizes, onSelect) {
    const container = document.getElementById('brush-sizes');
    container.innerHTML = '';
    sizes.forEach((size, i) => {
      const el = document.createElement('div');
      el.className = 'brush-btn' + (i === 0 ? ' selected' : '');
      el.style.width = el.style.height = `${size * 2 + 10}px`;
      el.onclick = () => {
        container.querySelectorAll('.brush-btn').forEach(b => b.classList.remove('selected'));
        el.classList.add('selected');
        onSelect(size);
      };
      container.appendChild(el);
    });
  }

  setNextStepBtn(label, onClick) {
    const btn = document.getElementById('btn-next-step');
    btn.textContent = label;
    btn.onclick = onClick;
  }

  setUndoBtn(onClick) {
    document.getElementById('btn-undo').onclick = onClick;
  }

  setClearBtn(onClick) {
    document.getElementById('btn-clear').onclick = onClick;
  }

  // ── 結算面板 ──
  showResult(result, onNext) {
    const panel = document.getElementById('result-panel');
    panel.style.display = 'flex';

    const starStr = '★'.repeat(result.stars) + '☆'.repeat(5 - result.stars);
    document.getElementById('result-stars').textContent = starStr;
    document.getElementById('result-title').textContent =
      result.stars >= 3 ? '施作完成！' : '客人不太滿意……';
    document.getElementById('result-customer-comment').textContent = `"${result.review}"`;
    document.getElementById('rs-restoration').textContent = Math.round(result.nailScore);
    document.getElementById('rs-neatness').textContent = Math.round(result.totalScore);
    document.getElementById('rs-speed').textContent = Math.round(result.income > 0 ? 85 : 50);

    const nextBtn = document.getElementById('result-next-btn');
    nextBtn.textContent = result.passed ? '下一位客人 →' : '查看申訴流程';
    nextBtn.onclick = () => { panel.style.display = 'none'; onNext(result); };
  }

  // ── 申訴面板 ──
  showComplaint(complaintData, gameState, onDone) {
    const panel = document.getElementById('complaint-panel');
    panel.style.display = 'flex';
    panel.style.flexDirection = 'column';

    document.getElementById('complaint-text').textContent = complaintData.complaintText;
    document.getElementById('complaint-quote').textContent =
      `選擇方案：${gameState.chosenPriceTier || '未設定'}，金額 NT$ ${gameState.chosenPrice}`;
    document.getElementById('complaint-status').textContent =
      `聲譽值：${gameState.reputation} ／ 資金：NT$ ${gameState.money}`;

    // 對話紀錄
    const logEl = document.getElementById('complaint-log');
    logEl.innerHTML = '';
    if (gameState.dialogueLog.length) {
      gameState.dialogueLog.slice(-4).forEach(l => {
        const d = document.createElement('div');
        d.className = 'log-line';
        d.textContent = `${l.speaker}：${l.text.slice(0, 30)}${l.text.length > 30 ? '…' : ''}`;
        logEl.appendChild(d);
      });
    } else {
      logEl.textContent = '無對話紀錄';
    }

    // 選項
    const optContainer = document.getElementById('complaint-options');
    optContainer.innerHTML = '';
    complaintData.playerActions.forEach(action => {
      // 需要好的對話紀錄才能解鎖的選項
      const locked = action.conditions?.requiresGoodDialogue && !gameState.hasGoodEvidence;
      const btn = document.createElement('button');
      btn.className = 'complaint-option';
      btn.textContent = locked ? `🔒 ${action.text}（需要事前對話紀錄）` : action.text;
      btn.disabled = locked;
      if (locked) btn.style.opacity = '0.4';
      btn.onclick = () => {
        optContainer.innerHTML = '';
        // 套用效果
        gameState.reputation = Math.min(100, Math.max(0, gameState.reputation + action.effect.reputation));
        gameState.money += action.effect.money;

        // 顯示結果
        const outcomeEl = document.getElementById('complaint-outcome');
        outcomeEl.style.display = 'block';
        document.getElementById('complaint-outcome-text').textContent = action.outcomeText;
        document.getElementById('complaint-tip').textContent = action.tip;

        document.getElementById('complaint-done-btn').onclick = () => {
          panel.style.display = 'none';
          onDone(action);
        };
      };
      optContainer.appendChild(btn);
    });

    document.getElementById('complaint-outcome').style.display = 'none';
  }
}
