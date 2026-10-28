<template>
  <div class="panel threads-panel">
    <div class="panel-header">
      <div class="panel-title">
        <Cpu :size="15" />
        <span>Estado das Transações (Threads)</span>
      </div>
      <div class="status-legend">
        <span class="legend-item">
          <span class="dot active"></span> Ativa
        </span>
        <span class="legend-item">
          <span class="dot delay"></span> Delay
        </span>
        <span class="legend-item">
          <span class="dot aborted"></span> Abortada
        </span>
        <span class="legend-item">
          <span class="dot committed"></span> Commitada
        </span>
      </div>
    </div>

    <div class="panel-body">
      <div class="threads-grid">
        <div
          v-for="tx in transactions"
          :key="tx.id"
          class="thread-card"
          :class="'status-' + tx.status.toLowerCase()"
        >
          <div class="thread-header">
            <div class="thread-id">
              <span
                class="tx-color-bar"
                :class="'tx-bg-' + ((tx.id - 1) % 5 + 1)"
              ></span>
              <strong>Transação T{{ tx.id }}</strong>
            </div>
            <span class="status-pill">
              <Activity v-if="tx.status === 'ACTIVE'" :size="12" />
              <Clock v-else-if="tx.status === 'DELAY'" :size="12" />
              <OctagonAlert v-else-if="tx.status === 'ABORTED'" :size="12" />
              <CheckCircle2 v-else-if="tx.status === 'COMMITTED'" :size="12" />
              {{ statusLabel(tx.status) }}
            </span>
          </div>

          <div class="thread-ops mono">
            <span class="ops-label">Escopo:</span>
            <span class="ops-list">
              {{ tx.originalOperations.map((o) => o.toString()).join(" → ") }}
            </span>
          </div>

          <div v-if="tx.abortCount > 0" class="abort-notice">
            <AlertTriangle :size="12" />
            <span>{{ tx.abortCount }}x abortada por Deadlock</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import {
  Cpu,
  Activity,
  Clock,
  OctagonAlert,
  CheckCircle2,
  AlertTriangle,
} from "lucide-vue-next";

defineProps({
  transactions: { type: Object, required: true },
});

function statusLabel(status) {
  const map = {
    ACTIVE: "ACTIVE",
    DELAY: "DELAY",
    ABORTED: "ABORTED",
    COMMITTED: "COMMITTED",
  };
  return map[status] || status;
}
</script>

<style scoped>
.threads-panel {
  flex-shrink: 0;
  max-height: 210px;
}

.status-legend {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.legend-item {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 0.73rem;
  color: var(--text-secondary);
  font-weight: 500;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
}

.dot.active {
  background: var(--status-active);
}
.dot.delay {
  background: var(--status-delay);
}
.dot.aborted {
  background: var(--status-aborted);
}
.dot.committed {
  background: var(--status-committed);
}

.threads-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
  gap: 8px;
}

.thread-card {
  padding: 9px 11px;
  border-radius: 5px;
  border: 1px solid var(--border-color);
  border-left-width: 4px;
  background: var(--bg-subtle);
  display: flex;
  flex-direction: column;
  gap: 6px;
  transition: all 0.2s ease;
}

.thread-card.status-active {
  border-color: var(--status-active-border);
  border-left-color: var(--status-active);
  background: var(--status-active-bg);
}

.thread-card.status-delay {
  border-color: var(--status-delay-border);
  border-left-color: var(--status-delay);
  background: var(--status-delay-bg);
}

.thread-card.status-aborted {
  border-color: var(--status-aborted-border);
  border-left-color: var(--status-aborted);
  background: var(--status-aborted-bg);
}

.thread-card.status-committed {
  border-color: var(--status-committed-border);
  border-left-color: var(--status-committed);
  background: var(--status-committed-bg);
}

.thread-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
}

.thread-id {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.84rem;
  color: var(--text-primary);
}

.tx-color-bar {
  width: 8px;
  height: 8px;
  border-radius: 2px;
}

.tx-bg-1 {
  background: var(--tx-1);
}
.tx-bg-2 {
  background: var(--tx-2);
}
.tx-bg-3 {
  background: var(--tx-3);
}
.tx-bg-4 {
  background: var(--tx-4);
}
.tx-bg-5 {
  background: var(--tx-5);
}

.status-pill {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-family: ui-monospace, Consolas, monospace;
  font-size: 0.69rem;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 3px;
  letter-spacing: 0.02em;
}

.status-active .status-pill {
  color: var(--status-active-text);
  background: rgba(34, 197, 94, 0.15);
}

.status-delay .status-pill {
  color: var(--status-delay-text);
  background: rgba(245, 158, 11, 0.15);
}

.status-aborted .status-pill {
  color: var(--status-aborted-text);
  background: rgba(239, 68, 68, 0.15);
}

.status-committed .status-pill {
  color: var(--status-committed-text);
  background: rgba(59, 130, 246, 0.15);
}

.thread-ops {
  font-size: 0.75rem;
  color: var(--text-secondary);
  display: flex;
  gap: 5px;
  align-items: baseline;
  word-break: break-word;
}

.ops-label {
  font-weight: 600;
  color: var(--text-muted);
  flex-shrink: 0;
}

.abort-notice {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 0.73rem;
  font-weight: 600;
  color: var(--status-aborted-text);
  padding-top: 2px;
}
</style>

