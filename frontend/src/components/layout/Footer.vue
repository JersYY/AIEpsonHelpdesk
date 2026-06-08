<template>
  <footer class="app-footer">
    <div class="footer-decoration"></div>
    <div class="footer-inner">
      <div class="footer-about">
        <div class="footer-brand">
          <img src="/logo.png" alt="Epson" class="footer-logo-img" />
          <span class="footer-brand-text">Epson Helpdesk</span>
        </div>
        <p>
          Platform helpdesk internal berbasis AI untuk membantu operator Epson
          menemukan panduan troubleshooting, membuat ticket, dan meneruskan
          laporan teknis dengan riwayat yang rapi.
        </p>
        <div class="footer-socials">
          <div class="social-icon"><i class="fa-solid fa-headset"></i></div>
          <div class="social-icon"><i class="fa-solid fa-laptop-code"></i></div>
          <div class="social-icon"><i class="fa-solid fa-microchip"></i></div>
        </div>
      </div>

      <nav class="footer-column" aria-label="Footer navigation">
        <h3>Navigation</h3>
        <button type="button" @click="$router.push('/')">
          <span>Home</span> <i class="fa-solid fa-arrow-right-long"></i>
        </button>
        <button type="button" @click="$router.push('/login')">
          <span>Login</span> <i class="fa-solid fa-arrow-right-long"></i>
        </button>
        <button type="button" @click="$router.push('/register')">
          <span>Register</span> <i class="fa-solid fa-arrow-right-long"></i>
        </button>
        <button type="button" @click="$router.push('/pending-approval')">
          <span>Approval Status</span> <i class="fa-solid fa-arrow-right-long"></i>
        </button>
      </nav>

      <div class="footer-column">
        <h3>Contact</h3>
        <p class="footer-contact">
          <i class="fa-regular fa-envelope"></i>
          <span>helpdesk@epson.local</span>
        </p>
        <p class="footer-contact">
          <i class="fa-solid fa-graduation-cap"></i>
          <span>Capstone A5 - Kelompok 6</span>
        </p>
        <p class="footer-contact">
          <i class="fa-solid fa-building-columns"></i>
          <span>Fakultas Ilmu Komputer Universitas Brawijaya</span>
        </p>
      </div>
    </div>

    <div class="footer-credit">
      Developed by <strong>Capstone A5 Kelompok 6</strong> for Epson Helpdesk Capstone Project
    </div>
  </footer>
</template>

<style scoped>
.app-footer {
  background: #0f1014;
  color: #f7f7f8;
  position: relative;
  overflow: hidden;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}

.footer-decoration {
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 2px;
  background: linear-gradient(90deg, transparent, var(--color-primary), #aa3bff, transparent);
  opacity: 0.7;
}

.app-footer::before {
  content: '';
  position: absolute;
  top: -150px;
  left: -150px;
  width: 400px;
  height: 400px;
  background: radial-gradient(circle, rgba(11, 99, 206, 0.08) 0%, transparent 70%);
  pointer-events: none;
}

.app-footer::after {
  content: '';
  position: absolute;
  bottom: -150px;
  right: -150px;
  width: 400px;
  height: 400px;
  background: radial-gradient(circle, rgba(170, 59, 255, 0.05) 0%, transparent 70%);
  pointer-events: none;
}

.footer-inner {
  width: min(1200px, 100%);
  margin: 0 auto;
  padding: 64px 24px;
  display: grid;
  grid-template-columns: 1.5fr 0.8fr 1fr;
  gap: 64px;
  position: relative;
  z-index: 1;
}

.footer-brand {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 24px;
}

.footer-logo-img {
  width: 38px;
  height: 38px;
  object-fit: contain;
  filter: brightness(0) invert(1) drop-shadow(0 0 8px rgba(255, 255, 255, 0.2)) !important;
}

.footer-brand-text {
  font-size: 22px;
  font-weight: 850;
  background: linear-gradient(90deg, #fff, #c5c5d2);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  letter-spacing: -0.5px;
}

.footer-about p {
  max-width: 480px;
  font-size: 15px;
  line-height: 1.8;
  font-weight: 400;
  color: #a1a1aa;
  margin-bottom: 24px;
}

.footer-socials {
  display: flex;
  gap: 12px;
}

.social-icon {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #a1a1aa;
  font-size: 16px;
  transition: all 0.3s ease;
  cursor: pointer;
}

.social-icon:hover {
  background: rgba(79, 156, 255, 0.15);
  border-color: rgba(79, 156, 255, 0.4);
  color: #4f9cff;
  transform: translateY(-4px);
  box-shadow: 0 8px 16px rgba(11, 99, 206, 0.2);
}

.footer-column h3 {
  font-size: 15px;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 24px;
  color: #fff;
  font-weight: 750;
}

.footer-column button {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  max-width: 200px;
  border: none;
  background: transparent;
  color: #a1a1aa;
  font: inherit;
  font-weight: 500;
  cursor: pointer;
  margin-bottom: 16px;
  padding: 0;
  text-align: left;
  transition: all 0.3s ease;
}

.footer-column button i {
  opacity: 0;
  transform: translateX(-10px);
  transition: all 0.3s ease;
  color: #4f9cff;
}

.footer-column button:hover {
  color: #fff;
  transform: translateX(4px);
}

.footer-column button:hover i {
  opacity: 1;
  transform: translateX(0);
}

.footer-contact {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 20px;
  font-weight: 500;
  color: #d9d9e3;
  line-height: 1.5;
  transition: transform 0.3s ease;
}

.footer-contact:hover {
  transform: translateX(4px);
}

.footer-contact i {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #4f9cff;
  background: linear-gradient(135deg, rgba(79, 156, 255, 0.1), rgba(79, 156, 255, 0.02));
  border: 1px solid rgba(79, 156, 255, 0.2);
  flex-shrink: 0;
  font-size: 16px;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(11, 99, 206, 0.1);
}

.footer-contact:hover i {
  background: linear-gradient(135deg, rgba(79, 156, 255, 0.2), rgba(79, 156, 255, 0.05));
  box-shadow: 0 6px 16px rgba(11, 99, 206, 0.2);
  transform: scale(1.05) rotate(5deg);
}

.footer-contact span {
  margin-top: 10px;
}

.footer-credit {
  background: rgba(0, 0, 0, 0.4);
  border-top: 1px solid rgba(255, 255, 255, 0.03);
  color: #71717a;
  text-align: center;
  padding: 24px;
  font-weight: 400;
  font-size: 14px;
  position: relative;
  z-index: 1;
}

.footer-credit strong {
  color: #a1a1aa;
  font-weight: 600;
}

@media (max-width: 960px) {
  .footer-inner {
    grid-template-columns: 1fr;
    gap: 48px;
    padding: 48px 24px;
  }
  .footer-about p {
    max-width: 100%;
  }
}

@media (max-width: 520px) {
  .footer-inner {
    padding: 40px 20px;
  }
  .footer-contact i {
    width: 36px;
    height: 36px;
    font-size: 14px;
  }
  .footer-contact span {
    margin-top: 8px;
    font-size: 14px;
  }
}
</style>
