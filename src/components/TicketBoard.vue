<template>
  <q-page class="q-pa-lg page-background">
    <!-- Filters -->
    <div class="row items-center q-mb-xl q-col-gutter-md">
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
          bg-color="white"
          class="filter-select"
          :display-value="priority === 'All' ? 'Priority' : priority"
          behavior="menu"
          style="min-width: 130px"
        >
          <template v-slot:append>
            <q-icon name="keyboard_arrow_down" size="xs" />
          </template>
        </q-select>
      </div>
      
      <div class="col-auto">
        <q-select 
          v-model="type" 
          :options="['All','App Installation','Software Update','Account Recovery']" 
          outlined
          rounded
          dense 
          bg-color="white"
          class="filter-select"
          :display-value="type === 'All' ? 'Type' : type"
          behavior="menu"
          style="min-width: 130px"
        >
          <template v-slot:append>
            <q-icon name="keyboard_arrow_down" size="xs" />
          </template>
        </q-select>
      </div>

      <q-space />

      <div class="col-auto">
        <router-link to="/dashboard/chat">
          <q-btn unelevated rounded color="primary" label="Start Chat" class="start-chat-btn" />
        </router-link>
      </div>
    </div>

    <div class="row q-col-gutter-lg">
      <div v-for="(col, key) in columnDefs" :key="key" class="col-12 col-md-3">
        <div class="column-container">
          <div class="column-header q-mb-md">
            <div class="row items-center">
              <div :class="['status-dot', col.dotClass]"></div>
              <span class="text-weight-bold">{{ col.label }}</span>
              <q-space />
              <span class="count">{{ columns[key].length.toString().padStart(2,'0') }}</span>
            </div>
          </div>
          
          <div class="column-content">
            <div v-if="columns[key].length === 0" class="flex flex-center q-pa-lg" style="min-height: 200px;">
              <NoResult width="150px" height="150px" />
            </div>
            <div v-for="t in columns[key]" :key="t.id" class="ticket-card q-mb-md relative-position">
              <div class="row items-center justify-between q-mb-sm">
                <div class="text-caption text-grey-5 text-weight-bold" style="font-size: 14px;">T - {{ t.id.toString().padStart(2, '0') }}</div>
                <div class="row items-center">
                  <div :class="['priority-badge q-mr-sm', getPriorityClass(derivedPriority(t))]" style="font-size: 10px; padding: 2px 8px; border-radius: 4px;">
                    {{ derivedPriority(t) }}
                  </div>
                  <q-btn flat round dense icon="more_horiz" color="grey-9">
                    <q-menu auto-close class="status-menu" anchor="bottom right" self="top right" :offset="[0,8]">
                      <q-list style="min-width: 180px">
                        <q-item clickable v-close-popup @click="setStatus(t.id, 'In Progress')" v-if="!t.status || t.status === 'Open' || t.status === 'To Do'">
                          <q-item-section>In Progress</q-item-section>
                        </q-item>
                        <q-item clickable v-close-popup @click="setStatus(t.id, 'Resolved')" v-if="t.status === 'In Progress'">
                          <q-item-section>Resolved</q-item-section>
                        </q-item>
                        <q-item clickable v-close-popup @click="setStatus(t.id, 'Open')" v-if="t.status === 'Resolved'">
                          <q-item-section>Reopen Ticket</q-item-section>
                        </q-item>
                        <q-item clickable v-close-popup @click="setStatus(t.id, 'Rejected')" v-if="t.status === 'To Do' || t.status === 'Open' || t.status === 'In Progress'">
                          <q-item-section>Reject Ticket</q-item-section>
                        </q-item>
                        <q-item clickable v-close-popup @click="deleteTicket(t.id)" v-if="t.status === 'Rejected'">
                          <q-item-section>Remove Ticket</q-item-section>
                        </q-item>
                        <q-separator />
                        <q-item clickable v-close-popup @click="showFullTicket(t)">
                          <q-item-section>View Details</q-item-section>
                        </q-item>
                      </q-list>
                    </q-menu>
                  </q-btn>
                </div>
              </div>
              
              <div class="text-h6 text-weight-bold q-mb-xs" style="color:#1a1a1a; font-size: 18px; line-height: 1.2;">{{ t.subject }}</div>
              <div class="text-body2 text-grey-5 q-mb-lg" style="font-size: 15px;">{{ extractEmail(t.sender) }}</div>
              
              <div 
                class="text-body1 text-grey-8 description-text" 
                style="line-height: 1.5; font-size: 16px; white-space: pre-line; cursor: pointer;"
                @click="showFullTicket(t)"
              >
                {{ t.description }}
              </div>
              <div class="row justify-end q-mt-sm">
                <q-btn flat dense no-caps label="More" color="primary" class="text-weight-bold" @click.stop="showFullTicket(t)" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Full Ticket Dialog -->
    <q-dialog v-model="detailsDialog.show">
      <q-card style="width: 600px; max-width: 90vw; border-radius: 20px;">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6 text-weight-bold">Ticket Details (T-{{ detailsDialog.ticket.id.toString().padStart(2, '0') }})</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section class="q-pt-md scroll" style="max-height: 60vh;">
          <div class="row items-center q-mb-md">
            <div :class="['priority-badge q-mr-md', getPriorityClass(derivedPriority(detailsDialog.ticket))]">
              {{ derivedPriority(detailsDialog.ticket) }}
            </div>
            <div class="text-subtitle2 text-grey-7">{{ extractEmail(detailsDialog.ticket.sender) }}</div>
          </div>
          
          <div class="text-h5 text-weight-bold q-mb-md">{{ detailsDialog.ticket.subject }}</div>
          
          <div class="text-body1 text-grey-9" style="white-space: pre-line; line-height: 1.6;">
            {{ detailsDialog.ticket.description }}
          </div>
        </q-card-section>

        <q-card-actions align="right" class="q-pa-md">
          <q-btn unelevated rounded label="Close" color="grey-2" text-color="dark" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'
