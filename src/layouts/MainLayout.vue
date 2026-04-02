<template>
  <q-layout view="lHh Lpr lFf" class="main-layout">
    <q-drawer
      v-model="leftDrawerOpen"
      show-if-above
      :mini="!isHovered"
      @mouseenter="isHovered = true"
      @mouseleave="isHovered = false"
      :width="400"
      :mini-width="50"
      :breakpoint="400"
      class="sidebar-bg"
      behavior="desktop"
    >
      <div class="full-height column relative-position z-top q-pt-lg q-pb-xl q-px-md">
        <!-- Top Logo -->
        <div class="sidebar-logo q-mb-xl">
          <q-img src="/Group 1000003518.svg" class="sidebar-logo-img" fit="contain" />
        </div>

        <!-- Navigation Icons with Labels -->
        <div class="column q-gutter-y-md full-width">
          <!-- Support Desk -->
          <q-btn 
            flat 
            no-caps
            :align="isHovered ? 'left' : 'center'"
            :class="[
              'sidebar-nav-btn q-pa-none q-ma-none', 
              (route.path.includes('/helpdesk') || route.path.includes('/ticket-board')) ? 'active' : ''
            ]"
            to="/dashboard/helpdesk"
          >
            <div class="row items-center no-wrap" :class="isHovered ? 'full-width' : 'justify-center'">
              <layout-grid-icon :size="24" />
              <span v-if="isHovered" class="q-ml-lg nav-label fade-in">Support Desk</span>
            </div>
          </q-btn>

          <!-- Work Space -->
          <q-btn 
            flat 
            no-caps
            :align="isHovered ? 'left' : 'center'"
            :class="['sidebar-nav-btn q-pa-none q-ma-none', route.path.includes('/softwareinstaller') ? 'active' : '']"
            to="/dashboard/softwareinstaller"
          >
            <div class="row items-center no-wrap" :class="isHovered ? 'full-width' : 'justify-center'">
              <message-circle-more-icon :size="24" />
              <span v-if="isHovered" class="q-ml-lg nav-label fade-in">Work Space</span>
            </div>
          </q-btn>

          <!-- Onboarding -->
          <q-btn 
            flat 
            no-caps
            :align="isHovered ? 'left' : 'center'"
            :class="['sidebar-nav-btn q-pa-none q-ma-none', route.path.includes('/onboarding') ? 'active' : '']"
            to="/dashboard/onboarding"
          >
            <div class="row items-center no-wrap" :class="isHovered ? 'full-width' : 'justify-center'">
              <UsersRoundIcon :size="24" />
              <span v-if="isHovered" class="q-ml-lg nav-label fade-in">Team</span>
            </div>
          </q-btn>

          <!-- Manage Asset -->
          <q-btn 
            flat 
            no-caps
            :align="isHovered ? 'left' : 'center'"
            :class="['sidebar-nav-btn q-pa-none q-ma-none', route.path.includes('/manage-assets') ? 'active' : '']"
            to="/dashboard/manage-assets"
          >
            <div class="row items-center no-wrap" :class="isHovered ? 'full-width' : 'justify-center'">
              <laptop-minimal-icon :size="24" />
              <span v-if="isHovered" class="q-ml-lg nav-label fade-in">Manage Asset</span>
            </div>
          </q-btn>

          <div v-if="user" class="q-mt-md q-mb-lg cursor-pointer relative-position full-width">
            <div class="row items-center no-wrap">
              <q-avatar size="32px" class="user-avatar-shadow">
                <img :src="user.picture || '/Group 1000003518.svg'" alt="User Avatar" />
              </q-avatar>
              <div v-if="isHovered" class="column q-ml-md fade-in">
                <div class="text-subtitle2 text-weight-bold text-black">{{ user.name || 'Guest' }}</div>
                <div class="text-caption text-grey-6">Profile & Settings</div>
              </div>
            </div>
            <q-menu anchor="top right" self="bottom left" :offset="[10, 0]">
              <q-list style="min-width: 150px">
                <q-item class="q-px-md q-py-sm">
                  <q-item-section>
                    <div class="text-weight-bold">{{ user.name || 'Guest' }}</div>
                    <div class="text-caption text-grey-7">{{ user.email }}</div>
                  </q-item-section>
                </q-item>
                <q-separator />
                <q-item clickable v-close-popup @click="logout">
                  <q-item-section side>
                    <q-icon name="logout" size="xs" />
                  </q-item-section>
                  <q-item-section>Log Out</q-item-section>
                </q-item>
              </q-list>
            </q-menu>
          </div>
        </div>
      </div>
    </q-drawer>

    <q-header flat v-if="showHeader" style="background: #F6F7F9; border-radius: 0 10px 0 0; position: absolute; top: 0; left: 70px; right: 0; z-index: 10;">
      <q-toolbar class="q-px-lg" :style="{ height: route.path.includes('/manage-assets') ? '80px' : '110px' }">
        <div class="column full-width">
          <div class="row items-center">
            <q-btn 
              v-if="route.path.includes('/manage-assets') && (assetView === 'add' || assetView === 'detail')"
              flat 
              round 
              icon="arrow_back" 
              color="black" 
              @click="assetView = 'list'"
              class="q-mr-md"
            />
            <div class="text-h5 text-weight-bold text-black self-center">
              {{ getPageTitle(route.path) }}
            </div>
          </div>
          <div class="row items-center q-gutter-x-lg" v-if="!route.path.includes('/softwareinstaller') && !route.path.includes('/onboarding') && !route.path.includes('/manage-assets')">
            <q-btn
              flat
              no-caps
              label="Help-desk Inbox"
              :class="['tab-btn', route.path.includes('/helpdesk') ? 'active-tab' : 'text-grey-6']"
              to="/dashboard/helpdesk"
            />
            <q-btn
              flat
              no-caps
              label="Ticket Board"
              :class="['tab-btn', route.path.includes('/ticket-board') ? 'active-tab' : 'text-grey-6']"
              to="/dashboard/ticket-board"
            />
          </div>
        </div>
      </q-toolbar>
    </q-header>

    <q-page-container :style="pageContainerStyle">
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  LayoutGrid as LayoutGridIcon,
  MessageCircleMore as MessageCircleMoreIcon,
  LaptopMinimal as LaptopMinimalIcon,
  UsersRound as UsersRoundIcon
} from 'lucide-vue-next'
import { assetView } from '../store/assetStore'


