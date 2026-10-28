export class Database {
  constructor(initialData = { x: 100, y: 200 }) {
    this.initialData = { ...initialData };
    this.data = { ...initialData };
    this.lastModifiedBy = {}; // Para destacar na tela quem alterou por último
    this.undoLog = {}; // { tid: { varName: oldValue } }
  }

  ensureVariable(varName) {
    if (varName && !(varName in this.data)) {
      this.data[varName] = 0;
      this.initialData[varName] = 0;
    }
  }

  read(varName) {
    this.ensureVariable(varName);
    return this.data[varName];
  }

  write(tid, varName, newValue) {
    this.ensureVariable(varName);
    if (!this.undoLog[tid]) {
      this.undoLog[tid] = {};
    }
    // Salva o valor original antes da primeira escrita de T_i nessa variável
    if (!(varName in this.undoLog[tid])) {
      this.undoLog[tid][varName] = this.data[varName];
    }
    this.data[varName] = newValue;
    this.lastModifiedBy[varName] = tid;
  }

  rollback(tid) {
    const reverted = [];
    if (this.undoLog[tid]) {
      for (const [varName, oldVal] of Object.entries(this.undoLog[tid])) {
        this.data[varName] = oldVal;
        if (this.lastModifiedBy[varName] === tid) {
          delete this.lastModifiedBy[varName];
        }
        reverted.push(`${varName}=${oldVal}`);
      }
      delete this.undoLog[tid];
    }
    return reverted;
  }

  commit(tid) {
    delete this.undoLog[tid];
  }
}
