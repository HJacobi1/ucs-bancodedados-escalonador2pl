import { Operation } from "./Operation.js";
import { Transaction } from "./Transaction.js";
import { Database } from "./Database.js";
import { LockManager } from "./LockManager.js";

export class Scheduler {
  constructor(initialData, hiString) {
    this.stepCount = 0;
    this.isFinished = false;
    this.logs = [];
    this.transactions = {};
    this.hi = [];
    this.hf = [];
    this.delayQueue = [];
    this.currentOp = null;

    this.db = new Database(initialData);
    this._parseHI(hiString);

    const vars = Object.keys(this.db.data);
    this.lockManager = new LockManager(vars);

    this.addLog(
      "INFO",
      `Simulador inicializado. HI contém ${this.hi.length} operações.`,
    );
  }

  _parseHI(hiString) {
    const tokens = hiString
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    const regex = /^([rwc])(\d+)(?:\(([a-zA-Z]+)(?:=(-?\d+))?\))?$/i;

    tokens.forEach((token) => {
      const match = token.match(regex);
      if (!match) {
        throw new Error(
          `Operação inválida na HI: "${token}". Use ex: r1(x), w2(y=50), c1`,
        );
      }
      const type = match[1].toLowerCase();
      const tid = Number(match[2]);
      const variable = match[3] ? match[3].toLowerCase() : null;
      const val =
        match[4] !== undefined
          ? Number(match[4])
          : type === "w"
            ? tid * 10
            : null;

      if (variable) {
        this.db.ensureVariable(variable);
      }

      const op = new Operation(type, tid, variable, val);
      this.hi.push(op);

      if (!this.transactions[tid]) {
        this.transactions[tid] = new Transaction(tid);
      }
      this.transactions[tid].addOriginalOperation(op);
    });
  }

  addLog(tag, message) {
    this.logs.unshift({
      id: Date.now() + Math.random(),
      step: this.stepCount,
      tag,
      message,
    });
  }

  nextStep() {
    if (this.hi.length === 0) {
      this.isFinished = true;
      this.currentOp = null;
      this.addLog(
        "DONE",
        "História Inicial (HI) concluída! Execução finalizada.",
      );
      return;
    }

    this.stepCount++;
    const op = this.hi.shift();
    this.currentOp = op;
    const tx = this.transactions[op.transactionId];

    // Se a transação foi abortada anteriormente e está reiniciando agora do fim da HI
    if (tx.status === "ABORTED") {
      tx.setStatus("ACTIVE");
      this.addLog(
        "RESTART",
        `T${tx.id} retomou status ACTIVE ao reiniciar sua execução.`,
      );
    }

    // Se a transação já está bloqueada em DELAY, qualquer nova operação dela vai direto para a fila de Delay
    if (tx.status === "DELAY") {
      this.delayQueue.push(op);
      this.addLog(
        "DELAY",
        `Passo ${this.stepCount}: T${tx.id} já está bloqueada. Operação ${op.toString()} enviada direto para a fila de Delay.`,
      );
      return;
    }

    if (op.type === "c") {
      this._executeCommit(op);
      this._processDelayQueue();
    } else {
      this._evaluateReadWrite(op);
    }

    if (this.hi.length === 0 && this.delayQueue.length === 0) {
      this.isFinished = true;
      this.addLog("DONE", "Todas as operações foram processadas com sucesso!");
    }
  }

  _evaluateReadWrite(op) {
    const tid = op.transactionId;
    const tx = this.transactions[tid];

    if (this.lockManager.canGrantLock(op)) {
      this._grantAndExecute(op);
    } else {
      const holders = this.lockManager.addWaitDependency(tid, op.variable);
      tx.setStatus("DELAY");
      this.delayQueue.push(op);
      this.addLog(
        "DELAY",
        `Passo ${this.stepCount}: Conflito em '${op.variable}'. ${op.toString()} entrou em DELAY (T${tid} aguarda ${holders.map((h) => "T" + h).join(", ")}).`,
      );

      // Sempre que alguém entra em espera, verifica se formou ciclo de Deadlock
      const deadlock = this.lockManager.detectDeadlock();
      if (deadlock.detected) {
        this._handleDeadlock(deadlock);
      }
    }
  }

