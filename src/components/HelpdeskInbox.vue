<template>
  <q-page class="q-pa-lg page-background">
    <!-- Filters & Search -->
    <div class="row items-center q-mb-lg q-col-gutter-md">
      <div class="col-12 col-md-4">
        <q-input 
          v-model="searchQuery" 
          placeholder="Search Incidents..." 
          outlined 
          rounded
          dense 
          bg-color="white"
          class="search-input"
        >
          <template v-slot:prepend>
            <q-icon name="search" color="grey-5" />
          </template>
        </q-input>
      </div>
      
      <div class="col-auto">
        <q-select 
          v-model="priority" 
          :options="['All','Low','Medium','High']" 
          outlined
          rounded
          dense 
          class="filter-select" 
          bg-color="white"
          :display-value="priority === 'All' ? 'Priority' : priority"
          behavior="menu"
          style="min-width: 130px"
        >
        </q-select>
      </div>
      
      <div class="col-auto">
        <q-select 
          v-model="type" 
          :options="['All','App Installation','Software Update','Account Recovery']" 
          outlined
          rounded
          dense 
          class="filter-select" 
          bg-color="white"
          :display-value="type === 'All' ? 'Type' : type"
          behavior="menu"
          style="min-width: 130px"
        >
        </q-select>
      </div>
      
      <div class="col-auto">
        <q-input 
          v-model="date" 
          placeholder="MM/DD/YYYY" 
          outlined 
          rounded
          dense 
          class="filter-date" 
          bg-color="white"
          style="min-width: 160px"
        >
          <template v-slot:append>
            <q-icon name="calendar_today" color="grey-8" class="cursor-pointer" size="xs">
              <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                <q-date v-model="date" mask="MM/DD/YYYY">
                  <div class="row items-center justify-end">
                    <q-btn v-close-popup label="Close" color="primary" flat />
                  </div>
                </q-date>
              </q-popup-proxy>
            </q-icon>
          </template>
        </q-input>
      </div>

      <q-space />
      <q-btn
        label="Connect Gmail"
        color="primary"
        @click="loginGoogle"
        style="border-radius: 30px;"
        class="q-mr-md"
      />
    </div>

    <!-- Incoming Emails Grid -->
    <div v-if="filteredEmails.length === 0" class="flex flex-center q-pa-xl">
      <NoResult />
    </div>

    <div class="row q-col-gutter-lg">
      <!-- Combine emails and tickets for the view or just show emails as 'Incoming' -->
      <!-- The design shows mixed items, but let's stick to emails for Inbox and tickets for Board usually. 
           However, the previous code showed both. I will show incoming emails first as cards. -->
           
      <div v-for="email in filteredEmails" :key="email.id" class="col-12 col-sm-6 col-md-4">
        <q-card flat class="inbox-card">
          <q-card-section class="q-pa-md">
            <div class="row items-center justify-between q-mb-md">
              <div :class="['priority-badge', getPriorityClass(derivedPriority(email))]">
                {{ derivedPriority(email) }}
              </div>
              <div class="text-caption text-grey-5" style="font-size: 11px;">{{ email.timestamp }}</div>
            </div>
            
            <div class="text-subtitle1 text-weight-bold q-mb-xs text-dark">{{ email.subject }}</div>
            <div class="text-caption text-grey-6 q-mb-sm">{{ extractEmail(email.sender) }}</div>
            
            <div class="text-body2 text-grey-7 ellipsis-3-lines" style="min-height: 4.5em; line-height: 1.5;">
              {{ email.body }}
            </div>
          </q-card-section>

          <q-card-actions class="q-px-md q-pb-md q-pt-none">
            <div class="row items-center no-wrap full-width actions-row">
              <q-btn 
                unelevated 
                class="create-ticket-btn ticket-pill" 
                label="Create Ticket" 
                @click="createTicket(email)" 
              />
              <q-btn flat dense icon="more_vert" class="more-btn" color="dark">
                <q-menu auto-close class="inbox-menu" anchor="top right" self="top right" :offset="[0,8]">
                  <q-list style="min-width: 180px">
                    <q-item clickable v-close-popup @click="createTicket(email)">
                      <q-item-section>Create Ticket</q-item-section>
                    </q-item>
                    <q-item clickable v-close-popup @click="viewEmail(email)">
                      <q-item-section>View Details</q-item-section>
                    </q-item>
                    <q-item clickable v-close-popup @click="removeEmail(email.id)" class="text-negative">
                      <q-item-section>Remove</q-item-section>
                    </q-item>
                  </q-list>
                </q-menu>
              </q-btn>
            </div>
          </q-card-actions>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import api from '../api'
import NoResult from './NoResult.vue'

const searchQuery = ref('')
const priority = ref('All')
const type = ref('All')
const date = ref('')

const incomingEmails = ref([])
const tickets = ref([])
let refreshInterval = null
const tokenClient = ref(null)
const accessToken = ref(null)
function loginGoogle() {
  tokenClient.value?.requestAccessToken()
}
const INBOX_CACHE_KEY = 'helpdesk_inbox_emails'
const TICKETS_CACHE_KEY = 'helpdesk_inbox_tickets'

function initTokenClient() {
  if (window.google?.accounts?.oauth2) {
    tokenClient.value = window.google.accounts.oauth2.initTokenClient({
      client_id: '496269258666-156t65qcqtrmul6h3j57ej780koc79uo.apps.googleusercontent.com',
      scope: 'https://www.googleapis.com/auth/gmail.readonly',
      callback: (resp) => {
        if (resp.access_token) {
          accessToken.value = resp.access_token
          fetchEmails()
        }
      }
    })
  } else {
    setTimeout(initTokenClient, 100)
  }
}

