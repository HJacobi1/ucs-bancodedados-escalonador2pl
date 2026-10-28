export class Transaction {
  constructor(id) {
    this.id = Number(id);
    this.status = "ACTIVE"; // 'ACTIVE' | 'DELAY' | 'COMMITTED' | 'ABORTED'
    this.originalOperations = [];
    this.abortCount = 0;
  }

  addOriginalOperation(op) {
    this.originalOperations.push(op);
  }

  setStatus(newStatus) {
    this.status = newStatus;
    if (newStatus === "ABORTED") {
      this.abortCount++;
    }
  }
}
