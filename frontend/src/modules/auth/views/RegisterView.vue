<script setup>
import { useRouter } from 'vue-router'

import RegisterForm from '../components/RegisterForm.vue'

import '../../../assets/styles/login.css'

const router = useRouter()
</script>

<template>
  <div class="login-page">
    <button class="btn btn-ghost login-back" @click="router.push('/')">
      <i class="fa-solid fa-arrow-left"></i>
      <span>Back</span>
    </button>

    <div
      v-motion
      :initial="{ opacity: 0, y: 18, scale: 0.98 }"
      :enter="{ opacity: 1, y: 0, scale: 1, transition: { duration: 360 } }"
      class="auth-motion-wrap"
    >
      <RegisterForm />
    </div>
  </div>
</template>