import NoResult from './NoResult.vue'
const API_URL = process.env.BACKEND_URL || 'http://127.0.0.1:8000' || 'https://assist-iq-backend-2.onrender.com'

const api = axios.create({
  baseURL: API_URL
})

const searchQuery = ref('')
const priority = ref('All')
const type = ref('All')
const tickets = ref([])

const detailsDialog = ref({
  show: false,
  ticket: {}
})

const columnDefs = {
  todo: { label: 'To Do', dotClass: 'bg-primary', actionLabel: 'Start Task', nextStatus: 'In Progress' },
  progress: { label: 'In Progress', dotClass: 'bg-orange', actionLabel: 'Resolve', nextStatus: 'Resolved' },
  resolved: { label: 'Resolved', dotClass: 'bg-green', actionLabel: 'Reject', nextStatus: 'Rejected' },
  rejected: { label: 'Rejected', dotClass: 'bg-red', actionLabel: 'Reopen', nextStatus: 'Open' }
}

async function fetchTickets() {
  const res = await api.get('/tickets')
  tickets.value = res.data || []
}

async function setStatus(id, status) {
  await api.put(`/tickets/${id}/status`, status)
  await fetchTickets()
}

async function deleteTicket(id) {
  if (confirm('Are you sure you want to delete this ticket?')) {
    await api.delete(`/tickets/${id}`)
    await fetchTickets()
  }
}

function showFullTicket(ticket) {
  detailsDialog.value.ticket = ticket
  detailsDialog.value.show = true
}

const filteredTickets = computed(() => {
  const q = searchQuery.value.toLowerCase()
  return tickets.value.filter(t => {
    const matchesSearch = (t.subject || '').toLowerCase().includes(q) || (t.description || '').toLowerCase().includes(q)
    const matchesPriority = priority.value === 'All' || derivedPriority(t) === priority.value
    return matchesSearch && matchesPriority
  })
})

