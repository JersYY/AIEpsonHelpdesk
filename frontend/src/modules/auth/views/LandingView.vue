<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'

import '../../../assets/styles/login.css'
import '../../../assets/styles/shell.css'
import { usePreferencesStore } from '../../../stores/preferences.store'

const router = useRouter()
const preferences = usePreferencesStore()
const menuOpen = ref(false)

const isDark = computed(() => {
  if (preferences.theme === 'dark') return true
  if (preferences.theme === 'light') return false
  return window.matchMedia('(prefers-color-scheme: dark)').matches
})

const toggleTheme = () => {
  preferences.setTheme(isDark.value ? 'light' : 'dark')
}

const closeMenu = () => {
  menuOpen.value = false
}

const go = (path) => {
  closeMenu()
  router.push(path)
}
</script>

<template>
  <main class="landing-page">
    <nav
      v-motion
      :initial="{ opacity: 0, y: -10 }"
      :enter="{ opacity: 1, y: 0, transition: { duration: 260 } }"
      class="landing-nav"
    >
      <button class="landing-brand" @click="router.push('/')">
        <img src="/logo.png" alt="Epson" />
        <span>Epson Helpdesk</span>
      </button>
      <button
        class="landing-menu-button"
        type="button"
        :aria-expanded="menuOpen"
        aria-label="Buka menu"
        @click="menuOpen = true"
      >
        <i class="fa-solid fa-bars"></i>
      </button>
    </nav>

    <Transition name="fade">
      <div v-if="menuOpen" class="landing-menu-backdrop" @click="closeMenu"></div>
    </Transition>

    <Transition name="pop">
      <aside v-if="menuOpen" class="landing-menu-modal" aria-label="Menu navigasi">
        <div class="landing-menu-head">
          <div>
            <strong>Menu Helpdesk</strong>
            <span>Khusus karyawan internal Epson</span>
          </div>
          <button class="landing-menu-close" type="button" aria-label="Tutup menu" @click="closeMenu">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>

        <button class="landing-menu-row" type="button" @click="toggleTheme">
          <span>
            <i :class="isDark ? 'fa-solid fa-moon' : 'fa-solid fa-sun'"></i>
            {{ isDark ? 'Dark mode' : 'Light mode' }}
          </span>
          <span class="theme-switch-track" :class="{ dark: isDark }">
            <span class="theme-switch-thumb">
              <i :class="isDark ? 'fa-solid fa-moon' : 'fa-solid fa-sun'"></i>
            </span>
          </span>
        </button>

        <button class="landing-menu-row" type="button" @click="go('/login')">
          <span>
            <i class="fa-solid fa-right-to-bracket"></i>
            Login Helpdesk
          </span>
          <i class="fa-solid fa-chevron-right"></i>
        </button>

        <button class="landing-menu-row primary" type="button" @click="go('/register')">
          <span>
            <i class="fa-regular fa-id-card"></i>
            Daftar Operator
          </span>
          <i class="fa-solid fa-chevron-right"></i>
        </button>
      </aside>
    </Transition>

    <section class="landing-hero">
      <div
        v-motion
        :initial="{ opacity: 0, y: 18 }"
        :enter="{ opacity: 1, y: 0, transition: { duration: 420 } }"
        class="landing-copy"
      >
        <p class="landing-kicker">Internal Epson Support Desk</p>
        <h1>Bantuan teknis Epson, cepat dan terdokumentasi.</h1>
        <p class="landing-description">
          Ruang kerja internal untuk operator Epson: cari panduan troubleshooting,
          mulai percakapan bantuan, dan eskalasikan ticket dengan riwayat yang rapi.
        </p>
        <div class="landing-actions">
          <button class="btn btn-primary" @click="router.push('/login')">
            <i class="fa-solid fa-right-to-bracket"></i>
            Masuk dengan ID Karyawan
          </button>
          <button class="btn btn-ghost" @click="router.push('/register')">
            <i class="fa-regular fa-id-card"></i>
            Daftar akun operator
          </button>
        </div>
      </div>

      <div
        v-motion
        :initial="{ opacity: 0, y: 24, scale: 0.98 }"
        :enter="{ opacity: 1, y: 0, scale: 1, transition: { duration: 480, delay: 90 } }"
        class="landing-chat"
      >
        <div class="landing-chat-header">
          <i class="fa-regular fa-message"></i>
          Preview percakapan helpdesk
        </div>
        <div class="landing-message ai">
          Halo, tuliskan kendala perangkat Epson yang sedang terjadi di area kerja Anda.
        </div>
        <div class="landing-message user">
          Printer line assembly tidak muncul di jaringan operator.
        </div>
        <div class="landing-message ai">
          Baik. Saya akan susun langkah cek koneksi, IP address, gateway, dan opsi eskalasi bila perlu.
        </div>
        <div class="landing-chat-input">
          <span>Tulis kendala perangkat Epson...</span>
          <i class="fa-solid fa-arrow-up"></i>
        </div>
      </div>
    </section>

    <section class="landing-info" aria-label="Informasi penggunaan">
      <div class="landing-info-section">
        <div class="landing-info-head">
          <p class="landing-kicker">Cara menggunakan</p>
          <h2>Mulai dari chat, lanjutkan dengan ticket bila perlu.</h2>
        </div>

        <div class="landing-guide-grid">
          <article class="landing-info-card">
            <strong>01</strong>
            <h3>Jelaskan kendala</h3>
            <p>Tulis gejala perangkat, lokasi kerja, dan kondisi terakhir yang sudah dicoba.</p>
          </article>
          <article class="landing-info-card">
            <strong>02</strong>
            <h3>Ikuti panduan teknis</h3>
            <p>Gunakan langkah troubleshooting dari knowledge base internal Epson.</p>
          </article>
          <article class="landing-info-card">
            <strong>03</strong>
            <h3>Eskalasi dengan ringkasan</h3>
            <p>Buat ticket saat perlu bantuan helpdesk, lengkap dengan riwayat percakapan.</p>
          </article>
        </div>
      </div>

      <div class="landing-info-section">
        <div class="landing-info-head">
          <p class="landing-kicker">Kemampuan utama</p>
          <h2>Satu tempat untuk mencari solusi, membuat ticket, dan menjaga tindak lanjut tetap jelas.</h2>
        </div>

        <div class="landing-feature-grid">
          <article class="landing-info-card">
            <i class="fa-solid fa-book-open"></i>
            <h3>Knowledge base internal</h3>
            <p>Panduan teknis tersusun berdasarkan kategori masalah printer, scanner, jaringan, firmware, hardware, dan part.</p>
          </article>
          <article class="landing-info-card">
            <i class="fa-solid fa-ticket"></i>
            <h3>Ticket dengan konteks lengkap</h3>
            <p>Riwayat chat ikut terbawa saat eskalasi, sehingga helpdesk dapat memahami gejala tanpa mengulang tanya-jawab dari awal.</p>
          </article>
          <article class="landing-info-card">
            <i class="fa-solid fa-envelope"></i>
            <h3>Ringkasan siap dikirim</h3>
            <p>Summary ticket bisa dikirim melalui email development Mailpit dan dicatat pada Email Logs untuk audit.</p>
          </article>
          <article class="landing-info-card">
            <i class="fa-solid fa-chart-line"></i>
            <h3>Issue populer ikut bergerak</h3>
            <p>Dashboard membaca topik dari chat dan ticket terbaru agar operator melihat kendala yang sedang sering muncul.</p>
          </article>
        </div>
      </div>

      <div class="landing-info-section">
        <div class="landing-info-head">
          <p class="landing-kicker">Informasi akses</p>
          <h2>Khusus employee internal Epson.</h2>
        </div>

        <div class="landing-access-panel">
          <div class="landing-access-intro">
            <i class="fa-solid fa-shield-halved"></i>
            <div>
              <h3>Akses internal, data lebih tertata</h3>
              <p>Epson Helpdesk digunakan untuk dukungan operasional internal, bukan portal publik.</p>
            </div>
          </div>

          <div class="landing-access-list">
            <article>
              <strong>Employee ID resmi</strong>
              <span>Login memakai ID Karyawan agar setiap percakapan dan ticket terhubung ke profil operator yang benar.</span>
            </article>
            <article>
              <strong>Approval admin</strong>
              <span>Akun operator baru akan terkunci sampai admin menyetujui akses dari halaman Account Approval.</span>
            </article>
            <article>
              <strong>Riwayat untuk follow-up</strong>
              <span>Chat normal tersimpan supaya ticket, email summary, dan tindak lanjut helpdesk punya konteks lengkap.</span>
            </article>
            <article>
              <strong>Temporary mode</strong>
              <span>Gunakan mode sementara untuk percakapan yang tidak perlu masuk riwayat atau self-learning.</span>
            </article>
          </div>
        </div>
      </div>

      <div class="landing-info-section">
        <div class="landing-info-head">
          <p class="landing-kicker">Informasi operasional</p>
          <h2>Dirancang untuk alur kerja helpdesk harian.</h2>
        </div>

        <div class="landing-extra-grid">
          <article class="landing-info-card">
            <i class="fa-solid fa-clock-rotate-left"></i>
            <h3>Riwayat percakapan mudah dilacak</h3>
            <p>Operator dapat membuka ulang chat terdahulu untuk melihat langkah yang sudah dicoba.</p>
          </article>
          <article class="landing-info-card">
            <i class="fa-solid fa-user-check"></i>
            <h3>Helpdesk melihat konteks ticket</h3>
            <p>Tim helpdesk menerima ringkasan dan history percakapan saat ticket masuk.</p>
          </article>
          <article class="landing-info-card">
            <i class="fa-solid fa-triangle-exclamation"></i>
            <h3>Jawaban AI diberi penanda</h3>
            <p>Jika jawaban tidak memakai knowledge base, sistem memberi catatan agar operator bisa eskalasi bila ragu.</p>
          </article>
          <article class="landing-info-card">
            <i class="fa-solid fa-magnifying-glass-chart"></i>
            <h3>Topik kendala ikut terbaca</h3>
            <p>Popular Issues mengikuti chat dan ticket terbaru agar tim melihat pola kendala yang sering terjadi.</p>
          </article>
        </div>
      </div>
    </section>
  </main>
</template>