async function fetchEmails() {
  try {
    if (!accessToken.value) return

    const res = await api.get(`/emails/check?token=${accessToken.value}`)

    if (res.data && res.data.length) {
      incomingEmails.value = res.data
    }

  } catch (err) {
    console.error('Fetch email error:', err)
  }
}
async function createTicket(email) {
  await api.post('/tickets', {
    subject: email.subject,
    sender: email.sender,
    description: email.body
  })
  incomingEmails.value = incomingEmails.value.filter(e => e.id !== email.id)
  await fetchTickets()
}
function viewEmail(email) {
  console.log('Email details', email)
}
function removeEmail(id) {
  incomingEmails.value = incomingEmails.value.filter(e => e.id !== id)
}
async function fetchTickets() {
  const res = await api.get('/tickets')
  tickets.value = res.data || []
}

function hydrateCache() {
  try {
    const cachedEmails = JSON.parse(localStorage.getItem(INBOX_CACHE_KEY) || '[]')
    const cachedTickets = JSON.parse(localStorage.getItem(TICKETS_CACHE_KEY) || '[]')
    if (Array.isArray(cachedEmails)) incomingEmails.value = cachedEmails
    if (Array.isArray(cachedTickets)) tickets.value = cachedTickets
  } catch {
    localStorage.removeItem(INBOX_CACHE_KEY)
    localStorage.removeItem(TICKETS_CACHE_KEY)
  }
}

watch(incomingEmails, (val) => {
  localStorage.setItem(INBOX_CACHE_KEY, JSON.stringify(val))
}, { deep: true })

watch(tickets, (val) => {
  localStorage.setItem(TICKETS_CACHE_KEY, JSON.stringify(val))
}, { deep: true })

const filteredEmails = computed(() => {
  const q = searchQuery.value.toLowerCase()
  return incomingEmails.value.filter(e =>
    e.subject.toLowerCase().includes(q) || e.body.toLowerCase().includes(q)
  )
})
const filteredTickets = computed(() => {
  const q = searchQuery.value.toLowerCase()
  return tickets.value.filter(t =>
    (t.subject || '').toLowerCase().includes(q) ||
    (t.description || '').toLowerCase().includes(q)
  )
})

function derivedPriority(email) {
  const s = (email.subject || '').toLowerCase()
  if (s.includes('recover') || s.includes('password')) return 'Low'
  if (s.includes('update')) return 'Medium'
  if (s.includes('install')) return 'High'
  return 'Low'
}
function getPriorityClass(p) {
  if (p === 'High') return 'bg-red-1'
  if (p === 'Medium') return 'bg-orange-1'
  return 'bg-purple-1'
}

function extractEmail(sender) {
  if (!sender) return ''
  const match = sender.match(/<(.+?)>/)
  return match ? match[1] : sender
}

onMounted(async () => {
  hydrateCache()

  if (!document.querySelector('script[src="https://accounts.google.com/gsi/client"]')) {
    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.onload = initTokenClient
    document.head.appendChild(script)
  } else {
    initTokenClient()
  }

  await fetchTickets()

  refreshInterval = setInterval(() => {
    fetchEmails()
  }, 10000)
})

onUnmounted(() => {
  // Clear the interval when the component is unmounted
  if (refreshInterval) {
    clearInterval(refreshInterval)
    refreshInterval = null
  }
})
</script>

<style scoped>
.page-background {
  background-image: url('/Assist IQ (9).jpg');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  min-height: 100vh;
}

.inbox-card {
  border-radius: 24px;
  background-color: white;
  border: 1px solid rgba(0, 0, 0, 0.03);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.02);
  transition: transform 0.2s, box-shadow 0.2s;
}

.inbox-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.05);
}

.priority-badge {
  padding: 4px 12px;
  border-radius: 8px;
  font-size: 11px;
  font-weight: 700;
  text-transform: capitalize;
}

.bg-red-1 { background-color: #FFF5F5 !important; color: #E53E3E !important; }
.bg-orange-1 { background-color: #FFF9F2 !important; color: #DD6B20 !important; }
.bg-purple-1 { background-color: #F3F4FF !important; color: #5D5FEF !important; }

.create-ticket-btn {
  background: linear-gradient(90deg, #5D5FEF 0%, #7A5CFF 100%);
  color: #FFFFFF;
  border-radius: 30px;
  font-weight: 700;
  text-transform: none;
  padding: 12px 18px;
}
.ticket-pill { flex: 1; margin-right: 12px; }

.actions-row { gap: 8px; }

.search-input :deep(.q-field__control),
.filter-select :deep(.q-field__control),
.filter-date :deep(.q-field__control) {
  border-radius: 24px !important;
}

.filter-select :deep(.q-field__append) { padding-left: 0; }

.inbox-menu { background: #FFFFFF; border-radius: 16px; box-shadow: 0 12px 40px rgba(93,95,239,0.15); padding: 6px 0; }
.inbox-menu .q-item { font-size: 14px; font-weight: 600; padding: 10px 16px; }
.inbox-menu .q-item:hover { background: #F8FAFC; }
.more-btn { background: #FFFFFF; border: 1px solid #EAEAEA; box-shadow: 0 4px 12px rgba(0,0,0,0.06); color: #111827; border-radius: 12px; width: 36px; height: 36px; }
.gradient-btn { min-width: 180px; }
</style>