/**
 * NailCanvas — 美甲 mini game 的 Canvas 2D 繪圖引擎
 * 負責：繪圖互動、遮罩管理、分數計算
 */
export class NailCanvas {
  constructor(canvasEl, refCanvasEl, patternData) {
    this.canvas    = canvasEl;
    this.ctx       = canvasEl.getContext('2d');
    this.refCanvas = refCanvasEl;
    this.refCtx    = refCanvasEl.getContext('2d');
    this.pattern   = patternData;

    // 畫布尺寸
    this.W = 280;
    this.H = 360;
    this.canvas.width  = this.W;
    this.canvas.height = this.H;

    // 筆刷設定
    this.brushColor = patternData.baseColor;
    this.brushSize  = 14;
    this.isDrawing  = false;
    this.lastX = 0;
    this.lastY = 0;

    // 狀態
    this.step = 0;         // 0: 上底色  1: 畫圖案  2: 完成
    this.history = [];     // undo stack
    this.tolerance = patternData.toleranceOffset;

    // 指甲遮罩 Path (橢圓形)
    this._buildNailPath();
    this._drawRefImage();
    this._setupEvents();

    // 初始背景
    this._drawBackground();
  }

  // ── 指甲輪廓 ──
  _buildNailPath() {
    const cx = this.W / 2;
    const cy = this.H / 2 + 10;
    const rx = this.W * 0.38;
    const ry = this.H * 0.44;
    this.nailPath = new Path2D();
    // 橢圓形底部 + 圓弧頂部（標準指甲形）
    this.nailPath.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  }