const columns = computed(() => {
  return {
    todo: filteredTickets.value.filter(t => !t.status || t.status === 'Open' || t.status === 'To Do'),
    progress: filteredTickets.value.filter(t => t.status === 'In Progress'),
    resolved: filteredTickets.value.filter(t => t.status === 'Resolved'),
    rejected: filteredTickets.value.filter(t => t.status === 'Rejected')
  }
})

function derivedPriority(t) {
  const s = (t.subject || '').toLowerCase()
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

onMounted(fetchTickets)
</script>

<style scoped>
.page-background {
  background-image: url('/Assist IQ (9).jpg');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  min-height: 100vh;
}

.border-bottom-tabs {
  border-bottom: 1px solid #F0F0F0;
}
.tab-item {
  font-weight: 600;
  font-size: 15px;
  padding: 12px 4px;
  cursor: pointer;
  position: relative;
  margin-right: 24px;
  border-bottom: 2px solid transparent;
  transition: all 0.2s;
}
.tab-item.active {
  color: #4F37FD;
  border-bottom: 2px solid #4F37FD;
}

.column-container {
  background: #FFFFFF;
  border-radius: 24px;
  padding: 16px;
  min-height: 70vh;
  border: 1px solid #F0F0F0;
}

.column-header { 
  font-size: 16px; 
  color: #1a1a1a;
  padding: 0 8px;
}

.status-dot { 
  width: 8px; 
  height: 8px; 
  border-radius: 50%; 
  margin-right: 10px; 
}

.count { 
  color: #4F37FD; 
  font-weight: 700; 
  font-size: 14px;
  padding: 2px 8px;
  border-radius: 8px;
}

.status-menu {
  background: #FFFFFF;
  border-radius: 16px;
  box-shadow: 0 12px 40px rgba(93,95,239,0.15);
  padding: 6px 0;
}

.status-menu .q-item {
  font-size: 14px;
  font-weight: 600;
  padding: 10px 16px;
}

.status-menu .q-item:hover {
  background: #F8FAFC;
}

.status-menu .q-separator {
  margin: 4px 0;
}

.ticket-card { 
  background: #F9F9F9; 
  border-radius: 20px; 
  padding: 24px; 
  border: 1px solid #F0F0F0;
  transition: all 0.3s ease;
  width: 100%;
}

.ticket-card:hover {
  box-shadow: 0 10px 30px rgba(0,0,0,0.05);
  transform: translateY(-2px);
}

.description-text {
  display: -webkit-box;
  -webkit-line-clamp: 4;
  line-clamp: 4;
  -webkit-box-orient: vertical;  
  overflow: hidden;
}

.priority-badge {
  font-weight: 700;
  font-size: 11px;
  padding: 4px 12px;
  border-radius: 8px;
}

.bg-red-1 { background-color: #FFF5F5 !important; color: #E53E3E !important; }
.bg-orange-1 { background-color: #FFF9F2 !important; color: #DD6B20 !important; }
.bg-purple-1 { background-color: #F3F4FF !important; color: #5D5FEF !important; }

.action-btn { 
  background: #F8F7FF; 
  color: #4F37FD; 
  text-transform: none; 
  font-weight: 600; 
  border-radius: 12px;
  padding: 10px;
}

.action-btn:hover {
  background: #ECE9FF;
}

.start-chat-btn {
  padding: 8px 20px;
  font-weight: 700;
  text-transform: none;
  font-size: 14px;
  border-radius: 30px;
}

.search-input :deep(.q-field__control), 
.filter-select :deep(.q-field__control) {
  border-radius: 24px !important;
  padding-left: 16px;
  padding-right: 8px;
}

.filter-select :deep(.q-field__native),
.filter-select :deep(.q-field__prefix),
.filter-select :deep(.q-field__label) {
  font-weight: 500;
  color: #1a1a1a;
}

.empty-column {
  border: 2px dashed #F0F0F0;
  border-radius: 20px;
  margin-top: 8px;
}
</style>