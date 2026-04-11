/**
 * DataLoader — 統一載入所有 JSON 資料
 */
export class DataLoader {
  constructor() {
    this.levels    = [];
    this.customers = [];
    this.dialogues = {};
    this.patterns  = [];
    this.complaints = [];
    this._loaded   = false;
  }

  async loadAll() {
    if (this._loaded) return;
    try {
      const [levels, customers, dialogues, patterns, complaints] = await Promise.all([
        fetch('./src/data/levels.json').then(r => r.json()),
        fetch('./src/data/customers.json').then(r => r.json()),
        fetch('./src/data/dialogues.json').then(r => r.json()),
        fetch('./src/data/nailPatterns.json').then(r => r.json()),
        fetch('./src/data/complaints.json').then(r => r.json()),
      ]);
      this.levels     = levels;
      this.customers  = customers;
      this.dialogues  = dialogues;
      this.patterns   = patterns;
      this.complaints = complaints;
      this._loaded    = true;
    } catch (e) {
      console.error('DataLoader 載入失敗：', e);
    }
  }

  getLevel(id)    { return this.levels.find(l => l.levelId === id); }
  getCustomer(id) { return this.customers.find(c => c.id === id); }
  getPattern(id)  { return this.patterns.find(p => p.id === id); }
  getLevelDialogue(levelKey) { return this.dialogues[levelKey] || null; }
  getComplaint(levelId) { return this.complaints.find(c => c.levelId === levelId); }
}
