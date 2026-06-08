<script setup>
const props = defineProps({
  title: { type: String, required: true },
  message: { type: String, required: true },
  confirmLabel: { type: String, default: 'Konfirmasi' },
  cancelLabel: { type: String, default: 'Batal' },
  variant: { type: String, default: 'primary' },
  icon: { type: String, default: 'fa-circle-question' },
  busy: { type: Boolean, default: false },
  showCancel: { type: Boolean, default: true },
})

const emit = defineEmits(['confirm', 'cancel'])

const confirmClass = () => props.variant === 'danger' ? 'btn-danger' : 'btn-primary'
</script>

<template>
  <div class="confirm-backdrop" @click.self="!busy && emit('cancel')">
    <section
      v-motion
      :initial="{ opacity: 0, y: 12, scale: 0.98 }"
      :enter="{ opacity: 1, y: 0, scale: 1, transition: { duration: 180 } }"
      class="confirm-modal"
      role="dialog"
      aria-modal="true"
    >
      <div class="confirm-icon" :class="variant">
        <i :class="`fa-solid ${icon}`"></i>
      </div>
      <div class="confirm-copy">
        <h3>{{ title }}</h3>
        <p>{{ message }}</p>
      </div>
      <slot></slot>
      <div class="confirm-actions">
        <button v-if="showCancel" class="btn btn-ghost" :disabled="busy" @click="emit('cancel')">
          {{ cancelLabel }}
        </button>
        <button class="btn" :class="confirmClass()" :disabled="busy" @click="emit('confirm')">
          {{ confirmLabel }}
        </button>
      </div>
    </section>
  </div>
</template>

<style scoped>
.confirm-backdrop {
  position: fixed;
  inset: 0;
  z-index: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 18px;
  background: rgba(0, 0, 0, 0.46);
}
.confirm-modal {
  width: min(420px, 100%);
  max-height: min(88vh, 620px);
  overflow-y: auto;
  border: 1px solid var(--color-border);
  border-radius: 14px;
  background: var(--color-bg);
  color: var(--color-text);
  box-shadow: var(--shadow-md);
  padding: 18px;
}
.confirm-icon {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 14px;
  color: var(--color-primary);
  background: rgba(11, 99, 206, 0.12);
}
.confirm-icon.danger {
  color: var(--color-danger);
  background: rgba(180, 35, 24, 0.12);
}
.confirm-icon.warning {
  color: var(--color-warning);
  background: rgba(245, 158, 11, 0.14);
}
.confirm-icon.success {
  color: var(--color-success);
  background: rgba(43, 187, 126, 0.12);
}
.confirm-copy h3 {
  font-size: 18px;
  line-height: 1.25;
  margin-bottom: 8px;
}
.confirm-copy p {
  color: var(--color-muted);
  line-height: 1.6;
  font-size: 13px;
}
.confirm-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 18px;
}
@media (max-width: 520px) {
  .confirm-backdrop {
    align-items: flex-end;
    padding: 12px;
  }
  .confirm-modal {
    width: 100%;
    border-radius: 16px;
    padding: 16px;
  }
  .confirm-actions .btn {
    width: 100%;
  }
}
</style>