  _grantAndExecute(op) {
    const tid = op.transactionId;
    const { generatedLockOps, actionDesc } = this.lockManager.grantLock(op);

    generatedLockOps.forEach((lockOp) => this.hf.push(lockOp));

    if (op.type === "r") {
      const val = this.db.read(op.variable);
      this.hf.push(op);
      this.addLog(
        "EXEC",
        `Passo ${this.stepCount}: ${actionDesc} -> Executou ${op.toString()} (Leu ${op.variable} = ${val}).`,
      );
    } else if (op.type === "w") {
      this.db.write(tid, op.variable, op.value);
      this.hf.push(op);
      this.addLog(
        "EXEC",
        `Passo ${this.stepCount}: ${actionDesc} -> Executou ${op.toString()} ('${op.variable}' atualizado para ${op.value}).`,
      );
    }
  }

  _executeCommit(op) {
    const tid = op.transactionId;
    const tx = this.transactions[tid];

    this.hf.push(op);
    const unlockOps = this.lockManager.releaseAllLocks(tid);
    unlockOps.forEach((uOp) => this.hf.push(uOp));

    this.db.commit(tid);
    tx.setStatus("COMMITTED");

    const unlockedVars = unlockOps.map((u) => u.variable).join(", ");
    this.addLog(
      "COMMIT",
      `Passo ${this.stepCount}: T${tid} realizou COMMIT (${op.toString()}). Locks liberados: [${unlockedVars || "nenhum"}].`,
    );
  }

  _handleDeadlock({ cycle, victim }) {
    const cycleStr = cycle.map((id) => `T${id}`).join(" → ");
    this.addLog(
      "DEADLOCK",
      `DEADLOCK DETECTADO! Ciclo no Grafo de Espera: ${cycleStr}. Vítima escolhida (maior ID): T${victim}.`,
    );

    const tx = this.transactions[victim];
    tx.setStatus("ABORTED");

    // 1. Retira todas as operações da transação vítima que já estavam na HF
    const removedCount = this.hf.filter(
      (op) => op.transactionId === victim,
    ).length;
    this.hf = this.hf.filter((op) => op.transactionId !== victim);

    // 2. Rollback dos valores alterados na memória pela vítima
    const revertedVars = this.db.rollback(victim);

    // 3. Libera todos os locks que a vítima detinha (sem adicionar u_i na HF pois foi abortada)
    this.lockManager.releaseAllLocks(victim);

    // 4. Remove operações pendentes da vítima da fila de Delay e do restante da HI
    this.delayQueue = this.delayQueue.filter(
      (op) => op.transactionId !== victim,
    );
    this.hi = this.hi.filter((op) => op.transactionId !== victim);

    // 5. Reinicia a transação colocando todas as suas operações originais no final da HI
    tx.originalOperations.forEach((origOp) => {
      this.hi.push(
        new Operation(
          origOp.type,
          origOp.transactionId,
          origOp.variable,
          origOp.value,
        ),
      );
    });

    this.addLog(
      "ABORT",
      `T${victim} ABORTADA: ${removedCount} operações removidas da HF, rollback em memória [${revertedVars.join(", ") || "sem escritas"}], locks liberados e T${victim} reinserida no final da HI.`,
    );

    // 6. Verifica se a liberação dos locks da vítima destravou quem estava em Delay
    this._processDelayQueue();
  }

  _processDelayQueue() {
    let progress = true;
    while (progress && this.delayQueue.length > 0) {
      progress = false;
      const stillBlockedTids = new Set();
      const remainingQueue = [];

      for (const op of this.delayQueue) {
        const tid = op.transactionId;

        if (stillBlockedTids.has(tid)) {
          remainingQueue.push(op);
          continue;
        }

        if (op.type === "c") {
          this.transactions[tid].setStatus("ACTIVE");
          this.addLog(
            "RESUME",
            `Retirando ${op.toString()} da fila de Delay para finalizar T${tid}.`,
          );
          this._executeCommit(op);
          progress = true;
        } else if (this.lockManager.canGrantLock(op)) {
          this.transactions[tid].setStatus("ACTIVE");
          this.lockManager.clearWaitDependency(tid);
          this.addLog(
            "RESUME",
            `Recurso '${op.variable}' liberado! Retirando ${op.toString()} do Delay.`,
          );
          this._grantAndExecute(op);
          progress = true;
        } else {
          this.lockManager.addWaitDependency(tid, op.variable);
          stillBlockedTids.add(tid);
          remainingQueue.push(op);
        }
      }

      this.delayQueue = remainingQueue;

      if (progress && this.delayQueue.length > 0) {
        const deadlock = this.lockManager.detectDeadlock();
        if (deadlock.detected) {
          this._handleDeadlock(deadlock);
          break;
        }
      }
    }
  }
}
