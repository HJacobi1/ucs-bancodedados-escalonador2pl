<template>
  <div class="queues-stack">
    <!-- Fila HI -->
    <div class="panel queue-panel">
      <div class="panel-header">
        <div class="panel-title">
          <Inbox :size="15" />
          <span>História Inicial (HI — Fila de Entrada)</span>
        </div>
        <span class="badge-count">{{ hi.length }} pendentes</span>
      </div>
      <div class="panel-body ops-container">
        <template v-if="hi.length > 0">
          <span
            v-for="(op, idx) in hi"
            :key="'hi-' + idx"
            class="op-chip mono"
            :class="[
              'tx-accent-' + ((op.transactionId - 1) % 5 + 1),
              { 'next-in-line': idx === 0 },
            ]"
            :title="idx === 0 ? 'Próxima operação a ser lida pelo escalonador' : ''"
          >
            <span v-if="idx === 0" class="next-dot"></span>
            {{ op.toString() }}
          </span>
        </template>
        <div v-else class="empty-state">
          <Check :size="14" />
          <span>Fila de entrada (HI) totalmente consumida.</span>
        </div>
      </div>
    </div>

    <!-- Fila de Delay -->
    <div class="panel queue-panel">
      <div class="panel-header">
        <div class="panel-title">
          <Clock :size="15" />
          <span>Fila de Espera (Delay Queue)</span>
        </div>
        <span class="badge-count" :class="{ warning: delayQueue.length > 0 }">
          {{ delayQueue.length }} em espera
        </span>
      </div>
      <div class="panel-body ops-container">
        <template v-if="delayQueue.length > 0">
          <span
            v-for="(op, idx) in delayQueue"
            :key="'delay-' + idx"
            class="op-chip op-delayed mono"
          >
            <Lock :size="12" />
            <span>{{ op.toString() }}</span>
          </span>
        </template>
        <div v-else class="empty-state">
          <span>Nenhuma operação retida na fila de espera.</span>
        </div>
      </div>
    </div>

    <!-- História Final (HF) -->
    <div class="panel queue-panel hf-panel">
      <div class="panel-header">
        <div class="panel-title">
          <CheckCircle2 :size="15" />
          <span>História Final (HF — Passo a Passo)</span>
        </div>
        <div class="hf-controls">
          <label class="lock-toggle">
            <input
              :checked="showLockOps"
              type="checkbox"
              @change="$emit('update:showLockOps', $event.target.checked)"
            />
            <KeyRound :size="12" />
            <span>Exibir Locks (<code>ls</code>, <code>lx</code>, <code>u</code>)</span>
          </label>
          <span class="badge-count">{{ filteredHF.length }} ops</span>
        </div>
      </div>
      <div class="panel-body ops-container">
        <template v-if="filteredHF.length > 0">
          <template v-for="(op, idx) in filteredHF" :key="'hf-' + idx">
            <span
              class="op-chip mono"
              :class="[
                op.isLockOp ? 'op-lock' : 'op-executed',
                'tx-accent-' + ((op.transactionId - 1) % 5 + 1),
              ]"
            >
              {{ op.toString() }}
            </span>
            <ArrowRight
              v-if="idx < filteredHF.length - 1"
              :size="12"
              class="step-arrow"
            />
          </template>
        </template>
        <div v-else class="empty-state">
          <span>Nenhuma operação consolidada na História Final até o momento.</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import {
  Inbox,
  Clock,
  CheckCircle2,
  Lock,
  KeyRound,
  ArrowRight,
  Check,
} from "lucide-vue-next";

const props = defineProps({
  hi: { type: Array, required: true },
  delayQueue: { type: Array, required: true },
  hf: { type: Array, required: true },
  showLockOps: { type: Boolean, default: true },
});

defineEmits(["update:showLockOps"]);

const filteredHF = computed(() => {
  if (props.showLockOps) {
    return props.hf;
  }
  return props.hf.filter((op) => !op.isLockOp);
});
</script>

<style scoped>
.queues-stack {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex-shrink: 0;
}

.queue-panel {
  min-height: 78px;
  max-height: 126px;
}

.hf-panel {
  min-height: 92px;
  max-height: 150px;
}

.ops-container {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  align-content: flex-start;
}

.op-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 9px;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 600;
  background: var(--bg-subtle);
  border: 1px solid var(--border-color);
  border-left-width: 3px;
  color: var(--text-primary);
  line-height: 1.3;
}

.next-in-line {
  border-color: var(--accent-primary);
  background: var(--status-committed-bg);
}

.next-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--accent-primary);
  display: inline-block;
}

.tx-accent-1 {
  border-left-color: var(--tx-1);
}
.tx-accent-2 {
  border-left-color: var(--tx-2);
}
.tx-accent-3 {
  border-left-color: var(--tx-3);
}
.tx-accent-4 {
  border-left-color: var(--tx-4);
}
.tx-accent-5 {
  border-left-color: var(--tx-5);
}

.op-delayed {
  background: var(--status-delay-bg);
  border: 1px solid var(--status-delay-border);
  border-left-width: 3px;
  border-left-color: var(--status-delay);
  color: var(--status-delay-text);
}

.op-executed {
  background: var(--status-active-bg);
  border: 1px solid var(--status-active-border);
  border-left-width: 3px;
  color: var(--status-active-text);
}

.op-lock {
  background: var(--lock-tag-bg);
  border: 1px dashed var(--lock-tag-border);
  color: var(--lock-tag-text);
  font-size: 0.74rem;
  padding: 2px 7px;
}

.step-arrow {
  color: var(--text-muted);
  flex-shrink: 0;
}

.hf-controls {
  display: flex;
  align-items: center;
  gap: 10px;
}

.lock-toggle {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 0.75rem;
  color: var(--text-secondary);
  cursor: pointer;
  user-select: none;
}

.lock-toggle input {
  accent-color: var(--accent-primary);
  cursor: pointer;
}

.lock-toggle code {
  font-size: 0.72rem;
  color: var(--text-primary);
}
</style>

