<template>
  <div class="panel log-panel">
    <div class="panel-header">
      <div class="panel-title">
        <Terminal :size="15" />
        <span>Log de Eventos do Escalonador</span>
      </div>
      <span class="badge-count">{{ logs.length }} registros</span>
    </div>

    <div class="panel-body log-stream mono">
      <div
        v-for="log in logs"
        :key="log.id"
        class="log-entry"
        :class="'log-' + log.tag.toLowerCase()"
      >
        <span class="log-icon">
          <Play v-if="log.tag === 'EXEC'" :size="13" />
          <Clock v-else-if="log.tag === 'DELAY'" :size="13" />
          <OctagonAlert v-else-if="log.tag === 'DEADLOCK'" :size="13" />
          <RotateCcw v-else-if="log.tag === 'ABORT'" :size="13" />
          <CheckCircle2 v-else-if="log.tag === 'COMMIT'" :size="13" />
          <LockOpen v-else-if="log.tag === 'RESUME'" :size="13" />
          <RefreshCw v-else-if="log.tag === 'RESTART'" :size="13" />
          <CheckCheck v-else-if="log.tag === 'DONE'" :size="13" />
          <Info v-else :size="13" />
        </span>

        <span class="log-step">#{{ String(log.step).padStart(2, "0") }}</span>
        <span class="log-tag">{{ log.tag }}</span>
        <span class="log-message">{{ log.message }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import {
  Terminal,
  Play,
  Clock,
  OctagonAlert,
  RotateCcw,
  CheckCircle2,
  LockOpen,
  RefreshCw,
  CheckCheck,
  Info,
} from "lucide-vue-next";

defineProps({
  logs: { type: Array, required: true },
});
</script>

<style scoped>
.log-panel {
  flex: 1;
  min-height: 140px;
}

.log-stream {
  background: var(--bg-input);
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 0.78rem;
}

.log-entry {
  display: grid;
  grid-template-columns: 18px 34px 74px 1fr;
  align-items: baseline;
  gap: 6px;
  padding: 5px 8px;
  border-radius: 4px;
  border-left: 3px solid var(--border-strong);
  background: var(--bg-panel);
  color: var(--text-primary);
  line-height: 1.4;
}

.log-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transform: translateY(2px);
  color: var(--text-secondary);
}

.log-step {
  color: var(--text-muted);
  font-size: 0.72rem;
}

.log-tag {
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.03em;
  color: var(--text-secondary);
}

.log-message {
  word-break: break-word;
}

.log-exec {
  border-left-color: var(--status-active);
}
.log-exec .log-tag,
.log-exec .log-icon {
  color: var(--status-active-text);
}

.log-delay {
  border-left-color: var(--status-delay);
  background: var(--status-delay-bg);
}
.log-delay .log-tag,
.log-delay .log-icon {
  color: var(--status-delay-text);
}

.log-deadlock,
.log-abort {
  border-left-color: var(--status-aborted);
  background: var(--status-aborted-bg);
  font-weight: 600;
}
.log-deadlock .log-tag,
.log-deadlock .log-icon,
.log-abort .log-tag,
.log-abort .log-icon {
  color: var(--status-aborted-text);
}

.log-commit {
  border-left-color: var(--status-committed);
}
.log-commit .log-tag,
.log-commit .log-icon {
  color: var(--status-committed-text);
}

.log-resume,
.log-restart {
  border-left-color: var(--lock-tag-color);
}
.log-resume .log-tag,
.log-resume .log-icon,
.log-restart .log-tag,
.log-restart .log-icon {
  color: var(--lock-tag-text);
}

.log-done {
  border-left-color: var(--status-active);
  background: var(--status-active-bg);
  font-weight: 600;
}
.log-done .log-tag,
.log-done .log-icon {
  color: var(--status-active-text);
}
</style>

