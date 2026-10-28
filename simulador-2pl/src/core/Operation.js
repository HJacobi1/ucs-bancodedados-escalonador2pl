export class Operation {
  constructor(type, transactionId, variable = null, value = null) {
    this.type = type; // 'r', 'w', 'c', 'ls', 'lx', 'u'
    this.transactionId = Number(transactionId);
    this.variable = variable;
    this.value = value !== null ? Number(value) : null;
  }

  get isLockOp() {
    return ["ls", "lx", "u"].includes(this.type);
  }

  toString() {
    if (this.type === "c") return `c${this.transactionId}`;
    if (this.type === "w" && this.value !== null) {
      return `w${this.transactionId}(${this.variable}=${this.value})`;
    }
    return `${this.type}${this.transactionId}(${this.variable})`;
  }
}
