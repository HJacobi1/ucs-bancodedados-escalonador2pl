<template>
  <div class="workspace-shell">
    <!-- Top Bar / Header -->
    <header class="topbar">
      <div class="brand-group">
        <div class="brand-icon">
          <Database :size="18" />
        </div>
        <div class="brand-text">
          <h1>Simulador de Escalonador 2PL Strict</h1>
          <span class="brand-subtitle">
            Controle de Concorrência · Tabela de Locks · Fila de Delay · Resolução de Deadlock
          </span>
        </div>
      </div>

      <div class="topbar-meta">
        <div
          class="sim-state-badge"
          :class="scheduler.isFinished ? 'state-done' : 'state-running'"
        >
          <CheckCircle2 v-if="scheduler.isFinished" :size="14" />
          <Activity v-else :size="14" />
          <span>{{ scheduler.isFinished ? "Concluído" : "Em Execução" }}</span>
        </div>

        <div class="step-counter mono">
          <span class="step-label">PASSO</span>
          <strong>{{ String(scheduler.stepCount).padStart(2, "0") }}</strong>
        </div>

        <button
          type="button"
          class="theme-toggle-btn"
          :title="
            theme === 'dark'
              ? 'Alternar para Modo Claro (Light)'
              : 'Alternar para Modo Escuro (Dark)'
          "
          @click="toggleTheme"
        >
          <Sun v-if="theme === 'dark'" :size="15" />
          <Moon v-else :size="15" />
          <span>{{ theme === "dark" ? "Light" : "Dark" }}</span>
        </button>
      </div>
    </header>

    <!-- Barra de Configuração e Controles -->
    <ControlPanel
      v-model:hi-input="hiInput"
      v-model:db-input="dbInput"
      :is-finished="scheduler.isFinished"
      :is-playing="isPlaying"
      :error-msg="errorMsg"
      :active-preset="activePreset"
      :current-op="scheduler.currentOp"
      @init="handleManualInit"
      @step="stepForward"
      @toggle-play="toggleAutoPlay"
      @load-preset="loadPreset"
    />

    <!-- Área Principal do Dashboard (Fullscreen Grid) -->
    <main class="workspace-grid">
      <!-- Coluna Esquerda: Filas (HI, Delay, HF) + Console de Log -->
      <section class="workspace-col col-left">
        <QueuesView
          v-model:show-lock-ops="showLockOpsInHF"
          :hi="scheduler.hi"
          :delay-queue="scheduler.delayQueue"
          :hf="scheduler.hf"
        />

        <ExecutionLog :logs="scheduler.logs" />
      </section>

      <!-- Coluna Direita: Threads + Lock Table / DB / Wait-For Graph -->
      <section class="workspace-col col-right">
        <ThreadsStatus :transactions="scheduler.transactions" />

        <LockTableView
          :lock-manager="scheduler.lockManager"
          :db="scheduler.db"
        />
      </section>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import { Database, Activity, CheckCircle2, Sun, Moon } from "lucide-vue-next";
import { Scheduler } from "./core/Scheduler.js";
import ControlPanel from "./components/ControlPanel.vue";
import QueuesView from "./components/QueuesView.vue";
import ThreadsStatus from "./components/ThreadsStatus.vue";
import LockTableView from "./components/LockTableView.vue";
import ExecutionLog from "./components/ExecutionLog.vue";

const hiInput = ref("r1(x), r2(y), w1(y=150), w2(x=250), c1, c2");
const dbInput = ref('{"x": 100, "y": 200}');
const showLockOpsInHF = ref(true);
const errorMsg = ref("");
const isPlaying = ref(false);
const activePreset = ref(3);
const theme = ref(localStorage.getItem("sim2pl-theme") || "dark");
let playInterval = null;

const scheduler = ref(new Scheduler({ x: 100, y: 200 }, hiInput.value));

function applyTheme(newTheme) {
  theme.value = newTheme;
  document.documentElement.setAttribute("data-theme", newTheme);
  localStorage.setItem("sim2pl-theme", newTheme);
}

function toggleTheme() {
  applyTheme(theme.value === "dark" ? "light" : "dark");
}

function initSimulation() {
  stopAutoPlay();
  errorMsg.value = "";
  try {
    const parsedDb = JSON.parse(dbInput.value);
    scheduler.value = new Scheduler(parsedDb, hiInput.value);
  } catch (err) {
    errorMsg.value = err.message || "Erro ao interpretar os dados de entrada.";
  }
}

function handleManualInit() {
  initSimulation();
}

function stepForward() {
  if (!scheduler.value.isFinished) {
    scheduler.value.nextStep();
    if (scheduler.value.isFinished) {
      stopAutoPlay();
    }
  }
}

function toggleAutoPlay() {
  if (isPlaying.value) {
    stopAutoPlay();
  } else {
    isPlaying.value = true;
    playInterval = setInterval(() => {
      if (scheduler.value.isFinished) {
        stopAutoPlay();
      } else {
        stepForward();
      }
    }, 900);
  }
}

function stopAutoPlay() {
  isPlaying.value = false;
  if (playInterval) {
    clearInterval(playInterval);
    playInterval = null;
  }
}

function loadPreset(presetId) {
  activePreset.value = presetId;
  dbInput.value = '{"x": 100, "y": 200}';
  if (presetId === 1) {
    hiInput.value = "r1(x), r2(x), w1(y=50), c1, c2";
  } else if (presetId === 2) {
    hiInput.value = "r1(x), w2(x=30), w1(x=20), c1, c2";
  } else if (presetId === 3) {
    hiInput.value = "r1(x), r2(y), w1(y=150), w2(x=250), c1, c2";
  }
  initSimulation();
}

onMounted(() => {
  applyTheme(theme.value);
});

onUnmounted(() => {
  stopAutoPlay();
});
</script>
