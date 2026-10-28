import { Operation } from "./Operation.js";

export class LockManager {
  constructor(variables = ["x", "y"]) {
    this.lockTable = {};
    variables.forEach((v) => this.ensureVariable(v));
    this.waitForGraph = {}; // { T_esperando: [T_detentora1, ...] }
  }

  ensureVariable(varName) {
    if (varName && !this.lockTable[varName]) {
      this.lockTable[varName] = {
        type: null, // null | 'S' | 'X'
        holders: [], // Array de IDs de transações
      };
    }
  }

  canGrantLock(op) {
    const { variable, transactionId: tid, type } = op;
    this.ensureVariable(variable);
    const entry = this.lockTable[variable];

    if (entry.type === null) return true;

    if (type === "r") {
      // Leitura pode compartilhar lock S ou ler se a própria transação já tem X
      return entry.type === "S" || entry.holders.includes(tid);
    }

    if (type === "w") {
      // Escrita pode ocorrer se já tem X ou se é a ÚNICA detentora de S (Upgrade ls -> lx)
      return entry.holders.length === 1 && entry.holders[0] === tid;
    }

    return false;
  }

  grantLock(op) {
    const { variable, transactionId: tid, type } = op;
    this.ensureVariable(variable);
    const entry = this.lockTable[variable];
    const generatedLockOps = [];
    let actionDesc = "";

    if (type === "r") {
      if (!entry.holders.includes(tid)) {
        entry.type = "S";
        entry.holders.push(tid);
        generatedLockOps.push(new Operation("ls", tid, variable));
        actionDesc = `Lock Compartilhado ls${tid}(${variable}) concedido`;
      } else {
        actionDesc = `T${tid} já possui lock compatível sobre '${variable}'`;
      }
    } else if (type === "w") {
      if (entry.type !== "X") {
        const isUpgrade = entry.holders.includes(tid);
        entry.type = "X";
        if (!isUpgrade) entry.holders.push(tid);
        generatedLockOps.push(new Operation("lx", tid, variable));
        actionDesc = isUpgrade
          ? `UPGRADE de Lock (ls -> lx) concedido para T${tid} em '${variable}'`
          : `Lock Exclusivo lx${tid}(${variable}) concedido`;
      } else {
        actionDesc = `T${tid} já possui Lock Exclusivo sobre '${variable}'`;
      }
    }

    return { generatedLockOps, actionDesc };
  }

  releaseAllLocks(tid) {
    const unlockOps = [];
    for (const [varName, entry] of Object.entries(this.lockTable)) {
      const idx = entry.holders.indexOf(tid);
      if (idx !== -1) {
        entry.holders.splice(idx, 1);
        if (entry.holders.length === 0) {
          entry.type = null;
        }
        unlockOps.push(new Operation("u", tid, varName));
      }
    }

    // Remove tid das dependências do grafo de espera
    delete this.waitForGraph[tid];
    for (const waiter of Object.keys(this.waitForGraph)) {
      this.waitForGraph[waiter] = this.waitForGraph[waiter].filter(
        (h) => h !== tid,
      );
      if (this.waitForGraph[waiter].length === 0) {
        delete this.waitForGraph[waiter];
      }
    }

    return unlockOps;
  }

  addWaitDependency(waiterTid, variable) {
    this.ensureVariable(variable);
    const holders = this.lockTable[variable].holders.filter(
      (h) => h !== waiterTid,
    );
    if (!this.waitForGraph[waiterTid]) {
      this.waitForGraph[waiterTid] = [];
    }
    holders.forEach((h) => {
      if (!this.waitForGraph[waiterTid].includes(h)) {
        this.waitForGraph[waiterTid].push(h);
      }
    });
    return holders;
  }

  clearWaitDependency(tid) {
    delete this.waitForGraph[tid];
  }

  detectDeadlock() {
    const visited = new Set();
    const recStack = new Set();
    let cycleNodes = [];

    const dfs = (node, path) => {
      visited.add(node);
      recStack.add(node);
      path.push(node);

      const neighbors = this.waitForGraph[node] || [];
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          if (dfs(neighbor, path)) return true;
        } else if (recStack.has(neighbor)) {
          const cycleStartIndex = path.indexOf(neighbor);
          cycleNodes = path.slice(cycleStartIndex);
          return true;
        }
      }

      recStack.delete(node);
      path.pop();
      return false;
    };

    for (const nodeStr of Object.keys(this.waitForGraph)) {
      const node = Number(nodeStr);
      if (!visited.has(node)) {
        if (dfs(node, [])) {
          // Critério: escolhe a transação de maior ID (mais jovem) no ciclo como vítima
          const victim = Math.max(...cycleNodes);
          return {
            detected: true,
            cycle: [...cycleNodes, cycleNodes[0]],
            victim,
          };
        }
      }
    }

    return { detected: false, cycle: [], victim: null };
  }
}
