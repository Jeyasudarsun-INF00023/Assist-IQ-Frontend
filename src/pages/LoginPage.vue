<template>
  <div class="login-container">
    <div class="login-card">
      <!-- Top Banner SVG -->
      <div class="banner-section">
  <div ref="lottieContainer" class="lottie-box"></div>
</div>

      <!-- Welcome Content -->
      <div class="content-section">
        <h1 class="welcome-title">Welcome to Assist IQ</h1>
        <p class="welcome-desc">
          Simplify device management with an AI assistant<br />
          Let's get started
        </p>

        <!-- Google Sign-In Button -->
        <div class="google-signin-btn-wrapper">
          <div class="custom-google-btn">
            <img src="/Symbol.svg.svg" alt="Google" class="google-icon" />
            <span class="btn-text">Sign In with Google</span>
          </div>
          <div id="google-btn-container" class="hidden-google-btn"></div>
        </div>

        <!-- Footer Text -->
        <p class="footer-text">
          By continuing, you agree to our Terms & Privacy Policy
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted,ref } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import lottie from 'lottie-web'

const router = useRouter()
const lottieContainer = ref(null)

const decodeJwt = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error decoding JWT:', error);
    return null;
  }
}

const handleCredentialResponse = async (response) => {
  try {
    const payload = decodeJwt(response.credential);
    if (!payload) return;

    const googleUser = {
      name: payload.name,
      email: payload.email,
      picture: payload.picture
    }

    // Call the backend to connect/register the account
    const res = await axios.post('http://localhost:8000/auth/login', googleUser)
    
    if (res.data.success) {
      localStorage.setItem('isLoggedIn', 'true')
      localStorage.setItem('user', JSON.stringify(res.data.user))
      router.push('/dashboard')
    }
  } catch (error) {
    console.error('Login failed:', error)
  }
}

onMounted(() => {
  // Load Lottie animation
  lottie.loadAnimation({
    container: lottieContainer.value,
    path: '/Flow 2.json',
    renderer: 'svg',
    loop: true,
    autoplay: true
  });

  initGoogleSignIn();
});

const initGoogleSignIn = () => {
  /* global google */
  if (typeof google !== 'undefined' && google.accounts) {
    google.accounts.id.initialize({
      client_id: "496269258666-156t65qcqtrmul6h3j57ej780koc79uo.apps.googleusercontent.com", 
      callback: handleCredentialResponse
    });
    google.accounts.id.renderButton(
      document.getElementById("google-btn-container"),
      { 
        theme: "outline", 
        size: "large", 
        shape: "pill",
        width: 360,
        text: "signin_with"
      }
    );
  } else {
    // Retry if script not loaded yet
    setTimeout(initGoogleSignIn, 100);
  }
}
</script>

<style scoped>
.login-container {
  height: 100vh;
  width: 100vw;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  background-image: url('/Assist IQ (9).jpg');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  font-family: 'Manrope', sans-serif;
}

.login-card {
  width: 430px;
  background: white;
  border-radius: 24px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.banner-section {
  width: 100%;
  padding: 7px 7px 0 7px;   /* Removed bottom padding */
  display: flex;
  align-items: center;
  justify-content: center;
}
.banner-img {
  width: 100%;
  height: auto;
  border-radius: 16px;
  object-fit: contain;
}

.content-section {
  padding: 8px 36px 24px 36px; /* Reduced top padding from 32px to 8px */
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.welcome-title {
  font-size: 28px;
  font-weight: 700;
  color: #414141;
  margin: 0 0 16px 0;
  letter-spacing: 0%;
  margin-top: -30px;
}

.welcome-desc {
  font-size: 15px;
  color: #848484;
  line-height: 1.6;
  margin: 0 0 40px 0;
  font-weight: 400;
  margin-top: -10px;
}

.google-signin-btn-wrapper {
  position: relative;
  width: 100%;
  max-width: 360px;
  height: 52px;
  margin-bottom: 24px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.custom-google-btn {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: #f8f9fa;
  border-radius: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 0 24px;
  cursor: pointer;
  pointer-events: none;
  z-index: 1;
  transition: all 0.2s ease;
}

.google-icon {
  width: 22px;
  height: 22px;
  object-fit: contain;
}

.btn-text {
  font-size: 16px;
  font-weight: 500;
  color: #1a1a1a;
  font-family: 'Manrope', sans-serif;
}

.hidden-google-btn {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0.01;
  z-index: 2;
  cursor: pointer;
}

.google-signin-btn-wrapper:hover .custom-google-btn {
  background-color: #f1f3f4;
}

.footer-text {
  font-size: 14px;
  color: #b5b5b5;
  margin: 0;
  font-weight: 500;
  line-height: 1.5;
  margin-bottom: 10px;
}
.lottie-box {
  width: 100%;
  max-width: 360px;
  height: 220px;
}
</style>