defineOptions({
  name: 'MainLayout'
})

const route = useRoute()
const router = useRouter()
const leftDrawerOpen = ref(false)
const isHovered = ref(false)

const showHeader = computed(() => {
  return route.path.includes('/helpdesk') || route.path.includes('/ticket-board') || route.path.includes('/manage-assets')
})

const getPageTitle = (path) => {
  if (path.includes('/softwareinstaller')) return 'Work Space'
  if (path.includes('/onboarding')) return 'Onboarding'
  if (path.includes('/manage-assets')) {
    if (assetView.value === 'add') return 'Add Device'
    if (assetView.value === 'detail') return 'Add Asset'
    return 'Manage Assets'
  }
  return 'Support Desk'
}

const pageContainerStyle = computed(() => {
  const base = {
    paddingLeft: '64px',
    paddingRight: '0',
    marginRight: '0',
    background: 'linear-gradient(360deg, #dfeef5, #e8f1f6, #f6f7f9, #f6f7f9)'
  }
  if (route.path.includes('/onboarding') || route.path.includes('/softwareinstaller')) {
    return { ...base, paddingTop: '0' }
  }
  if (route.path.includes('/manage-assets')) {
    return { ...base, paddingTop: '80px' }
  }
  return { ...base, paddingTop: '110px' }
})


const user = ref(null)

const logout = () => {
  localStorage.removeItem('user')
  localStorage.removeItem('isLoggedIn')
  router.push('/')
}