  _drawBackground() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.W, this.H);
    // 手部膚色底圖
    ctx.fillStyle = '#F5E0CC';
    ctx.fillRect(0, 0, this.W, this.H);
    // 手指輪廓
    ctx.fillStyle = '#EDCFB8';
    ctx.beginPath();
    ctx.roundRect(this.W * 0.22, this.H * 0.04, this.W * 0.56, this.H * 0.92, 30);
    ctx.fill();
    // 指甲底色（白/裸）
    ctx.fillStyle = '#FFF8F5';
    ctx.fill(this.nailPath);
    ctx.strokeStyle = '#C8A88A';
    ctx.lineWidth = 1.5;
    ctx.stroke(this.nailPath);
  }

  // ── 參考圖 ──
  _drawRefImage() {
    const ctx   = this.refCtx;
    const W = 130, H = 160;
    ctx.clearRect(0, 0, W, H);

    // 手部
    ctx.fillStyle = '#F5E0CC';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#EDCFB8';
    ctx.beginPath();
    ctx.roundRect(W * 0.18, H * 0.04, W * 0.64, H * 0.92, 20);
    ctx.fill();

    // 指甲底色
    const cx = W / 2, cy = H / 2 + 5;
    const rx = W * 0.36, ry = H * 0.44;
    const nailP = new Path2D();
    nailP.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.fillStyle = this.pattern.baseColor;
    ctx.fill(nailP);
    ctx.strokeStyle = '#C8A88A';
    ctx.lineWidth = 1;
    ctx.stroke(nailP);

    // 圖案
    this._drawDecor(ctx, W, H, this.pattern.decorColor, this.pattern.decorType);

    // 更新說明文字
    const descEl = document.getElementById('ref-desc');
    if (descEl) descEl.textContent = `${this.pattern.baseColorName}底色 + ${this.pattern.decorType === 'heart' ? '愛心' : '圖案'}`;
  }

  _drawDecor(ctx, W, H, color, type, alpha = 1) {
    ctx.globalAlpha = alpha;
    const p = this.pattern;
    const x = W * p.decorPosition.x;
    const y = H * p.decorPosition.y;
    const s = Math.min(W, H) * p.decorSize * 1.5;

    ctx.fillStyle   = color;
    ctx.strokeStyle = color;
    ctx.lineWidth   = 2;

    if (type === 'heart') {
      this._drawHeart(ctx, x, y, s);
    } else if (type === 'flower') {
      this._drawFlower(ctx, x, y, s);
    } else {
      // 預設圓點
      ctx.beginPath();
      ctx.arc(x, y, s * 0.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  _drawHeart(ctx, x, y, size) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(size / 30, size / 30);
    ctx.beginPath();
    ctx.moveTo(0, -8);
    ctx.bezierCurveTo(-15, -20, -30, -5, 0, 15);
    ctx.bezierCurveTo(30, -5, 15, -20, 0, -8);
    ctx.fill();
    ctx.restore();
  }

  _drawFlower(ctx, x, y, size) {
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const px = x + Math.cos(angle) * size * 0.5;
      const py = y + Math.sin(angle) * size * 0.5;
      ctx.beginPath();
      ctx.arc(px, py, size * 0.3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.beginPath();
    ctx.arc(x, y, size * 0.25, 0, Math.PI * 2);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();
  }

  // ── 事件綁定 ──
  _setupEvents() {
    const c = this.canvas;
    c.addEventListener('mousedown',  e => this._startDraw(e));
    c.addEventListener('mousemove',  e => this._draw(e));
    c.addEventListener('mouseup',    () => this._endDraw());
    c.addEventListener('mouseleave', () => this._endDraw());
    c.addEventListener('touchstart', e => { e.preventDefault(); this._startDraw(e.touches[0]); }, { passive: false });
    c.addEventListener('touchmove',  e => { e.preventDefault(); this._draw(e.touches[0]); }, { passive: false });
    c.addEventListener('touchend',   () => this._endDraw());
  }

  _getPos(e) {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.W / rect.width;
    const scaleY = this.H / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top)  * scaleY,
    };
  }

  _startDraw(e) {
    if (this.step >= 2) return;
    this._saveHistory();
    this.isDrawing = true;
    const { x, y } = this._getPos(e);
    this.lastX = x; this.lastY = y;
    this._paintDot(x, y);
  }

  _draw(e) {
    if (!this.isDrawing) return;
    const { x, y } = this._getPos(e);
    this._paintLine(this.lastX, this.lastY, x, y);
    this.lastX = x; this.lastY = y;
  }

  _endDraw() {
    if (!this.isDrawing) return;
    this.isDrawing = false;
    this._applyNailMask();
    this._computeLiveScore();
  }

  _paintDot(x, y) {
    const ctx = this.ctx;
    ctx.save();
    ctx.clip(this.nailPath);
    ctx.fillStyle   = this.brushColor;
    ctx.globalAlpha = 0.92;
    ctx.beginPath();
    ctx.arc(x, y, this.brushSize, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  _paintLine(x1, y1, x2, y2) {
    const ctx = this.ctx;
    ctx.save();
    ctx.clip(this.nailPath);
    ctx.strokeStyle = this.brushColor;
    ctx.lineWidth   = this.brushSize * 2;
    ctx.lineCap     = 'round';
    ctx.lineJoin    = 'round';
    ctx.globalAlpha = 0.92;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.restore();
  }

  // ── 遮罩強制裁切（防止溢出）──
  _applyNailMask() {
    const ctx = this.ctx;
    // 把指甲外的部分重畫成底色（裁切效果）
    ctx.save();
    ctx.globalCompositeOperation = 'destination-in';
    // 指甲範圍外清除
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width  = this.W;
    tempCanvas.height = this.H;
    const tCtx = tempCanvas.getContext('2d');
    tCtx.fillStyle = 'black';
    tCtx.fill(this.nailPath);
    ctx.drawImage(tempCanvas, 0, 0);
    ctx.restore();

    // 重畫背景和手部（在繪圖層下）
    this._redrawBase();
  }

  _redrawBase() {
    // 取出目前繪圖內容
    const imgData = this.ctx.getImageData(0, 0, this.W, this.H);
    // 重畫背景
    this._drawBackground();
    // 疊上繪圖內容
    const tempC = document.createElement('canvas');
    tempC.width = this.W; tempC.height = this.H;
    tempC.getContext('2d').putImageData(imgData, 0, 0);
    this.ctx.drawImage(tempC, 0, 0);
    // 重畫指甲邊框
    this.ctx.strokeStyle = '#C8A88A';
    this.ctx.lineWidth   = 1.5;
    this.ctx.stroke(this.nailPath);
  }

  // ── 換色 ──
  setColor(hex) {
    this.brushColor = hex;
  }

  // ── 換筆刷大小 ──
  setBrushSize(size) {
    this.brushSize = size;
  }

  // ── 撤銷 ──
  undo() {
    if (!this.history.length) return;
    const imgData = this.history.pop();
    this.ctx.putImageData(imgData, 0, 0);
  }

  // ── 清除 ──
  clear() {
    this._saveHistory();
    this._drawBackground();
  }

  _saveHistory() {
    if (this.history.length > 20) this.history.shift();
    this.history.push(this.ctx.getImageData(0, 0, this.W, this.H));
  }

  // ── 進入圖案步驟 ──
  enterDecorStep() {
    this.step = 1;
    // 切換到圖案顏色
    this.brushColor = this.pattern.decorColor;
    this.brushSize  = 10;
  }

  // ── 像素分析計算分數 ──
  _computeLiveScore() {
    const imageData = this.ctx.getImageData(0, 0, this.W, this.H);
    const data = imageData.data;

    // 計算指甲區域像素
    const nailOffscreen = document.createElement('canvas');
    nailOffscreen.width  = this.W;
    nailOffscreen.height = this.H;
    const nCtx = nailOffscreen.getContext('2d');
    nCtx.fillStyle = 'white';
    nCtx.fill(this.nailPath);
    const maskData = nCtx.getImageData(0, 0, this.W, this.H).data;

    let nailPixels = 0;
    let paintedPixels = 0;

    const baseRGB = this._hexToRgb(this.pattern.baseColor);

    for (let i = 0; i < data.length; i += 4) {
      const inNail = maskData[i] > 128;  // 白色區域 = 指甲內
      if (!inNail) continue;
      nailPixels++;
      const r = data[i], g = data[i+1], b = data[i+2];
      // 判斷是否塗到接近底色的顏色
      const dist = Math.abs(r - baseRGB.r) + Math.abs(g - baseRGB.g) + Math.abs(b - baseRGB.b);
      if (dist < 80) paintedPixels++;  // 在色彩範圍內視為塗色
    }

    const coverage = nailPixels > 0 ? paintedPixels / nailPixels : 0;
    return coverage;
  }

  // ── 最終分數計算 ──
  calculateScores(timeLeft, totalTime) {
    const coverage = this._computeLiveScore();

    // 整齊度：根據溢出情況（這裡用覆蓋率反推）
    const neatness = Math.min(100, coverage * 100 * 1.1);

    // 圖案還原度：圖案步驟的比較
    const restoration = this.step >= 1
      ? this._computeRestorationScore()
      : Math.round(coverage * 70);

    // 速度
    const speedRatio = timeLeft / totalTime;
    const speed = Math.round(Math.max(20, speedRatio * 100));

    return {
      coverage:    Math.min(100, Math.round(coverage * 100)),
      neatness:    Math.min(100, Math.round(neatness)),
      restoration: Math.min(100, Math.round(restoration)),
      speed,
    };
  }

  _computeRestorationScore() {
    // 比較玩家畫的圖案區域與參考圖的色彩相似度
    // 簡化版：以裝飾色覆蓋指甲面積的合理比例來估算
    const imageData = this.ctx.getImageData(0, 0, this.W, this.H);
    const data = imageData.data;
    const decorRGB = this._hexToRgb(this.pattern.decorColor);

    let decorPixels = 0;
    const expectedDecorPixels = Math.round(
      this.W * this.H * (this.pattern.decorSize ** 2) * Math.PI * 2
    );

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i], g = data[i+1], b = data[i+2];
      const dist = Math.abs(r - decorRGB.r) + Math.abs(g - decorRGB.g) + Math.abs(b - decorRGB.b);
      if (dist < 60) decorPixels++;
    }

    const ratio = decorPixels / Math.max(expectedDecorPixels, 1);
    // 1.0 = 完美，>1.0 = 畫多了，<1.0 = 畫少了
    const score = ratio >= 1 ? Math.max(60, 100 - (ratio - 1) * 80) : ratio * 100;
    return Math.max(0, Math.min(100, score));
  }

  _hexToRgb(hex) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return { r, g, b };
  }

  // ── 覆蓋率（即時回傳給 UI）──
  getLiveCoverage() {
    return Math.round(this._computeLiveScore() * 100);
  }
}
