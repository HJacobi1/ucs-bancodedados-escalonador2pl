<template>
  <section class="control-bar">
    <div class="presets-strip">
      <div class="presets-group">
        <span class="strip-label">
          <Bookmark :size="13" />
          Cenários:
        </span>
        <button
          type="button"
          class="preset-btn"
          :class="{ active: activePreset === 1 }"
          @click="$emit('load-preset', 1)"
        >
          <span class="preset-num">01</span>
          Compartilhamento (Lock S)
        </button>
        <button
          type="button"
          class="preset-btn"
          :class="{ active: activePreset === 2 }"
          @click="$emit('load-preset', 2)"
        >
          <span class="preset-num">02</span>
          Bloqueio, Delay &amp; Upgrade (ls → lx)
        </button>
        <button
          type="button"
          class="preset-btn"
          :class="{ active: activePreset === 3 }"
          @click="$emit('load-preset', 3)"
        >
          <span class="preset-num">03</span>
          Deadlock Clássico (Abort &amp; Restart)
        </button>
      </div>

      <div v-if="currentOp" class="last-op-indicator">
        <span class="strip-label">Última Op. Lida:</span>
        <code class="current-op-code">{{ currentOp.toString() }}</code>
      </div>
    </div>

    <div class="controls-row">
      <div class="field-group field-hi">
        <label for="hi-input">
          <ListOrdered :size="13" />
          História Inicial (HI)
        </label>
        <input
          id="hi-input"
          :value="hiInput"
          type="text"
          class="mono"
          placeholder="Ex: r1(x), r2(y), w1(y=150), w2(x=250), c1, c2"
          @input="$emit('update:hiInput', $event.target.value)"
          @keyup.enter="$emit('init')"
        />
      </div>

      <div class="field-group field-db">
        <label for="db-input">
          <Database :size="13" />
          Variáveis Iniciais (JSON)
        </label>
        <input
          id="db-input"
          :value="dbInput"
          type="text"
          class="mono"
          placeholder='{"x": 100, "y": 200}'
          @input="$emit('update:dbInput', $event.target.value)"
          @keyup.enter="$emit('init')"
        />
      </div>

      <div class="buttons-group">
        <button
          type="button"
          class="btn btn-neutral"
          title="Reiniciar simulação com os dados atuais"
          @click="$emit('init')"
        >
          <RotateCcw :size="15" />
          <span>Reiniciar / Aplicar</span>
        </button>

        <button
          type="button"
          class="btn btn-primary"
          :disabled="isFinished"
          title="Executar próximo passo da HI"
          @click="$emit('step')"
        >
          <StepForward :size="15" />
          <span>Próximo Passo</span>
        </button>

        <button
          type="button"
          class="btn"
          :class="isPlaying ? 'btn-warning' : 'btn-success'"
          :disabled="isFinished"
          @click="$emit('toggle-play')"
        >
          <Pause v-if="isPlaying" :size="15" />
          <Play v-else :size="15" />
          <span>{{ isPlaying ? "Pausar" : "Auto-Play" }}</span>
        </button>
      </div>
    </div>

    <div v-if="errorMsg" class="error-alert">
      <AlertCircle :size="15" />
      <span>{{ errorMsg }}</span>
    </div>
  </section>
</template>

<script setup>
import {
  Bookmark,
  ListOrdered,
  Database,
  RotateCcw,
  StepForward,
  Play,
  Pause,
  AlertCircle,
} from "lucide-vue-next";

defineProps({
  hiInput: { type: String, required: true },
  dbInput: { type: String, required: true },
  isFinished: { type: Boolean, default: false },
  isPlaying: { type: Boolean, default: false },
  errorMsg: { type: String, default: "" },
  activePreset: { type: Number, default: 3 },
  currentOp: { type: Object, default: null },
});

defineEmits([
  "update:hiInput",
  "update:dbInput",
  "init",
  "step",
  "toggle-play",
  "load-preset",
]);
</script>

<style scoped>
.control-bar {
  background: var(--bg-panel);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  padding: 10px 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  flex-shrink: 0;
  box-shadow: var(--shadow-sm);
}

.presets-strip {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--border-color);
}

.presets-group {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.strip-label {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 0.76rem;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.03em;
  margin-right: 4px;
}

.preset-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: var(--bg-subtle);
  border: 1px solid var(--border-color);
  color: var(--text-secondary);
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 0.78rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
}

.preset-btn:hover {
  border-color: var(--border-strong);
  color: var(--text-primary);
}

.preset-btn.active {
  background: var(--status-committed-bg);
  border-color: var(--status-committed-border);
  color: var(--status-committed-text);
}

.preset-num {
  font-family: ui-monospace, Consolas, monospace;
  font-size: 0.7rem;
  font-weight: 700;
  opacity: 0.75;
}

.last-op-indicator {
  display: flex;
  align-items: center;
  gap: 6px;
}

.current-op-code {
  font-size: 0.8rem;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 4px;
  background: var(--bg-subtle);
  border: 1px solid var(--border-strong);
  color: var(--text-primary);
}

.controls-row {
  display: grid;
  grid-template-columns: 1fr 230px auto;
  gap: 10px;
  align-items: end;
}

.field-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.field-group label {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-secondary);
}

.field-group input {
  width: 100%;
  background: var(--bg-input);
  border: 1px solid var(--border-color);
  color: var(--text-primary);
  padding: 7px 10px;
  border-radius: 5px;
  font-size: 0.85rem;
  outline: none;
  transition: border-color 0.15s ease;
}

.field-group input:focus {
  border-color: var(--accent-primary);
}

.buttons-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 34px;
  padding: 0 13px;
  border-radius: 5px;
  font-size: 0.82rem;
  font-weight: 600;
  border: 1px solid transparent;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.15s ease;
}

.btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.btn-neutral {
  background: var(--bg-subtle);
  border-color: var(--border-strong);
  color: var(--text-primary);
}

.btn-neutral:hover:not(:disabled) {
  background: var(--border-color);
}

.btn-primary {
  background: var(--accent-primary);
  color: #ffffff;
}

.btn-primary:hover:not(:disabled) {
  background: var(--accent-primary-hover);
}

.btn-success {
  background: var(--status-active);
  color: #ffffff;
}

.btn-success:hover:not(:disabled) {
  filter: brightness(0.95);
}

.btn-warning {
  background: var(--status-delay);
  color: #ffffff;
}

.error-alert {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 10px;
  border-radius: 5px;
  background: var(--status-aborted-bg);
  border: 1px solid var(--status-aborted-border);
  color: var(--status-aborted-text);
  font-size: 0.8rem;
  font-weight: 500;
}

@media (max-width: 1080px) {
  .controls-row {
    grid-template-columns: 1fr;
  }
  .buttons-group {
    flex-wrap: wrap;
  }
}
</style>