onMounted(() => {
  const storedUser = localStorage.getItem('user')
  if (storedUser) {
    try {
      user.value = JSON.parse(storedUser)
    } catch (e) {
      console.error('Error parsing user data', e)
    }
  }
})
</script>

<style scoped>
.main-layout {
  font-family: 'Manrope', sans-serif;
  background-image: url('/Assist IQ (1).svg');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
 
}

.sidebar-logo {
  position: relative;
  width: 100%;
  height: 160px;
  padding-bottom: 100px;
}

.sidebar-logo q-img,
.sidebar-logo-img {
  position: absolute;
  left: 8px;
  top: 0;
  width: 32px !important;
  height: 32px !important;
  min-width: 32px !important;
  min-height: 32px !important;
  transition: left 0.2s ease-out !important;
}

.sidebar-nav-btn .lucide,
.sidebar-nav-btn .lucide-icon,
.sidebar-nav-btn .q-icon {
  width: 24px !important;
  height: 24px !important;
  min-width: 24px;
  min-height: 24px;
  transition: none !important;
}

:deep(.q-drawer--mini) .sidebar-logo q-img,
:deep(.q-drawer--mini) .sidebar-nav-btn .lucide,
:deep(.q-drawer--mini) .sidebar-nav-btn .lucide-icon,
:deep(.q-drawer--mini) .sidebar-nav-btn .q-icon {
  width: 24px !important;
  height: 24px !important;
}

:deep(.sidebar-bg) {
  background: transparent !important;
  border: none !important;
}

:deep(.sidebar-bg):hover {
    background: linear-gradient(90deg,rgba(255, 255, 255, 1) 0%, rgba(255, 255, 255, 0.9) 65%, rgba(255, 255, 255, 0) 100%) !important;
    backdrop-filter: blur(1.5px);
}

/* ── Blur Backdrop ── */ 
.sidebar-backdrop {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(10px);
  z-index: 0;
  border-right: 1px solid rgba(0, 0, 0, 0.05);
}

.z-top {
  z-index: 1;
}

/* ── Navigation buttons ── */
.sidebar-nav-btn {
  color: #94A3B8;
  border-radius: 16px;
  transition: all 0.3s ease;
  min-height: 56px;
}

.sidebar-nav-btn:hover,
.sidebar-nav-btn.active {
  background-color: transparent !important;
  color: #5D5FEF;
}

.sidebar-nav-btn.active :deep(.q-focus-helper),
.sidebar-nav-btn:hover :deep(.q-focus-helper) {
  display: none !important;
  background: transparent !important;
  opacity: 0 !important;
}

.sidebar-nav-btn :deep(.q-ripple) {
  display: none !important;
}

/* Add background only when expanded */
.q-drawer:not(.q-drawer--mini) .sidebar-nav-btn:hover,
.q-drawer:not(.q-drawer--mini) .sidebar-nav-btn.active,
:deep(.q-drawer) {
  background: transparent;
}

.nav-label {
  font-size: 15px;
  font-weight: 600;
  white-space: nowrap;
  letter-spacing: 0.3px;
}

.fade-in {
  animation: fadeIn 0.6s ease 0.1s forwards;
  opacity: 0;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateX(-10px); }
  to { opacity: 1; transform: translateX(0); }
}

:deep(.q-drawer--mini .z-top) {
  padding-left: 2 !important;
  padding-right: 0 !important;
}

:deep(.q-drawer--mini) .sidebar-logo-img {
  left: 1px;
}

.user-avatar-shadow {
  box-shadow: 0 4px 12px rgba(93, 95, 239, 0.15);
}

/* ── Header tabs ── */
.tab-btn {
  font-size: 16px;
  font-weight: 600;
  padding: 8px 0;
  min-height: auto;
  border-radius: 0;
}

.active-tab {
  color: #5D5FEF;
  border-bottom: 2px solid #5D5FEF;
}

/* Ensure proper alignment in mini mode */
:deep(.q-drawer--mini .sidebar-nav-btn .q-btn__content) {
  justify-content: left !important;
}
</style>