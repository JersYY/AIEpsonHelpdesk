<template>
  <div
    v-motion
    :initial="{ opacity: 0, y: 8 }"
    :enter="{ opacity: 1, y: 0, transition: { duration: 160 } }"
    class="msg ai"
  >
    <div class="msg-avatar ai"><img src="/logo.png" alt="AI" /></div>
    <div class="msg-body">
      <div class="msg-bubble typing-dots"><span></span><span></span><span></span></div>
    </div>
  </div>
</template>
