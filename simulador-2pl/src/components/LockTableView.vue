<template>
  <div class="storage-and-locks">
    <div class="tables-row">
      <!-- Tabela de Locks -->
      <div class="panel">
        <div class="panel-header">
          <div class="panel-title">
            <Shield :size="15" />
            <span>Tabela de Locks (Lock Table)</span>
          </div>
          <span class="badge-count">
            {{ Object.keys(lockManager.lockTable).length }} itens
          </span>
        </div>
        <div class="panel-body table-wrapper">
          <table class="tech-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Modo Atual</th>
                <th>Detentoras (Holders)</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(entry, varName) in lockManager.lockTable"
                :key="varName"
              >
                <td class="var-col mono">{{ varName }}</td>
                <td>
                  <span
                    class="mode-badge"
                    :class="{
                      'mode-none': !entry.type,
                      'mode-s': entry.type === 'S',
                      'mode-x': entry.type === 'X',
                    }"
                  >
                    <LockOpen v-if="!entry.type" :size="12" />
                    <Lock v-else-if="entry.type === 'S'" :size="12" />
                    <KeyRound v-else :size="12" />
                    <span>
                      {{
                        entry.type === "S"
                          ? "Compartilhado (S)"
                          : entry.type === "X"
                            ? "Exclusivo (X)"
                            : "Livre (None)"
                      }}
                    </span>
                  </span>
                </td>
                <td>
                  <div v-if="entry.holders.length > 0" class="holders-list">
                    <span
                      v-for="h in entry.holders"
                      :key="h"
                      class="tx-badge mono"
                    >
                      T{{ h }}
                    </span>
                  </div>
                  <span v-else class="muted-dash">—</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Dados em Memória (DB) -->
      <div class="panel">
        <div class="panel-header">
          <div class="panel-title">
            <HardDrive :size="15" />
            <span>Dados em Memória (RAM / DB)</span>
          </div>
          <span class="badge-count">Undo Log Ativo</span>
        </div>
        <div class="panel-body table-wrapper">
          <table class="tech-table">
            <thead>
              <tr>
                <th>Variável</th>
                <th>Valor Atual</th>
                <th>Inicial</th>
                <th>Última Escrita</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(val, varName) in db.data" :key="varName">
                <td class="var-col mono">{{ varName }}</td>
                <td class="val-col mono">
                  <span
                    :class="{
                      'val-modified': val !== db.initialData[varName],
                    }"
                  >
                    {{ val }}
                  </span>
                </td>
                <td class="init-col mono">{{ db.initialData[varName] }}</td>
                <td>
                  <span
                    v-if="db.lastModifiedBy[varName]"
                    class="tx-badge mono"
                  >
                    T{{ db.lastModifiedBy[varName] }}
                  </span>
                  <span v-else class="muted-text">Valor Inicial</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Grafo de Espera (Wait-For Graph) -->
    <div class="panel graph-panel">
      <div class="panel-header">
        <div class="panel-title">
          <GitFork :size="15" />
          <span>Grafo de Espera (Wait-For Graph — Detecção de Deadlock)</span>
        </div>
        <span
          class="badge-count"
          :class="{ warning: Object.keys(lockManager.waitForGraph).length > 0 }"
        >
          {{ Object.keys(lockManager.waitForGraph).length }} dependência(s)
        </span>
      </div>
      <div class="panel-body">
        <div
          v-if="Object.keys(lockManager.waitForGraph).length > 0"
          class="edges-grid"
        >
          <div
            v-for="(holders, waiter) in lockManager.waitForGraph"
            :key="waiter"
            class="edge-row"
          >
            <span class="node-pill waiting mono">
              <Clock :size="12" />
              T{{ waiter }} (Bloqueada)
            </span>
            <div class="edge-connector">
              <span class="edge-label">aguarda liberação de</span>
              <ArrowRight :size="14" />
            </div>
            <div class="holders-list">
              <span
                v-for="h in holders"
                :key="h"
                class="node-pill holding mono"
              >
                <Lock :size="12" />
                T{{ h }} (Detentora)
              </span>
            </div>
          </div>
        </div>
        <div v-else class="empty-state">
          <CheckCircle2 :size="14" />
          <span>
            Nenhuma aresta de espera ativa no grafo (Sem contenção de recursos no
            momento).
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import {
  Shield,
  HardDrive,
  GitFork,
  LockOpen,
  Lock,
  KeyRound,
  Clock,
  ArrowRight,
  CheckCircle2,
} from "lucide-vue-next";

defineProps({
  lockManager: { type: Object, required: true },
  db: { type: Object, required: true },
});
</script>

<style scoped>
.storage-and-locks {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
  min-height: 0;
}

.tables-row {
  display: grid;
  grid-template-columns: 1.15fr 0.85fr;
  gap: 8px;
  flex: 1;
  min-height: 0;
}

.table-wrapper {
  padding: 0;
}

.tech-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.8rem;
}

.tech-table th,
.tech-table td {
  padding: 8px 12px;
  text-align: left;
  border-bottom: 1px solid var(--border-color);
}

.tech-table th {
  font-size: 0.72rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  color: var(--text-muted);
  background: var(--bg-subtle);
  position: sticky;
  top: 0;
}

.var-col {
  font-weight: 700;
  font-size: 0.88rem;
  color: var(--accent-primary);
}

.val-col {
  font-weight: 700;
  font-size: 0.88rem;
}

.val-modified {
  color: var(--status-active-text);
  background: var(--status-active-bg);
  padding: 1px 6px;
  border-radius: 4px;
  border: 1px solid var(--status-active-border);
}

.init-col {
  color: var(--text-muted);
  font-size: 0.78rem;
}

.mode-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.74rem;
  font-weight: 600;
  border: 1px solid transparent;
}

.mode-none {
  background: var(--bg-subtle);
  color: var(--text-muted);
  border-color: var(--border-color);
}

.mode-s {
  background: var(--status-committed-bg);
  color: var(--status-committed-text);
  border-color: var(--status-committed-border);
}

.mode-x {
  background: var(--status-aborted-bg);
  color: var(--status-aborted-text);
  border-color: var(--status-aborted-border);
}

.holders-list {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;
}

.tx-badge {
  display: inline-flex;
  align-items: center;
  padding: 1px 7px;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 700;
  background: var(--bg-subtle);
  border: 1px solid var(--border-strong);
  color: var(--text-primary);
}

.muted-dash,
.muted-text {
  color: var(--text-muted);
  font-size: 0.76rem;
}

.graph-panel {
  flex-shrink: 0;
  min-height: 96px;
  max-height: 150px;
}

.edges-grid {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.edge-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  padding: 6px 10px;
  border-radius: 5px;
  background: var(--bg-subtle);
  border: 1px solid var(--border-color);
}

.node-pill {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 9px;
  border-radius: 4px;
  font-size: 0.76rem;
  font-weight: 700;
}

.node-pill.waiting {
  background: var(--status-delay-bg);
  border: 1px solid var(--status-delay-border);
  color: var(--status-delay-text);
}

.node-pill.holding {
  background: var(--status-aborted-bg);
  border: 1px solid var(--status-aborted-border);
  color: var(--status-aborted-text);
}

.edge-connector {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--text-secondary);
  font-size: 0.75rem;
}

@media (max-width: 1080px) {
  .tables-row {
    grid-template-columns: 1fr;
  }
}
</style>

