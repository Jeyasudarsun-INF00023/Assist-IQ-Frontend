<template>
  <div class="assistiq-wrapper">
    <!-- Connection Loading Overlay -->
    <transition name="fade">
      <div v-if="isConnecting" class="connection-loading-overlay">
        <div class="loading-card">
          <div ref="lottieContainer" class="loading-lottie"></div>
          <span class="loading-text">Loading..</span>
        </div>
      </div>
    </transition>

    <!-- Notification Toast -->
    <transition name="toast-fade">
      <div v-if="notification.show" class="notification-toast" :class="notification.type">
        <div class="notification-content">
          <div class="notification-icon">
            <CheckCircle2 v-if="notification.type === 'success'" :size="20" color="#008409" />
            <AlertTriangle v-else-if="notification.type === 'error'" :size="20" color="#CD1C18" />
            <div v-else-if="notification.type === 'warning'" class="warning-icon-wrapper">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F57C00" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="2" y1="12" x2="22" y2="12"></line>
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                <line x1="16" y1="8" x2="20" y2="4" stroke="#F57C00" stroke-width="2"></line>
                <line x1="16" y1="4" x2="20" y2="8" stroke="#F57C00" stroke-width="2"></line>
              </svg>
            </div>
          </div>
          <span class="notification-message">{{ notification.message }}</span>
          <button v-if="notification.action" class="notification-action-btn" @click="notification.action.handler">
            {{ notification.action.label }}
          </button>
        </div>
      </div>
    </transition>

    <div class="content-body">
      <!-- Left Sidebar -->
      <aside :class="['left-sidebar', isSidebarCollapsed ? 'collapsed' : '']">
        <div class="sidebar-header">
          <div class="logo-section" v-if="!isSidebarCollapsed">
            <img src="Group 1000003519.svg" alt="ASSIST IQ" class="main-logo" />
          </div>
          <div class="collapsed-header-content" v-else>
            <img src="Group 1000003518.svg" alt="IQ" class="collapsed-logo-svg" />
          </div>
          
          <q-btn 
            flat 
            dense 
            class="sidebar-toggle-btn"
            @click="isSidebarCollapsed = !isSidebarCollapsed"
          >
            <PanelLeft :size="22" :stroke-width="1.5" />
          </q-btn>
        </div>

        <div class="sidebar-actions">
          <q-btn 
            flat
            dense
            class="sidebar-action-btn"
            :align="isSidebarCollapsed ? 'center' : 'left'"
            @click="resetChat"
          >
            <SquarePen :size="18" :class="isSidebarCollapsed ? '' : 'icon-gap'" />
            <span v-if="!isSidebarCollapsed">New Chat</span>
            <q-tooltip v-if="isSidebarCollapsed">New Chat</q-tooltip>
          </q-btn>
          

          <q-btn 
            flat
            dense
            class="sidebar-action-btn"
            :align="isSidebarCollapsed ? 'center' : 'left'"
            @click="showSearchDialog = true"
          >
            <Search :size="18" :class="isSidebarCollapsed ? '' : 'icon-gap'" />
            <span v-if="!isSidebarCollapsed">Search Chat</span>
            <q-tooltip v-if="isSidebarCollapsed">Search Chat</q-tooltip>
          </q-btn>
        </div>

        <q-separator class="q-my-md" style="opacity: 0.1" v-if="!isSidebarCollapsed" />

        <div class="history-section" v-if="!isSidebarCollapsed">
          <div class="history-label recent-activities-header">
            <span>Recent Activities</span>
            <div 
              class="arrow-clickable-wrapper"
              @click="isHistoryExpanded = !isHistoryExpanded"
            >
              <ChevronDown 
                :size="16" 
                class="q-ml-xs transition-transform" 
                :style="{ transform: isHistoryExpanded ? 'rotate(0deg)' : 'rotate(-90deg)' }"
              />
            </div>
          </div>

          <!-- All History Items -->
          <div v-if="isHistoryExpanded" class="history-items-list">
            <div 
              v-for="session in history" 
              :key="session.id" 
              :class="['history-item', currentSessionId === session.id ? 'active' : '']"
              @click="loadSession(session)"
            >
            <div class="history-title-container">
              <div class="history-title">{{ session.title }}</div>
              <Pin v-if="session.pinned" :size="14" class="pinned-icon-small" />
            </div>
            
            <q-btn 
              v-if="currentSessionId === session.id"
              flat 
              round 
              dense 
              icon="more_horiz" 
              size="sm" 
              class="history-menu-btn"
              @click.stop
            >
              <q-menu 
                class="history-q-menu" 
                anchor="bottom right" 
                self="top right"
                :offset="[0, 8]"
                style="border-radius: 20px;"
              >
                <q-list style="min-width: 160px">
                  <q-item clickable v-close-popup class="history-menu-item" @click="togglePin(session)">
                    <q-item-section avatar>
                      <Pin :size="18" :color="session.pinned ? '#4F37FD' : '#1a1a1a'" />
                    </q-item-section>
                    <q-item-section :style="{ color: session.pinned ? '#4F37FD' : '#1a1a1a' }">
                      {{ session.pinned ? 'Unpin Chat' : 'Pin Chat' }}
                    </q-item-section>
                  </q-item>
                  <q-item clickable v-close-popup class="history-menu-item delete-item" @click="deleteSession(session.id)">
                    <q-item-section avatar>
                      <Trash2 :size="18" />
                    </q-item-section>
                    <q-item-section>Delete</q-item-section>
                  </q-item>
                </q-list>
              </q-menu>
            </q-btn>
          </div>
        </div>
      </div>

        <div class="sidebar-footer">
          <div class="user-profile" :class="{ 'collapsed-profile': isSidebarCollapsed }">
            <q-avatar size="32px">
              <img :src="currentUser.picture || 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y'" />
            </q-avatar>
            <div class="user-info-text" v-if="!isSidebarCollapsed">
              <div class="user-name">{{ currentUser.name || 'Guest' }}</div>
            </div>
            <q-space v-if="!isSidebarCollapsed" />
            <q-btn 
              v-if="!isSidebarCollapsed"
              flat 
              round 
              dense 
              icon="more_horiz" 
              size="sm"
              class="profile-more-btn"
            >
              <q-menu
                class="profile-menu"
                anchor="top right"
                self="bottom right"
                :offset="[0, 12]"
                style="border-radius: 20px;"
              >
                <q-list class="profile-menu-list ">
                  <q-item clickable v-close-popup @click="showSettingsDialog = true" class="profile-menu-item">
                    <q-item-section avatar>
                      <Settings :size="16" />
                    </q-item-section>
                    <q-item-section class="profile-menu-text">Settings</q-item-section>
                  </q-item>
                  <q-item clickable v-close-popup @click="logout" class="profile-menu-item">
                    <q-item-section avatar>
                      <LogOut :size="16" />
                    </q-item-section>
                    <q-item-section class="profile-menu-text">Log Out</q-item-section>
                  </q-item>
                </q-list>
              
              </q-menu>
            </q-btn>

            <!-- Menu for collapsed state -->
            <q-menu
              v-if="isSidebarCollapsed"
              class="profile-menu"
              anchor="top right"
              self="bottom left"
              :offset="[12, 0]"
            >
              <q-list class="profile-menu-list">
                <q-item clickable v-close-popup @click="showSettingsDialog = true" class="profile-menu-item">
                  <q-item-section avatar>
                    <Settings :size="18" />
                  </q-item-section>
                  <q-item-section class="profile-menu-text">Settings</q-item-section>
                </q-item>
                <q-item clickable v-close-popup @click="logout" class="profile-menu-item">
                  <q-item-section avatar>
                    <LogOut :size="18" />
                  </q-item-section>
                  <q-item-section class="profile-menu-text">Log Out</q-item-section>
                </q-item>
              </q-list> 
            </q-menu>
          </div>
        </div>
      </aside>

      <!-- Main Chat Area -->
      <main class="chat-main">
        <div class="chat-container">
          <div class="chat-header-actions">
            <template v-if="!selectedTarget.hostname">
              <q-btn 
                unelevated
                rounded
                class="connect-device-btn-fixed"
                @click="showTargetDialog = true"
              >
                <div class="row no-wrap items-center">
                  <Monitor :size="20" :stroke-width="2" style="margin-right: 12px;" />
                  <span>Connect device</span>
                </div>
              </q-btn>
            </template>
            <template v-else>
              <div class="connected-device-pill">
                <div class="device-info-section" @click="showTargetDialog = true">
                  <Monitor :size="20" color="#008409" stroke-width="2" />
                  <span class="device-name-text" v-if="selectedTargets.length > 1">
                    {{ selectedTargets.length }} Devices Connected
                  </span>
                  <span class="device-name-text" v-else>
                    {{ selectedTarget.name || selectedTarget.hostname }}
                  </span>
                  <q-tooltip>View Connected Devices</q-tooltip>
                </div>
                <div class="separator-line"></div>
                <div class="disconnect-section" @click="disconnectDevice">
                  <Link2Off :size="20" color="#CD1C18" stroke-width="2" />
                </div>
              </div>
            </template>
          </div>

          <!-- Messages Area -->
          <div id="chat-window" class="chat-window">
            <!-- Welcome Screen -->
            <div v-if="messages.length === 1" class="welcome-screen">
              <h1 class="welcome-title">How can I assist you today ?</h1>
              <p class="welcome-subtitle">I can help you install software, check your system help or answer technical questions</p>
              
              <!-- Action Cards -->
              <div class="action-cards">
                <div class="action-card" @click="quickAction('Check windows update')">
                  <div class="card-header">
                    <span class="card-title">Windows Update</span>
                    <div class="card-icon-circle">
                      <ChevronRight :size="18" />
                    </div>
                  </div>
                  <p class="card-description">Check for pending updates and system reboots.</p>
                </div>
                
                <div class="action-card" @click="quickAction('Check system')">
                  <div class="card-header">
                    <span class="card-title">System Check</span>
                    <div class="card-icon-circle">
                      <ChevronRight :size="18" />
                    </div>
                  </div>
                  <p class="card-description">Analyze device health and readiness</p>
                </div>
                
                <div class="action-card" @click="quickAction('Show network info')">
                  <div class="card-header">
                    <span class="card-title">Network Info</span>
                    <div class="card-icon-circle">
                      <ChevronRight :size="18" />
                    </div>
                  </div>
                  <p class="card-description">Connected network and performance</p>
                </div>
              </div>
            </div>

            <!-- Chat Messages -->
            <div v-for="(msg, index) in messages" :key="index" class="message-wrapper">
              <!-- User Message -->
              <div v-if="msg.from === 'user'" class="user-message-container">
                <div class="message-header">{{ msg.text }}</div>
              </div>

              <!-- Bot Message -->
              <div v-else-if="index > 0" class="bot-message-container">
                <div class="bot-icon-wrapper">
                  <div class="bot-icon-img-wrapper">
                    <img src="Group 1000003518.svg" alt="IQ" class="bot-logo-img" />
                  </div>
                </div>
                
                <div class="bot-content-wrapper">
                  <div v-if="msg.targetName" class="bot-device-info">
                    <span class="device-label">Device Name:</span>
                    <span class="device-value">{{ msg.targetName }}</span>
                  </div>
                  <div class="bot-text" v-html="formatMessage(msg.text)"></div>
                  
                  <!-- Automation Status -->
                  <div v-if="msg.automation" class="automation-status q-mt-md">
                    <div v-if="!msg.status">
                      <!-- Progress UI for Install/Uninstall -->
                      <div v-if="msg.progress" class="status-item processing-container">
                        <div class="processing-status-line">
                          <div class="hourglass-icon">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F57C00" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                              <path d="M5 2h14"></path>
                              <path d="M5 22h14"></path>
                              <path d="M6 2l1 5c.2 1.3.8 2.5 1.7 3.4L12 14l3.3-3.6c.9-.9 1.5-2.1 1.7-3.4l1-5"></path>
                              <path d="M6 22l1-5c.2-1.3.8-2.5 1.7-3.4L12 10l3.3 3.6c.9.9 1.5 2.1 1.7 3.4l1 5"></path>
                            </svg>
                          </div>
                          <span class="status-title">{{ (msg.text.includes('Installing') || msg.text.includes('Uninstalling')) ? msg.text : 'Processing...' }}</span>
                        </div>
                        <span class="status-subtext q-mb-md">Please wait, this may take a few minutes.</span>

                        <!-- Progress Card -->
                        <div class="progress-card">
                          <div class="progress-info-row">
                            <div class="software-info">
                              <span class="software-name">{{ msg.entity || 'Software' }}</span>
                              <span class="software-version">{{ msg.version || 'Checking...' }}</span>
                            </div>
                            <div class="progress-stats-group">
                              <span class="progress-downloaded">{{ msg.progress?.downloaded || '0' }} / {{ msg.progress?.total || '100' }}mb</span>
                              <span class="progress-percentage">{{ msg.progress?.percent || '0' }}%</span>
                            </div>
                            <div class="progress-close-btn" @click="stopExecution">
                              <X :size="20" />
                            </div>
                          </div>
                          <div class="progress-bar-container">
                            <div class="progress-bar-fill" :style="{ width: (msg.progress?.percent || 0) + '%' }"></div>
                          </div>
                        </div>
                      </div>

                      <!-- Standard Loading UI for other tasks -->
                      <div v-else class="status-item processing">
                        <div class="status-header">
                          <img src="Frame (1).svg" class="status-icon rotating-icon" alt="Loading" />
                          <span class="status-title">Processing...</span>
                        </div>
                        <span class="status-subtext">Please wait, this may take a few minutes.</span>
                      </div>
                    </div>
                    
                    <div v-else-if="msg.updateInfo" class="update-card">
                      <div class="update-header">
                        <Download :size="20" color="#2196F3" class="q-mr-sm" />
                        <span class="update-title">{{ msg.entity }} is already installed on your computer.</span>
                      </div>
                      <p class="update-subtitle">An update is available.</p>
                      
                      <div class="update-info-box">
                        <div class="update-row">
                          <span class="update-label">Installed Version</span>
                          <span class="update-value">{{ msg.updateInfo.installed }}</span>
                        </div>
                        <div class="update-row">
                          <span class="update-label">New Version</span>
                          <span class="update-value">{{ msg.updateInfo.available }}</span>
                        </div>
                      </div>
                      
                      <div class="update-actions">
                        <q-btn 
                          unelevated 
                          rounded
                          color="primary" 
                          label="Update" 
                          class="update-btn"
                          @click="performUpgrade(msg)" 
                          :loading="msg.upgrading"
                        />
                        <q-btn 
                          flat
                          rounded
                          label="Keep existing version" 
                          class="keep-btn"
                          @click="msg.updateInfo = null" 
                        />
                      </div>
                    </div>
                    
                    <div v-else class="status-item" :class="msg.status.success ? 'success' : 'error'">
                      <div class="status-header">
                        <img v-if="msg.status.success" src="Frame.svg" class="status-icon" alt="Success" />
                        <AlertCircle v-else :size="20" color="#FF4D4D" />
                        <span class="status-title">{{ msg.status.title || (msg.status.success ? 'Operation completed successfully.' : 'Operation failed.') }}</span>
                      </div>
                      <span v-if="msg.status.success && !msg.status.title" class="status-subtext">{{ msg.entity || 'Action' }} is now complete on your system.</span>
                      <span v-if="msg.status.success && msg.status.title" class="status-subtext">{{ msg.status.subtext }}</span>
                      
                      <q-expansion-item v-if="msg.log" label="View details" dense class="log-expansion q-mt-sm">
                        <pre class="log-content">{{ msg.log }}</pre>
                      </q-expansion-item>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div v-if="isTyping" class="bot-message-container">
              <div class="bot-icon-wrapper">
                <div class="bot-icon-img-wrapper">
                  <img src="Group 1000003518.svg" alt="IQ" class="bot-logo-img" />
                </div>
              </div>
              <div class="typing-indicator-wrapper">
                <img src="Frame (1).svg" class="status-icon rotating-icon" alt="Loading" />
              </div>
            </div>
          </div>

          <!-- Input Section -->
          <div class="input-section">
            <!-- Quick Action Pills -->
            <transition name="fade-up">
              <div v-if="showQuickActions" class="quick-pills-container floating-pills">
                <div class="quick-pills">
                  <button class="pill-btn" @click="quickAction('Run onboarding process')">Onboarding process</button>
                  <button class="pill-btn" @click="quickAction('Hard refresh')">Hard refresh</button>
                  <button class="pill-btn" @click="quickAction('Show network information')">Network information</button>
                  <button class="pill-btn" @click="quickAction('Check windows update')">Check windows update</button>
                  <button class="pill-btn" @click="quickAction('Clear cache')">Clear cache</button>
                  <button v-for="name in softwareList" :key="name" class="pill-btn" @click="quickAction('Install ' + name)">
                    Install {{ name }}
                  </button>
                </div>
              </div>
            </transition>

            <div class="input-container">
              <input 
                v-model="userInput" 
                placeholder="Type here..." 
                @keyup.enter="sendMessage"
                :disabled="isExecuting"
                class="chat-input"
              />
              <q-btn 
                flat
                dense
                round
                class="input-action-btn"
                @click="showQuickActions = !showQuickActions"
              >
                <LayoutPanelLeft :size="20" />
              </q-btn>
              <q-btn 
                v-if="!isExecuting"
                unelevated
                round
                color="primary"
                class="send-btn"
                @click="sendMessage"
                :disable="!userInput.trim() || isTyping"
              >
                <ChevronUp :size="24" />
              </q-btn>
              <q-btn
                v-else
                unelevated
                round
                icon="stop"
                color="primary"
                class="send-btn"
                @click="stopExecution"
              />
            </div>
          </div>
        </div>
      </main>
    </div>

    <!-- Search Dialog -->
    <div v-if="showSearchDialog" class="search-dialog-overlay" @click.self="showSearchDialog = false">
      <div class="search-dialog-container">
        <div class="search-dialog-header">
          <div class="search-input-wrapper">
            <input 
              v-model="searchChatQuery" 
              placeholder="Search chat history" 
              class="search-chat-input"
            />
            <q-btn flat round dense class="clear-search-btn" @click="searchChatQuery = ''">
              <X :size="18" />
            </q-btn>
          </div>
          <q-btn 
            flat 
            rounded 
            label="Close" 
            class="search-close-btn" 
            @click="showSearchDialog = false" 
          />
        </div>

        <div class="search-results-list">
          <div 
            v-for="(result, index) in searchResults" 
            :key="index" 
            class="search-result-item"
            @click="handleSearchResultClick(result)"
          >
            <div class="result-content">
              <div class="result-title">{{ result.title }}</div>
              <div class="result-subtitle">{{ result.subtitle }}</div>
            </div>
            <div class="result-date">{{ result.date }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Settings Dialog -->
    <q-dialog v-model="showSettingsDialog" transition-show="scale" transition-hide="scale">
      <q-card class="settings-card">
        <q-card-section class="settings-header">
          <div class="text-h6 settings-title">Settings</div>
          <q-btn flat round dense v-close-popup class="close-btn">
            <X :size="24" />
          </q-btn>
        </q-card-section>

        <q-card-section class="settings-body">
          <!-- Profile Section -->
          <div class="profile-card">
            <q-avatar size="64px" class="profile-avatar">
              <img :src="currentUser.picture || 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y'" />
            </q-avatar>
            <div class="profile-info">
              <div class="profile-name">{{ currentUser.name }}</div>
              <div class="profile-email">{{ currentUser.email }}</div>
            </div>
            <q-btn 
              unelevated 
              rounded 
              label="Log Out" 
              class="logout-btn-pill"
              @click="logout"
            />
          </div>

          <!-- Delete Section -->
          <div class="settings-section delete-section">
            <div class="section-label">Delete Chat</div>
            <q-btn 
              outline 
              rounded 
              label="Delete" 
              class="delete-btn-pill" 
              @click="deleteAllHistory"
            />
          </div>

          <!-- About Section -->
          <div class="settings-section">
            <div class="section-title">About</div>
            <div class="about-list">
              <div class="about-item-modern">
                <span>Terms & Condition</span>
                <ChevronRight :size="18" class="text-grey-7" />
              </div>
              <div class="about-item-modern">
                <span>Privacy Policies</span>
                <ChevronRight :size="18" class="text-grey-7" />
              </div>
            </div>
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- Devices Dialog -->
    <q-dialog v-model="showTargetDialog">
      <q-card class="device-dialog">
        <q-card-section class="dialog-header">
          <div class="row items-center full-width justify-between no-wrap">
            <div class="row items-center no-wrap">
              <div class="text-h6 title-bold">Devices</div>
            </div>
            <div class="row items-center no-wrap q-gutter-x-lg">
              <q-btn 
                flat 
                round 
                dense 
                class="refresh-btn"
                @click="refreshDeviceStatuses"
                :loading="isRefreshingStatuses"
              >
                <RotateCw :size="20" color="#4F37FD" />
              </q-btn>
              <q-btn 
                v-if="isSelectMode"
                flat 
                dense 
                no-caps
                label="Select All" 
                color="primary"
                class="select-all-btn"
                @click="toggleSelectAll"
              />
              <q-btn flat round dense v-close-popup class="close-btn">
                <X :size="24" />
              </q-btn>
            </div>
          </div>
        </q-card-section>

        <q-card-section class="device-list scroll" style="height: 380px;">
          <div v-if="sortedDevices.length > 0">
            <div 
              v-for="device in sortedDevices" 
              :key="device.hostname"
              :class="['device-item', isDeviceStaged(device) ? 'device-item-selected' : '']"
              @click="isSelectMode ? toggleDeviceSelection(device) : null"
            >
              <div class="device-info">
                <div class="device-icon-wrapper">
                  <Monitor :size="20" color="#4F37FD" stroke-width="2" />
                </div>
                <div class="device-details">
                  <div class="row items-center no-wrap">
                    <div class="device-name">{{ device.name }}</div>
                    <div 
                      :class="['status-badge', device.networkStatus === 'online' ? 'status-online' : 'status-offline']"
                      v-if="device.networkStatus"
                    >
                      {{ device.networkStatus.charAt(0).toUpperCase() + device.networkStatus.slice(1) }}
                    </div>
                  </div>
                  <div class="device-ip">{{ device.hostname }}</div>
                </div>
              </div>
              
              <div class="device-actions">
                <template v-if="isSelectMode">
                  <div 
                    class="selection-circle" 
                    :class="{ 'selected': isDeviceStaged(device) }"
                    @click.stop="toggleDeviceSelection(device)"
                  >
                    <CheckCircle2 v-if="isDeviceStaged(device)" :size="20" color="#4F37FD" />
                    <div v-else class="empty-circle"></div>
                  </div>
                </template>
                <template v-else>
                  <q-btn 
                    flat 
                    round 
                    dense 
                    color="grey-9"
                    @click.stop
                  >
                    <MoreHorizontal :size="20" />
                    <q-menu 
                      class="device-options-menu"
                      anchor="bottom right"
                      self="top right"
                      :offset="[0, 8]"
                      transition-show="jump-down"
                      transition-hide="jump-up"
                      style="border-radius: 20px;"
                    >
                      <q-list>
                        <q-item clickable v-close-popup @click="connectDevice(device)" class="menu-item-default">
                          <q-item-section>Connect</q-item-section>
                        </q-item>
                        <q-item clickable v-close-popup @click="viewDeviceDetails(device)" class="menu-item-default">
                          <q-item-section>View Details</q-item-section>
                        </q-item>
                        <q-item clickable v-close-popup @click="removeDevice(device.hostname)" class="menu-item-remove">
                          <q-item-section>Remove</q-item-section>
                        </q-item>
                      </q-list>
                    </q-menu>
                  </q-btn>
                </template>
              </div>
            </div>
          </div>
          <div v-else class="empty-device-list text-center q-pa-lg">
            <p class="text-grey-6">No devices found. Add a device to get started.</p>
          </div>
        </q-card-section>

        <q-card-actions class="dialog-actions-footer">
          <template v-if="!isSelectMode">
            <q-btn 
              unelevated 
              rounded
              label="Select Device" 
              class="select-mode-btn"
              @click="isSelectMode = true"
            />
            <q-btn 
              unelevated 
              rounded
              label="Add New Device" 
              class="add-device-btn-new"
              @click="openAddDeviceForm"
            />
          </template>
          <template v-else>
            <q-btn 
              unelevated 
              rounded
              label="Cancel" 
              class="cancel-selection-btn"
              @click="isSelectMode = false"
            />
            <q-btn 
              unelevated 
              rounded
              label="Connect" 
              class="connect-selection-btn"
              :disable="stagedTargets.length === 0"
              @click="connectSelectedDevices"
            />
          </template>
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Add Device Dialog -->
    <q-dialog v-model="showDeviceForm" persistent>
      <q-card class="device-form-dialog">
        <!-- Header -->
        <q-card-section class="dialog-header">
          <div class="text-h6 title-bold">Device Details</div>
        </q-card-section>

        <!-- Form -->
        <q-card-section class="q-pt-none">
      <div class="form-group">
        <label class="form-label">Display Name</label>
       <q-input
  v-model="tempTarget.name"
  dense
  borderless
  placeholder=""
  class="pill-input"
  :readonly="isViewOnly"
/>

      </div>

      <div class="form-group">
        <label class="form-label">IP Address</label>
        <q-input
          v-model="tempTarget.hostname"
          dense
          borderless
          placeholder=" "
          class="pill-input"
          @input="connectionError = ''"
          :readonly="isViewOnly"
        />
      </div>

      <div class="form-group">
        <label class="form-label">Admin Username</label>
        <q-input
          v-model="tempTarget.username"
          dense
          borderless
          placeholder=" "
          class="pill-input"
          @input="connectionError = ''"
          :readonly="isViewOnly"
        />
      </div>

      <div class="form-group">
        <label class="form-label">Admin Password</label>
        <q-input
          v-model="tempTarget.password"
          type="password"
          dense
          borderless
          placeholder=" "
          class="pill-input"
          @input="connectionError = ''"
          :readonly="isViewOnly"
        />
      </div>

      <div v-if="connectionError" class="error-message">
        <q-icon name="error" color="negative" />
        <span>{{ connectionError }}</span>
      </div>
    </q-card-section>

    <!-- Actions -->
    <q-card-actions align="right" class="dialog-actions">
      <template v-if="!isViewOnly">
        <q-btn
          flat
          rounded
          label="Cancel"
          class="cancel-btn"
          @click="showDeviceForm = false; connectionError = ''"
          :disable="isConnecting"
        />
        <q-btn
          unelevated
          rounded
          label="Add"
          class="add-btn"
          @click="addDeviceToList"
          :loading="isConnecting"
        />
      </template>
      <template v-else>
        <q-btn
          unelevated
          rounded
          label="Close"
          class="add-btn"
          @click="showDeviceForm = false"
        />
      </template>
    </q-card-actions>

  </q-card>
</q-dialog>

    <!-- Software Catalog Dialog -->
    <q-dialog v-model="showCatalog">
      <q-card style="width: 700px; max-width: 90vw;" class="catalog-dialog">
        <q-card-section class="dialog-header">
          <div class="text-h6">Software Catalog</div>
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section>
          <div v-if="isLoadingCatalog" class="flex flex-center q-pa-xl">
            <img src="Frame (1).svg" class="catalog-loading-icon rotating-icon" alt="Loading" />
          </div>
          <div v-else-if="softwareList.length === 0" class="text-center q-pa-xl text-grey-6">
            No software found in catalog.
          </div>
          <div v-else class="row q-col-gutter-sm">
            <div v-for="name in softwareList" :key="name" class="col-xs-6 col-sm-4 col-md-3">
              <q-card 
                flat 
                bordered 
                class="catalog-item"
                @click="selectFromCatalog(name)"
              >
                <q-card-section class="text-center">
                  <div class="catalog-item-name">{{ name }}</div>
                </q-card-section>
              </q-card>
            </div>
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, computed, watch } from 'vue'
import axios from 'axios'

// Configure API Base URL
const API_URL = process.env.BACKEND_URL || 'https://assist-iq-backend-2.onrender.com'||'http://127.0.0.1:8000'

const api = axios.create({
  baseURL: API_URL,
  timeout: 0
});

import lottie from 'lottie-web';
import { 
  PanelLeft, 
  SquarePen, 
  ScrollText, 
  ChevronRight, 
  Download,
  Search,
  MoreHorizontal,
  Monitor,
  Link2Off,
  CheckCircle2,
  AlertCircle,
  Clock,
  LayoutPanelLeft, 
  ChevronUp, 
  ChevronDown, 
  Pin, 
  Trash2, 
  Settings, 
  LogOut, 
  User, 
  FileText, 
  X,
  Globe,
  AlertTriangle,
  RotateCw,
  Mail,
  Ticket
} from 'lucide-vue-next';

const userInput = ref("")
const isTyping = ref(false)
const isExecuting = ref(false)
const isConnecting = ref(false)
const lottieContainer = ref(null)
let animationInstance = null

const initLottie = () => {
  if (lottieContainer.value) {
    animationInstance = lottie.loadAnimation({
      container: lottieContainer.value,
      renderer: 'svg',
      loop: true,
      autoplay: true,
      path: 'Flow 3.json'
    })
  }
}

watch(isConnecting, (val) => {
  if (val) {
    nextTick(() => {
      initLottie()
    })
  } else if (animationInstance) {
    animationInstance.destroy()
    animationInstance = null
  }
})

const isSidebarCollapsed = ref(false)
const showTicketView = ref(false)
const incomingEmails = ref([])
const tickets = ref([])

const tokenClient = ref(null)
const accessToken = ref(null)

const initTokenClient = () => {
  if (window.google && window.google.accounts && window.google.accounts.oauth2) {
    tokenClient.value = window.google.accounts.oauth2.initTokenClient({
      client_id: '496269258666-156t65qcqtrmul6h3j57ej780koc79uo.apps.googleusercontent.com',
      scope: 'https://www.googleapis.com/auth/gmail.readonly',
      callback: (response) => {
        if (response.access_token) {
          accessToken.value = response.access_token
          fetchEmails()
        }
      },
      error_callback: (err) => {
          console.error("Auth Error:", err)
          showNotification("Auth Failed. Please try again.", 'error')
      }
    });
  } else {
    setTimeout(initTokenClient, 100)
  }
}

const fetchEmails = async () => {
  try {
    if (!accessToken.value) {
      if (tokenClient.value) {
        tokenClient.value.requestAccessToken();
      } else {
        showNotification("Google Auth initializing...", 'warning')
      }
      return
    }

    // Only fetch if we have a real token
    const res = await api.get(`/emails/check?token=${accessToken.value}`)
    incomingEmails.value = res.data
    
    if (res.data.length > 0) {
      showNotification(`${res.data.length} new incidents found`, 'success')
    } else {
      showNotification("No new incidents found", 'warning')
    }
  } catch (e) {
    console.error(e)
    if (e.response && e.response.status === 403) {
       showNotification("Access Denied. Check Google Cloud Test Users.", 'error')
    } else {
       showNotification("Failed to check emails", 'error')
    }
  }
}

const createTicketFromEmail = async (email) => {
  try {
    await api.post("/tickets", {
      subject: email.subject,
      sender: email.sender,
      description: email.body
    })
    
    // Remove from incoming list
    incomingEmails.value = incomingEmails.value.filter(e => e.id !== email.id)
    
    showNotification("Ticket created successfully", 'success')
    await fetchTickets()
  } catch (e) {
    console.error(e)
    showNotification("Failed to create ticket", 'error')
  }
}

const fetchTickets = async () => {
  try {
    const res = await api.get("/tickets")
    tickets.value = res.data
  } catch (e) {
    console.error("Failed to fetch tickets", e)
  }
}

const connectionError = ref("")
const connectionStatus = ref("")
const history = ref([])
const showCatalog = ref(false)
const showTargetDialog = ref(false)
const isRefreshingStatuses = ref(false)
const lastStatusUpdate = ref("")
const stagedTargets = ref([])
const isSelectMode = ref(false)

const sortedDevices = computed(() => {
  return [...savedDevices.value].sort((a, b) => {
    const aConnected = selectedTargets.value.some(d => d.hostname === a.hostname);
    const bConnected = selectedTargets.value.some(d => d.hostname === b.hostname);
    if (aConnected && !bConnected) return -1;
    if (!aConnected && bConnected) return 1;
    return 0;
  });
})

const toggleSelectAll = () => {
  if (stagedTargets.value.length === savedDevices.value.length) {
    stagedTargets.value = [];
  } else {
    stagedTargets.value = [...savedDevices.value];
  }
}

watch(showTargetDialog, (val) => {
  if (val) {
    stagedTargets.value = [...selectedTargets.value]
    isSelectMode.value = false
    refreshDeviceStatuses()
  }
})

// Notification state
const notification = ref({
  show: false,
  message: '',
  type: 'success', // 'success', 'error', 'warning'
  action: null
})

const showNotification = (message, type = 'success', action = null) => {
  notification.value = {
    show: true,
    message,
    type,
    action
  }
  
  // Don't auto-hide error notifications if they have an action
  if (type !== 'error' || !action) {
    setTimeout(() => {
      if (notification.value.message === message) {
        notification.value.show = false
      }
    }, 5000)
  }
}

const refreshDeviceStatuses = async () => {
  if (savedDevices.value.length === 0) return
  
  isRefreshingStatuses.value = true
  const hostnames = savedDevices.value.map(d => d.hostname)
  try {
    const res = await api.post("/devices/status", hostnames)
    const statuses = res.data
    
    savedDevices.value = savedDevices.value.map(d => ({
      ...d,
      networkStatus: statuses[d.hostname] || 'offline'
    }))
    
    // Check if current selected target is now offline
    if (selectedTarget.value.hostname) {
      const currentStatus = statuses[selectedTarget.value.hostname];
      if (currentStatus === 'offline') {
        showNotification(`${selectedTarget.value.name || selectedTarget.value.hostname} is currently offline`, 'warning')
      }
    }

    saveDevices()
    lastStatusUpdate.value = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  } catch (e) {
    console.error("Failed to refresh device statuses", e)
  } finally {
    isRefreshingStatuses.value = false
  }
}



const showDeviceForm = ref(false)
const isViewOnly = ref(false)
const showQuickActions = ref(false)
const showSettingsDialog = ref(false)
const showSearchDialog = ref(false)
const isHistoryExpanded = ref(true)
const searchChatQuery = ref("")
const searchResults = computed(() => {
const query = searchChatQuery.value.toLowerCase().trim();
  
  return history.value
    .filter(session => {
      if (!query) return true;
      const matchTitle = session.title?.toLowerCase().includes(query);
      const matchMessages = session.messages?.some(m => m.text?.toLowerCase().includes(query));
      return matchTitle || matchMessages;
    })
    .map(session => {
      // Get the most relevant snippet for subtitle
      const lastBotMsg = [...session.messages].reverse().find(m => m.from === 'bot');
      const firstUserMsg = session.messages.find(m => m.from === 'user');
      
      return {
        ...session,
        title: session.title || 'Untitled Chat',
        subtitle: (lastBotMsg?.text || firstUserMsg?.text || 'No messages').substring(0, 60),
        date: new Date(session.timestamp).toLocaleDateString('en-GB')
      };
    });
})

const handleSearchResultClick = (session) => {
  loadSession(session);
  showSearchDialog.value = false;
  searchChatQuery.value = "";
};
const isLoadingCatalog = ref(false)
const softwareList = ref([])
const savedDevices = ref([])
const loadDevices = () => {
  const saved = localStorage.getItem('savedDevices')
  if (saved) {
    savedDevices.value = JSON.parse(saved)
  }
}

const saveDevices = () => {
  localStorage.setItem('savedDevices', JSON.stringify(savedDevices.value))
}

const selectedTargets = ref([])
const selectedTarget = ref({ hostname: '', username: '', password: '', port: 5985, name: '' })
const lastConnectedHostname = ref('')
const tempTarget = ref({ hostname: '', username: '', password: '', port: 5985, name: '' })

const currentUser = ref({
  name: '',
  email: '',
  picture: ''
})

const loadUser = () => {
  const savedUser = localStorage.getItem('user')
  if (savedUser) {
    currentUser.value = JSON.parse(savedUser)
  }
}

const logout = () => {
  localStorage.removeItem('isLoggedIn')
  localStorage.removeItem('user')
  window.location.href = '/'
}

const pinnedHistory = computed(() => {
  return history.value.filter(s => s.pinned)
})

const todayHistory = computed(() => {
  const today = new Date().toDateString()
  return history.value.filter(s => !s.pinned && new Date(s.timestamp).toDateString() === today)
})

const yesterdayHistory = computed(() => {
  const yesterday = new Date(Date.now() - 86400000).toDateString()
  return history.value.filter(s => !s.pinned && new Date(s.timestamp).toDateString() === yesterday)
})

const openAddDeviceForm = () => {
  tempTarget.value = { hostname: '', username: '', password: '', port: 5985, name: '' }
  connectionError.value = ""
  isViewOnly.value = false
  showDeviceForm.value = true
}

const removeDevice = async (hostname) => {
  savedDevices.value = savedDevices.value.filter(d => d.hostname !== hostname)
  saveDevices()
  
  if (selectedTarget.value.hostname === hostname) {
    selectedTarget.value = { hostname: '', username: '', password: '', port: 5985, name: '' }
  }
  selectedTargets.value = selectedTargets.value.filter(d => d.hostname !== hostname)
  
  try {
    await api.delete(`/devices/${hostname}`)
    showNotification("Device removed successfully", "success")
  } catch (e) {
    console.error("Failed to remove device from backend", e)
    showNotification("Removed locally, but backend sync failed", "warning")
  }
}

const isDeviceSelected = (device) => {
  return selectedTargets.value.some(d => d.hostname === device.hostname)
}

const isDeviceStaged = (device) => {
  return stagedTargets.value.some(d => d.hostname === device.hostname)
}

const toggleDeviceSelection = (device) => {
  const index = stagedTargets.value.findIndex(d => d.hostname === device.hostname)
  if (index === -1) {
    stagedTargets.value.push({ ...device })
  } else {
    stagedTargets.value.splice(index, 1)
  }
}

const connectSelectedDevices = () => {
  if (stagedTargets.value.length === 0) {
    showNotification("Please select at least one device", "warning")
    return
  }
  
  selectedTargets.value = [...stagedTargets.value]
  
  if (selectedTargets.value.length > 0) {
    selectedTarget.value = { ...selectedTargets.value[selectedTargets.value.length - 1] }
  }
  
  showTargetDialog.value = false
  const count = selectedTargets.value.length
  showNotification(`Connected to ${count} device${count > 1 ? 's' : ''}`, "success")
}

const addDeviceToList = async () => {
  if (!tempTarget.value.hostname) {
    connectionError.value = "Hostname/IP is required"
    return
  }
  
  isConnecting.value = true

  // Check if already exists 
  const existsIndex = savedDevices.value.findIndex(d => d.hostname === tempTarget.value.hostname)
  if (existsIndex !== -1) {
    // Update existing
    savedDevices.value[existsIndex] = { ...tempTarget.value }
  } else {
    // Add new
    savedDevices.value.push({ ...tempTarget.value })
  }
  
  saveDevices()
  
  try {
    await api.post("/devices/create", tempTarget.value)
    showNotification("Device saved successfully", "success")
    showDeviceForm.value = false
    connectionError.value = ""
  } catch (e) {
    console.error("Failed to save device to backend", e)
    showNotification("Saved locally, but backend sync failed", "warning")
    showDeviceForm.value = false
  } finally {
    isConnecting.value = false
  }
}

const connectDevice = (device) => {
  if (device.hostname !== lastConnectedHostname.value) {
    createNewSession()
    lastConnectedHostname.value = device.hostname
  }
  selectedTargets.value = [{ ...device }]
  selectedTarget.value = { ...device }
  showTargetDialog.value = false
  showNotification(`Connected to ${device.name || device.hostname}`, "success")
}

const viewDeviceDetails = (device) => {
  tempTarget.value = { ...device }
  isViewOnly.value = true
  showDeviceForm.value = true
}

const disconnectDevice = () => {
  const count = selectedTargets.value.length
  const deviceName = count > 1 ? `${count} devices` : (selectedTarget.value.name || selectedTarget.value.hostname)
  selectedTarget.value = { hostname: '', username: '', password: '', port: 5985, name: '' }
  selectedTargets.value = []
  showNotification(`Disconnected from ${deviceName}`, "success")
}

const connectRemote = async () => {
  if (!tempTarget.value.hostname) return
  
  isConnecting.value = true
  connectionError.value = ""
  tempTarget.value.status = 'connecting'

  try {
    const res = await api.post("/remote/connect", tempTarget.value)

    if (res.data.success) {
      tempTarget.value.status = 'connected'

      selectedTarget.value = { ...tempTarget.value }

      if (tempTarget.value.hostname !== lastConnectedHostname.value) {
        createNewSession()
        lastConnectedHostname.value = tempTarget.value.hostname
      }

      // UPDATE DEVICE LIST STATUS
      savedDevices.value = savedDevices.value.map(d =>
        d.hostname === tempTarget.value.hostname
          ? { ...d, status: 'connected' }
          : { ...d, status: 'idle' }
      )

      saveDevices()

      showDeviceForm.value = false
      showTargetDialog.value = false

      // Show success notification
      showNotification(`You're now connected to ${tempTarget.value.name || tempTarget.value.hostname}`, 'success')

      messages.value.push({
        from: 'bot',
        text: `Successfully connected to **${tempTarget.value.name || tempTarget.value.hostname}**!`,
        status: { success: true },
        automation: false
      })
    } else {
      tempTarget.value.status = 'error'
      connectionError.value = res.data.details || "Connection failed"
      
      // Show error notification
      showNotification(`Failed to connect to ${tempTarget.value.name || tempTarget.value.hostname}`, 'error', {
        label: 'Reconnect',
        handler: () => connectRemote()
      })
    }
  } catch (e) {
    tempTarget.value.status = 'error'
    connectionError.value = "Could not reach the backend server."
    
    // Show error notification
    showNotification(`Failed to connect to ${tempTarget.value.name || tempTarget.value.hostname}`, 'error', {
      label: 'Reconnect',
      handler: () => connectRemote()
    })
  } finally {
    isConnecting.value = false
  }
}

const currentSessionId = ref(null)
const messages = ref([
  { from: 'bot', text: "Welcome" }
])

onMounted(async () => {
  console.log("%c FRONTEND IS AWAKE ", "background: #4F37FD; color: white; font-weight: bold; border-radius: 4px; padding: 2px 5px;");
  console.log("Connecting to backend at:", API_URL);
  
  // Load Google Script if not present
  if (!document.querySelector('script[src="https://accounts.google.com/gsi/client"]')) {
    const script = document.createElement('script')
    script.src = "https://accounts.google.com/gsi/client"
    script.onload = initTokenClient
    document.head.appendChild(script)
  } else {
    initTokenClient()
  }

  loadUser()
  loadDevices()
  await fetchHistory()
  await fetchSoftwareList()
  await fetchTickets()
})

const fetchSoftwareList = async () => {
  isLoadingCatalog.value = true
  try {
    const res = await api.get("/list")
    softwareList.value = res.data
  } catch (e) {
    console.error("Failed to fetch software list", e)
  } finally {
    isLoadingCatalog.value = false
  }
}

const selectFromCatalog = (name) => {
  showCatalog.value = false
  userInput.value = `Install ${name}`
  sendMessage()
}

const fetchHistory = async () => {
  if (!currentUser.value.email) return
  try {
    const res = await api.get(`/history?email=${currentUser.value.email}`)
    history.value = res.data
  } catch (e) {
    console.error("Failed to fetch history", e)
  }
}

const createNewSession = () => {
  currentSessionId.value = Date.now().toString()
  messages.value = [{ from: 'bot', text: "Welcome" }]
}

const saveCurrentSession = async () => {
  if (messages.value.length <= 1 || !currentUser.value.email) return
  
  const existingSession = history.value.find(s => s.id === currentSessionId.value)
  const isPinned = existingSession ? (existingSession.pinned || false) : false
  
  const firstUserMsg = messages.value.find(m => m.from === 'user')
  const title = firstUserMsg ? firstUserMsg.text.substring(0, 40) : "New Chat"
  
  const session = {
    id: currentSessionId.value,
    title,
    messages: messages.value,
    timestamp: new Date().toISOString(),
    pinned: isPinned
  }
  
  try {
    await api.post("/history", { 
      session,
      email: currentUser.value.email 
    })
    await fetchHistory()
  } catch (e) {
    console.error("Failed to save history", e)
  }
}

const loadSession = (session) => {
  showTicketView.value = false
  currentSessionId.value = session.id
  messages.value = session.messages
}

const togglePin = async (session) => {
  if (!currentUser.value.email) return
  session.pinned = !session.pinned
  try {
    await api.post("/history", { 
      session,
      email: currentUser.value.email
    })
    await fetchHistory()
  } catch (e) {
    console.error("Failed to toggle pin", e)
  }
}

const deleteSession = async (id) => {
  if (!currentUser.value.email) return
  try {
    await api.delete(`/history/${id}?email=${currentUser.value.email}`)
    if (currentSessionId.value === id) createNewSession()
    await fetchHistory()
  } catch (e) {
    console.error("Delete failed", e)
  }
}

const deleteAllHistory = async () => {
  if (!currentUser.value.email) return
  try {
    await api.delete(`/history/all/clear?email=${currentUser.value.email}`)
    createNewSession()
    await fetchHistory()
    showSettingsDialog.value = false
    showNotification('All chat history has been deleted.', 'success')
  } catch (e) {
    console.error("Delete all history failed", e)
    showNotification('Failed to delete chat history.', 'error')
  }
}

const scrollToBottom = async () => {
  await nextTick()
  const el = document.getElementById('chat-window')
  if (el) el.scrollTop = el.scrollHeight
}

const resetChat = () => {
  showTicketView.value = false
  createNewSession()
}

const performUpgrade = async (msg) => {
  msg.upgrading = true
  try {
    const installRes = await api.post("/install", { 
      dropdown: msg.entity,
      targets: selectedTargets.value,
      force_upgrade: true
    })
    msg.status = { success: installRes.data.success }
    msg.log = (installRes.data.output || "") + (installRes.data.error || "")
    msg.updateInfo = null
  } catch (e) {
    msg.status = { success: false }
    msg.log = "Upgrade failed."
  } finally {
    msg.upgrading = false
    await saveCurrentSession()
  }
}

const quickAction = (action) => {
  userInput.value = action
  showQuickActions.value = false
  sendMessage()
}

const formatMessage = (text) => {
  if (!text) return ""
  return text
    .replace(/Top Processes:[\s\S]*/, '')
    .replace(/\n/g, '<br>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/`(.*?)`/g, '<code>$1</code>')
}

const stopExecution = async () => {
  isExecuting.value = false
  isTyping.value = false
  
  try {
    await api.post("/stop")
    
    const lastMsg = messages.value[messages.value.length - 1]
    if (lastMsg && lastMsg.from === 'bot' && lastMsg.automation && !lastMsg.status) {
      lastMsg.status = { success: false }
      lastMsg.log = "Execution stopped by user."
    }
  } catch (e) {
    console.error("Stop failed", e)
  }
}

const getDeviceName = (hostname) => {
  const device = savedDevices.value.find(d => d.hostname === hostname)
  return device ? (device.name || hostname) : hostname
}

async function sendMessage() {
  const text = userInput.value.trim()
  if (!text || isTyping.value) return

  if (selectedTargets.value.length === 0) {
    showTargetDialog.value = true
    return
  }

  if (!currentSessionId.value) {
    currentSessionId.value = Date.now().toString()
  }

  messages.value.push({ from: 'user', text })
  userInput.value = ""
  isTyping.value = true
  isExecuting.value = true
  scrollToBottom()

  try {
    const chatRes = await api.post("/chat", { 
      message: text,
      target: selectedTarget.value 
    })
    if (!isExecuting.value) return

    const botData = chatRes.data
    
    const botMsg = ref({ 
      from: 'bot', 
      text: botData.reply,
      automation: botData.automation || false,
      status: null,
      log: null,
      entity: null,
      version: null,
      progress: null
    })
    messages.value.push(botMsg.value)
    const currentMsg = messages.value[messages.value.length - 1]
    
    isTyping.value = false
    scrollToBottom()
    
    if (botData.intent === 'install' && botData.entity) {
      currentMsg.entity = botData.entity
      const deviceLabel = selectedTargets.value.length > 1 ? `${selectedTargets.value.length} devices` : (selectedTarget.value.name || selectedTarget.value.hostname)
      currentMsg.text = `Installing ${botData.entity} on ${deviceLabel}...`
      
      // Fetch actual info (just from the first target for metadata)
      try {
        const infoRes = await api.post("/software/info", { 
          dropdown: botData.entity,
          target: selectedTargets.value[0]
        })
        if (infoRes.data.success) {
          currentMsg.version = infoRes.data.version
          currentMsg.progress = { percent: 0, downloaded: "0", total: infoRes.data.size }
        } else {
          currentMsg.version = "Checking..."
          currentMsg.progress = { percent: 0, downloaded: "0", total: "100" }
        }
      } catch (e) {
        currentMsg.version = "Checking..."
        currentMsg.progress = { percent: 0, downloaded: "0", total: "100" }
      }
      
      // Mock progress simulation
      const progressInterval = setInterval(() => {
        if (currentMsg.progress && currentMsg.progress.percent < 98) {
          const increment = Math.floor(Math.random() * 5) + 1
          currentMsg.progress.percent += increment
          if (currentMsg.progress.percent > 98) currentMsg.progress.percent = 98
          currentMsg.progress.downloaded = (parseFloat(currentMsg.progress.total) * (currentMsg.progress.percent / 100)).toFixed(2)
        }
      }, 500)

      const installRes = await api.post("/install", { 
        dropdown: botData.entity,
        targets: selectedTargets.value
      })
      
      clearInterval(progressInterval)
      if (!isExecuting.value) return

      if (installRes.data.results) {
        messages.value.splice(messages.value.length - 1, 1)
        installRes.data.results.forEach(res => {
          const deviceName = getDeviceName(res.target)
          messages.value.push({
            from: 'bot',
            targetName: deviceName,
            text: `Installing ${botData.entity} on ${deviceName}...`,
            automation: true,
            status: { 
              success: res.success,
              title: res.success ? `${botData.entity} installed successfully` : `${botData.entity} installation failed`,
              subtext: res.success ? `${botData.entity} is now available on ${deviceName}.` : `There was an error installing ${botData.entity} on ${deviceName}.`
            },
            log: res.output
          })
        })
      } else if (installRes.data.status === 'already_installed') {
        currentMsg.text = `${botData.entity} is already installed and up to date.`
        currentMsg.status = { success: true }
        currentMsg.log = installRes.data.output
      } else {
        currentMsg.text = `Installing ${botData.entity}...`
        currentMsg.status = { 
          success: installRes.data.success,
          title: installRes.data.success ? `${botData.entity} installed successfully` : `${botData.entity} installation failed`,
          subtext: installRes.data.success ? `${botData.entity} is now available on your system.` : `There was an error installing ${botData.entity}.`
        }
        currentMsg.log = (installRes.data.output || "") + (installRes.data.error || "")
      }
    } else if (botData.intent === 'uninstall' && botData.entity) {
      currentMsg.entity = botData.entity
      const deviceLabel = selectedTargets.value.length > 1 ? `${selectedTargets.value.length} devices` : (selectedTarget.value.name || selectedTarget.value.hostname)
      currentMsg.text = `Uninstalling ${botData.entity} from ${deviceLabel}...`
      
      // Fetch actual info for uninstall too
      try {
        const infoRes = await api.post("/software/info", { 
          dropdown: botData.entity,
          target: selectedTargets.value[0]
        })
        if (infoRes.data.success) {
          currentMsg.version = infoRes.data.version
          currentMsg.progress = { percent: 0, downloaded: "0", total: infoRes.data.size }
        } else {
          currentMsg.version = "Checking..."
          currentMsg.progress = { percent: 0, downloaded: "0", total: "100" }
        }
      } catch (e) {
        currentMsg.version = "Checking..."
        currentMsg.progress = { percent: 0, downloaded: "0", total: "100" }
      }
      
      // Mock progress simulation for uninstallation
      const progressInterval = setInterval(() => {
        if (currentMsg.progress && currentMsg.progress.percent < 98) {
          const increment = Math.floor(Math.random() * 8) + 2
          currentMsg.progress.percent += increment
          if (currentMsg.progress.percent > 98) currentMsg.progress.percent = 98
          currentMsg.progress.downloaded = (parseFloat(currentMsg.progress.total) * (currentMsg.progress.percent / 100)).toFixed(2)
        }
      }, 400)

      const uninstallRes = await api.post("/uninstall", { 
        dropdown: botData.entity,
        targets: selectedTargets.value
      })
      
      clearInterval(progressInterval)
      if (!isExecuting.value) return

      if (uninstallRes.data.results) {
        messages.value.splice(messages.value.length - 1, 1)
        uninstallRes.data.results.forEach(res => {
          const deviceName = getDeviceName(res.target)
          messages.value.push({
            from: 'bot',
            targetName: deviceName,
            text: `Uninstalling ${botData.entity} from ${deviceName}...`,
            automation: true,
            status: { 
              success: res.success,
              title: res.success ? `${botData.entity} uninstalled successfully` : `${botData.entity} uninstallation failed`,
              subtext: res.success ? `${botData.entity} has been removed from ${deviceName}.` : `There was an error uninstalling ${botData.entity} from ${deviceName}.`
            },
            log: res.output
          })
        })
      } else {
        currentMsg.status = { 
          success: uninstallRes.data.success,
          title: uninstallRes.data.success ? `${botData.entity} uninstalled successfully` : `${botData.entity} uninstallation failed`,
          subtext: uninstallRes.data.success ? `${botData.entity} has been removed from your system.` : `There was an error uninstalling ${botData.entity}.`
        }
        currentMsg.log = (uninstallRes.data.output || "") + (uninstallRes.data.error || "")
      }
    } else if (botData.intent === 'system_health') {
      currentMsg.automation = true
      const perfRes = await api.post("/diagnose/performance", { targets: selectedTargets.value })
      if (!isExecuting.value) return

      if (perfRes.data.results) {
        messages.value.splice(messages.value.length - 1, 1)
        perfRes.data.results.forEach(res => {
          const deviceName = getDeviceName(res.target)
          messages.value.push({
            from: 'bot',
            targetName: deviceName,
            text: `Health check for ${deviceName}`,
            automation: true,
            status: { 
              success: res.success,
              title: res.success ? 'System health check complete' : 'System health check failed',
              subtext: res.success ? 'CPU, RAM, and Disk usage have been analyzed.' : `Could not retrieve performance data for ${deviceName}.`
            },
            log: res.output
          })
        })
      } else {
        currentMsg.status = { 
          success: perfRes.data.success,
          title: perfRes.data.success ? 'System health check complete' : 'System health check failed',
          subtext: perfRes.data.success ? 'CPU, RAM, and Disk usage have been analyzed.' : 'Could not retrieve system performance data.'
        }
        currentMsg.log = perfRes.data.output
      }
    } else if (botData.intent === 'network') {
      currentMsg.automation = true
      const netRes = await api.post("/diagnose/network", { targets: selectedTargets.value })
      if (!isExecuting.value) return

      if (netRes.data.results) {
        messages.value.splice(messages.value.length - 1, 1)
        netRes.data.results.forEach(res => {
          const deviceName = getDeviceName(res.target)
          messages.value.push({
            from: 'bot',
            targetName: deviceName,
            text: `Network diagnosis for ${deviceName}`,
            automation: true,
            status: { 
              success: res.success,
              title: res.success ? 'Network diagnosis complete' : 'Network diagnosis failed',
              subtext: res.success ? 'Connectivity and configuration have been analyzed.' : `Could not complete network analysis for ${deviceName}.`
            },
            log: res.output
          })
        })
      } else {
        currentMsg.status = { 
          success: netRes.data.success,
          title: netRes.data.success ? 'Network diagnosis complete' : 'Network diagnosis failed',
          subtext: netRes.data.success ? 'Connectivity and configuration have been analyzed.' : 'Could not complete network analysis.'
        }
        currentMsg.log = netRes.data.output
      }
    } else if (botData.intent === 'reset_password') {
      currentMsg.automation = true
      const resetRes = await api.post("/action/reset-password", selectedTarget.value)
      if (!isExecuting.value) return

      currentMsg.status = { 
        success: resetRes.data.success,
        title: resetRes.data.success ? 'Password reset complete' : 'Password reset failed',
        subtext: resetRes.data.success ? 'The user password has been reset successfully.' : 'There was an error resetting the password.'
      }
      currentMsg.log = resetRes.data.output || resetRes.data.error
    } else if (botData.intent === 'clear_cache') {
      currentMsg.automation = true
      const cacheRes = await api.post("/action/clear-cache", { targets: selectedTargets.value })
      if (!isExecuting.value) return

      if (cacheRes.data.results) {
        messages.value.splice(messages.value.length - 1, 1)
        cacheRes.data.results.forEach(res => {
          const deviceName = getDeviceName(res.target)
          messages.value.push({
            from: 'bot',
            targetName: deviceName,
            text: `Clearing cache on ${deviceName}`,
            automation: true,
            status: { 
              success: res.success,
              title: res.success ? 'Cache cleared successfully' : 'Cache clearing failed',
              subtext: res.success ? 'Application and system temporary files have been removed.' : `Could not clear cache on ${deviceName}.`
            },
            log: res.output || res.error
          })
        })
      } else {
        currentMsg.status = { 
          success: cacheRes.data.success,
          title: cacheRes.data.success ? 'Cache cleared successfully' : 'Cache clearing failed',
          subtext: cacheRes.data.success ? 'Application and system temporary files have been removed.' : 'Some cache files could not be cleared.'
        }
        currentMsg.log = cacheRes.data.output || cacheRes.data.error
      }
    } else if (botData.intent === 'hard_refresh') {
      const refreshRes = await api.post("/action/hard-refresh", { targets: selectedTargets.value })
      if (!isExecuting.value) return

      if (refreshRes.data.results) {
        messages.value.splice(messages.value.length - 1, 1)
        refreshRes.data.results.forEach(res => {
          const deviceName = getDeviceName(res.target)
          messages.value.push({
            from: 'bot',
            targetName: deviceName,
            text: `Hard refresh for ${deviceName}`,
            automation: true,
            status: { 
              success: res.success,
              title: res.success ? 'Hard refresh complete' : 'Hard refresh failed',
              subtext: res.success ? 'System caches have been cleared.' : `Hard refresh failed on ${deviceName}.`
            },
            log: res.output || res.error
          })
        })
      } else {
        currentMsg.status = { 
          success: refreshRes.data.success,
          title: refreshRes.data.success ? 'Hard refresh complete' : 'Hard refresh failed',
          subtext: refreshRes.data.success ? 'System caches have been cleared.' : 'Some files could not be cleared (in use).'
        }
        currentMsg.log = refreshRes.data.output || refreshRes.data.error
      }
    } else if (botData.intent === 'check_updates') {
      currentMsg.automation = true
      const updateRes = await api.post("/action/check-updates", { targets: selectedTargets.value })
      if (!isExecuting.value) return

      if (updateRes.data.results) {
        messages.value.splice(messages.value.length - 1, 1)
        updateRes.data.results.forEach(res => {
          const deviceName = getDeviceName(res.target)
          messages.value.push({
            from: 'bot',
            targetName: deviceName,
            text: `Windows Update check for ${deviceName}`,
            automation: true,
            status: { 
              success: res.success,
              title: res.success ? 'Update check complete' : 'Update check failed',
              subtext: res.success 
                ? `Found ${res.updates_count} pending updates. ${res.pending_reboot ? 'A system reboot is required.' : 'No reboot pending.'}`
                : (res.error || `Could not check updates for ${deviceName}.`)
            },
            log: res.output
          })
        })
      } else {
        currentMsg.status = { 
          success: updateRes.data.success,
          title: updateRes.data.success ? 'Update check complete' : 'Update check failed',
          subtext: updateRes.data.success 
            ? `Found ${updateRes.data.updates_count} pending updates. ${updateRes.data.pending_reboot ? 'A system reboot is required.' : 'No reboot pending.'}`
            : (updateRes.data.error || 'Could not check for Windows updates.')
        }
        currentMsg.log = updateRes.data.output || updateRes.data.error
      }
    } else if (botData.intent === 'install_updates') {
      currentMsg.automation = true
      const updateRes = await api.post("/action/install-updates", { targets: selectedTargets.value })
      if (!isExecuting.value) return

      if (updateRes.data.results) {
        messages.value.splice(messages.value.length - 1, 1)
        updateRes.data.results.forEach(res => {
          const deviceName = getDeviceName(res.target)
          messages.value.push({
            from: 'bot',
            targetName: deviceName,
            text: `Installing updates on ${deviceName}...`,
            automation: true,
            status: { success: res.success },
            log: res.output
          })
        })
      } else {
        currentMsg.status = { success: updateRes.data.success }
        currentMsg.log = updateRes.data.output || updateRes.data.error
      }
    } else if (botData.intent === 'restart_system') {
      currentMsg.automation = true
      const restartRes = await api.post("/action/restart-system", { targets: selectedTargets.value })
      if (!isExecuting.value) return

      if (restartRes.data.results) {
        messages.value.splice(messages.value.length - 1, 1)
        restartRes.data.results.forEach(res => {
          const deviceName = getDeviceName(res.target)
          messages.value.push({
            from: 'bot',
            targetName: deviceName,
            text: `Restarting ${deviceName}...`,
            automation: true,
            status: { success: res.success },
            log: res.output
          })
        })
      } else {
        currentMsg.status = { success: restartRes.data.success }
        currentMsg.log = restartRes.data.output || restartRes.data.error
      }
    } else if (botData.intent === 'reset_update') {
      currentMsg.automation = true
      const resetRes = await api.post("/action/reset-update", { targets: selectedTargets.value })
      if (!isExecuting.value) return

      if (resetRes.data.results) {
        messages.value.splice(messages.value.length - 1, 1)
        resetRes.data.results.forEach(res => {
          const deviceName = getDeviceName(res.target)
          messages.value.push({
            from: 'bot',
            targetName: deviceName,
            text: `Resetting Windows Update on ${deviceName}`,
            automation: true,
            status: { success: res.success },
            log: res.output || res.error
          })
        })
      } else {
        currentMsg.status = { success: resetRes.data.success }
        currentMsg.log = resetRes.data.output || resetRes.data.error
      }
    } else if (botData.intent === 'onboarding') {
      currentMsg.automation = true
      const role = botData.meta?.role || 'Standard'
      const onboardRes = await api.post("/action/onboard", { 
        targets: selectedTargets.value,
        role: role
      })
      if (!isExecuting.value) return

      if (onboardRes.data.results) {
        messages.value.splice(messages.value.length - 1, 1)
        onboardRes.data.results.forEach(res => {
          const deviceName = getDeviceName(res.target)
          messages.value.push({
            from: 'bot',
            targetName: deviceName,
            text: `Onboarding process for ${deviceName}`,
            automation: true,
            status: { success: res.success },
            log: res.output || res.error
          })
        })
      } else {
        currentMsg.status = { success: onboardRes.data.success }
        currentMsg.log = onboardRes.data.output || onboardRes.data.error
      }
    } else if (botData.intent === 'security_check') {
      currentMsg.automation = true
      const securityRes = await api.post("/diagnose/security", { targets: selectedTargets.value })
      if (!isExecuting.value) return

      const formatSecurityLog = (res) => {
        if (!res.security_status) return res.output || res.error || "No data available"
        
        return `Security Status: ${res.security_status}
Real-time Protection: ${res.real_time_protection ? 'Enabled' : 'Disabled'}
Threats Detected: ${res.threats_detected}
Disk Usage: ${res.disk_usage_percent}%
Battery: ${res.battery_percent !== null ? res.battery_percent + '%' : 'N/A'}
Time Service: ${res.time_service_running ? 'Running' : 'Stopped'}`
      }

      const getSecuritySubtext = (res) => {
        if (!res.success) return `Security check failed.`
        if (res.security_status) {
           return `Status: ${res.security_status} | Threats: ${res.threats_detected} | Disk: ${res.disk_usage_percent}%`
        }
        return 'Antivirus and Firewall status have been verified.'
      }

      if (securityRes.data.results) {
        messages.value.splice(messages.value.length - 1, 1)
        securityRes.data.results.forEach(res => {
          const deviceName = getDeviceName(res.target)
          messages.value.push({
            from: 'bot',
            targetName: deviceName,
            text: `Security check for ${deviceName}`,
            automation: true,
            status: { 
              success: res.success,
              title: res.success ? 'Security check complete' : 'Security check failed',
              subtext: getSecuritySubtext(res)
            },
            log: formatSecurityLog(res)
          })
        })
      } else {
        const res = securityRes.data
        currentMsg.status = { 
          success: res.success,
          title: res.success ? 'Security check complete' : 'Security check failed',
          subtext: getSecuritySubtext(res)
        }
        currentMsg.log = formatSecurityLog(res)
      }
    } else if (botData.intent === 'network_details') {
      currentMsg.automation = false
    }
    
    await saveCurrentSession()
  } catch (e) {
    const lastMsg = messages.value[messages.value.length - 1]
    if (lastMsg && lastMsg.from === 'bot' && lastMsg.automation && !lastMsg.status) {
      lastMsg.status = {
        success: false,
        title: 'Operation failed',
        subtext: e.code === 'ECONNABORTED'
          ? "The request timed out. The task might still be running in the background."
          : (e.response?.data?.error || e.message || "Service unavailable.")
      }
    } else if (isExecuting.value) {
      messages.value.push({ from: 'bot', text: "Service unavailable." })
    }
  } finally {
    isExecuting.value = false
    isTyping.value = false
    scrollToBottom()
  }
}
</script>

<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  font-family: 'Manrope', sans-serif;
}

.assistiq-wrapper {
  display: flex;
  min-height: 100vh;
  background-image: url('/Assist IQ .jpg');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  font-family: 'Manrope', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

/* Top Header */
.top-header {
  height: 72px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 32px;
  background: transparent;
  z-index: 10;
}

.header-left {
  display: flex;
  align-items: center;
}

.logo-section {
  display: flex;
  align-items: center;
  height: 32px;
}

.main-logo {
  height: 28px;
  max-width: 160px;
  object-fit: contain;
  width: 85%;
}

.logo-icon-img {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  overflow: hidden;
}

.bot-logo-img {
  height: 100%;
  width: auto;
  object-fit: contain;
}

.bot-icon-img-wrapper {
  width: 40px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
}

.connect-device-btn {
  text-transform: none;
  font-weight: 600;
  color: #4b4b4b;
  border: 1.5px solid #e0e0e0;
}

/* Content Body */
.content-body {
  flex: 1;
  display: flex;
}

/* Sidebar */
.left-sidebar {
  width: 252px;
  height: 100vh;
  display: flex;
  flex-direction: column;
  padding: 24px 16px;
  background: white;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: sticky;
  top: 0;
  border-right: 1px solid rgba(0, 0, 0, 0.05);
}

.left-sidebar.collapsed {
  width: 78px;
  min-height: 100vh;
  padding: 24px 12px;
  align-items: center;
  transform: rotate(0deg);
  opacity: 1;
}

.collapsed-header-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  gap: 32px;
}

.collapsed-toggle {
  color: #d1d1e9; /* Light purple/grey color from screenshot */
}

.left-sidebar.collapsed .sidebar-header {
  flex-direction: column-reverse;
  gap: 20px;
  margin-bottom: 40px;
  padding: 0;
}

.left-sidebar.collapsed .sidebar-actions {
  align-items: center;
  width: 100%;
}

.left-sidebar.collapsed .sidebar-action-btn {
  width: 44px;
  height: 44px;
  padding: 0;
  justify-content: center;
}

.left-sidebar.collapsed .sidebar-footer {
  display: flex;
  justify-content: center;
  width: 100%;
  padding-left: 0;
  padding-right: 0;
}

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 40px;
  padding: 0 8px;
}

.collapsed-logo-svg {
  width: 40px;
  height: auto;
}

.sidebar-toggle-svg {
  width: 20px;
  height: auto;
  display: block;
}

.sidebar-toggle-btn {
  padding: 4px;
  border: none;
  border-radius: 8px;
  color: #D1D1E9;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.sidebar-toggle-btn:hover {
  background: rgba(0, 0, 0, 0.05);
  color: #757575;
}

.sidebar-toggle-icon {
  display: block;
}

.sidebar-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 32px;
}

.sidebar-action-btn {
  width: 100%;
  justify-content: flex-start;
  padding: 8px 16px;
  border-radius: 25px;
  color: #1a1a1a;
  font-weight: 500;
  text-transform: none;
  transition: all 0.2s ease;
  height: 42px;
}

.sidebar-action-btn:hover {
  background: #F8F9FF;
  color: #4F37FD;
}

.icon-gap {
  margin-right: 12px;
}

.left-sidebar.collapsed .sidebar-actions {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
}

.left-sidebar.collapsed .sidebar-action-btn {
  width: 48px;
  height: 48px;
  padding: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 4px 0;
  border-radius: 12px;
}

.connect-device-btn-fixed {
  background: white !important;
  color: #1a1a1a !important;
  border: none !important;
  text-transform: none;
  font-weight: 500;
  padding: 8px 20px;
  font-size: 14px;
  border-radius: 20px !important;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08) !important;
}

.chat-header-actions {
  display: flex;
  justify-content: flex-end;
  padding: 25px 40px 10px;
  z-index: 100;
  position: relative;
  background: transparent;
  right: -35px;
  top: 0;
}

.connected-device-pill {
  min-width: 140px;
  width: auto;
  height: 40px;
  background: white;
  border-radius: 30px;
  display: flex;
  align-items: center;
  padding: 0 18px;
  gap: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  cursor: default;
}

.device-info-section {
  display: flex;
  align-items: center;
  gap: 12px;
  overflow: visible;
  cursor: pointer;
  transition: opacity 0.2s;
}

.device-info-section:hover {
  opacity: 0.8;
}

.device-name-text {
  font-family: 'Manrope', sans-serif;
  font-size: 16px;
  font-weight: 500;
  color: #1a1a1a;
  white-space: nowrap;
}

.separator-line {
  width: 1px;
  height: 24px;
  background: #E0E0E0;
}

.disconnect-section {
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding: 4px;
  transition: opacity 0.2s;
}

.disconnect-section:hover {
  opacity: 0.7;
}

.history-section {
  flex: 1;
  overflow-y: auto;
  margin-right: -8px;
  padding-right: 8px;
}

.history-section::-webkit-scrollbar {
  width: 5px;
}

.history-section::-webkit-scrollbar-track {
  background: transparent;
}

.history-section::-webkit-scrollbar-thumb {
  background: #E0E0E0;
  border-radius: 10px;
}

.history-section::-webkit-scrollbar-thumb:hover {
  background: #BDBDBD;
}

.history-label {
  font-size: 14px;
  font-weight: 600;
  color: #999;
  padding: 8px 16px;
  margin-bottom: 8px;
  text-transform: none;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-radius: 25px;
  transition: all 0.2s;
}

.history-label:hover {
  background: #F8F9FF;
  color: #4F37FD;
}

.recent-activities-header {
  margin-top: 8px;
  user-select: none;
  font-size: 14px;
  color: #8E8E8E;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.arrow-clickable-wrapper {
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  border-radius: 4px;
  transition: opacity 0.2s;
}

.arrow-clickable-wrapper:hover {
  opacity: 0.7;
}

.transition-transform {
  transition: transform 0.3s ease;
}

.history-items-list {
  overflow: hidden;
}

.history-title-container {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
}

.pinned-icon-small {
  color: #D1D1E9;
  flex-shrink: 0;
}

.history-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px;
  border-radius: 25px;
  margin-bottom: 4px;
  cursor: pointer;
  transition: all 0.2s;
  color: #1a1a1a;
  height: 44px;
}

.history-item:hover {
  background: #F8F9FF;
  color: #4F37FD;
}

.history-item:hover .pinned-icon-small {
  color: #4F37FD;
}

.history-item.active {
  background: #4F37FD;
  color: white;
}

.history-item.active .pinned-icon-small {
  color: white;
}

.history-item.active:hover {
  background: #4F37FD;
  color: white;
}

.connection-loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  backdrop-filter: blur(4px);
}

.loading-card {
  width: 500px;
  height: 517px;
  max-width: 95vw;
  border-radius: 30px !important;
  background: white;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
}

.loading-lottie {
  width: 70px;
  height: 70px;
  margin-bottom: 1px;
}

.loading-text {
  font-family: 'Manrope', sans-serif;
  font-size: 18px;
  font-weight: 600;
  color: #1A1A1A;
  letter-spacing: -0.01em;
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

.history-menu-btn {
  opacity: 0.6;
  margin-left: 4px;
}

.history-item:hover .history-menu-btn {
  opacity: 1;
}

.history-item.active .history-menu-btn {
  opacity: 1;
  color: white;
}

.history-q-menu {
  border-radius: 30px ;
  box-shadow: 0 10px 40px rgba(0,0,0,0.1) ;
  padding: 12px ;
  background: white ;
  border: 1px solid rgba(0,0,0,0.05);
  font-family: 'Manrope', sans-serif ;
}

/* Search Dialog Styles */
.search-dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.05);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
}

.search-dialog-container {
  position: relative;
  width: 696px;
  height: 450px;
  background: #FFFFFF;
  border-radius: 30px;
  opacity: 1;
  display: flex;
  flex-direction: column;
  padding: 24px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
  font-family: 'Manrope', sans-serif;
}

.search-dialog-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
}

.search-input-wrapper {
  flex: 1;
  height: 50px;
  background: #F5F5F5;
  border-radius: 25px;
  display: flex;
  align-items: center;
  padding: 0 16px;
}

.search-chat-input {
  flex: 1;
  border: none;
  background: transparent;
  outline: none;
  font-size: 16px;
  color: #1a1a1a;
  font-family: 'Manrope', sans-serif;
}

.clear-search-btn {
  color: #1a1a1a;
}

.search-close-btn {
  background: #F5F5F5;
  color: #1a1a1a;
  text-transform: none;
  font-weight: 500;
  padding: 0 20px;
  height: 40px;
}

.search-results-list {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.search-result-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-radius: 12px;
  transition: background 0.2s;
  cursor: pointer;
}

.search-result-item:hover {
  background: #F9F9F9;
}

.result-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.result-title {
  font-size: 16px;
  font-weight: 600;
  color: #1a1a1a;
}

.result-subtitle {
  font-size: 14px;
  color: #8E8E8E;
}

.result-date {
  font-size: 14px;
  color: #8E8E8E;
}

.history-menu-item {
  border-radius: 20px;
  margin-bottom: 0;
  padding: 12px 18px;
  color: #1a1a1a;
  min-height: 45px;
  transition: all 0.2s;
  font-weight: 500;
  font-size: 14px;
  min-width: 160px;
}

.history-menu-item:last-child {
  margin-bottom: 0;
}

.history-menu-item .q-item__section--avatar {
  min-width: 35px;
  color: #1a1a1a;
  padding-right: 0;
}

/* Specific style for Pin Chat item to match UI image */
.history-menu-item:not(.delete-item) {
  color: #1a1a1a;
  background: transparent;
}

.history-menu-item:not(.delete-item) .q-item__section--avatar {
  color: #1a1a1a;
}

.history-menu-item:hover {
  background: #F5F5F5;
}

.history-menu-item.delete-item {
  color: #1a1a1a;
}

.history-menu-item.delete-item:hover {
  background: #F5F5F5 !important;
  color: #1a1a1a;
}

.history-menu-item.delete-item:hover .q-item__section--avatar {
  color: #1a1a1a;
}

.history-title {
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
  margin-right: 8px;
}

.history-menu-btn {
  opacity: 0;
  transition: opacity 0.2s;
}

.history-item:hover .history-menu-btn {
  opacity: 0.6;
}

.sidebar-footer {
  margin-top: auto;
  padding-top: 5px;
  background: white;
  box-shadow: 0px -14px 30px #f2f2f282;
  border-radius: 22px;
}

.profile-menu {
  width: 180px !important;
  border-radius: 18px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08) !important;
  overflow: hidden;
  background: white !important;
  font-family: 'Manrope', sans-serif !important;
  padding: 4px !important;

}

.profile-menu-list {
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}




.profile-menu-item {
  min-height: 42px;
  padding: 0 14px;
  color: #1a1a1a;
  border-radius: 20px;
}

.profile-menu-item:hover {
  background: #f5f5f5;
}

.profile-menu-text {
  font-size: 14px;
  font-weight: 500;
  margin-left: 0;
}

.profile-menu-item .q-item__section--avatar {
  min-width: 32px;
  padding-right: 0;
}

/* Settings Dialog Styles */
.settings-card {
  width: 500px;
  max-width: 90vw;
  border-radius: 24px !important;
  background: white;
  padding: 8px;
}

.settings-header {
  padding: 16px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.settings-title {
  font-weight: 700;
  font-size: 20px;
  color: #1a1a1a;
}

.settings-body {
  padding: 0 24px 24px;
}

.profile-card {
  background: #F8F9FF;
  border-radius: 40px;
  padding: 16px 24px;
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 32px;
}

.profile-avatar {
  border: 2px solid white;
}

.profile-info {
  flex: 1;
}

.profile-name {
  font-weight: 600;
  font-size: 16px;
  color: #1a1a1a;
}

.profile-email {
  font-size: 13px;
  color: #8e8e8e;
}

.logout-btn-pill {
  background: #FFEBEE !important;
  color: #C62828 !important;
  text-transform: none;
  font-weight: 600;
  padding: 4px 16px;
  font-size: 13px;
}

.settings-section {
  margin-bottom: 24px;
}

.delete-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 4px;
}

.section-label {
  font-size: 16px;
  color: #1a1a1a;
  font-weight: 500;
}

.section-title {
  font-size: 16px;
  color: #848484;
  margin-bottom: 12px;
  padding-left: 4px;
}

.delete-btn-pill {
  color: #C62828 !important;
  text-transform: none;
  font-weight: 600;
  padding: 4px 16px;
  font-size: 13px;
  border: 1px solid #FFCDD2;
}

.about-list {
  display: flex;
  flex-direction: column;
}

.about-item-modern {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 4px;
  cursor: pointer;
  transition: opacity 0.2s;
}

.about-item-modern:hover {
  opacity: 0.7;
}

.about-item-modern span {
  font-size: 16px;
  color: #1a1a1a;
}

.user-profile {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 25px;
  background: transparent;
  cursor: pointer;
  transition: background 0.2s;
}

.collapsed-profile {
  padding: 8px !important;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 50% !important;
}

.user-profile:hover {
  background: #F5F5F5;
}

.user-name {
  font-size: 14px;
  font-weight: 600;
  color: #1a1a1a;
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Chat Main */
.chat-main {
  flex: 1;
  display: flex;
  justify-content: center;
}

.chat-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  max-width: 1000px;
  width: 100%;
  position: relative;
  overflow: hidden;
}

.chat-window {
  flex: 1;
  overflow-y: auto;
  padding: 40px 40px 0;
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none;  /* IE and Edge */
}

.chat-window::-webkit-scrollbar {
  display: none; /* Chrome, Safari and Opera */
}

/* Welcome Screen */
.welcome-screen {
  text-align: center;
  margin-top: 5vh;
}

.welcome-title {
  font-family: 'Manrope', sans-serif;
  font-weight: 600;
  font-size: 28px;
  line-height: 120%;
  letter-spacing: 0%;
  text-align: center;
  background: linear-gradient(90deg, #00BCC9 14.41%, #4C36E4 50.44%, #CF20AE 86.47%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: 12px;
}

.welcome-subtitle {
  font-size: 16px;
  color: #999;
  margin-bottom: 40px;
}

/* Action Cards */
.action-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 38px;
  width: 676px;
  height: 150px;
  margin: 0 auto;
}

.action-card {
  background: #FFFFFF80;
  width: 200px;
  height: 150px;
  border-radius: 30px;
  padding: 24px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  text-align: left;
  display: flex;
  flex-direction: column;
  transform: rotate(0deg);
  opacity: 1;
}

.action-card:hover {
  background: #FFFFFF;
  transform: translateY(-8px);
  box-shadow: 0 16px 48px rgba(0,0,0,0.08);
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.card-title {
  font-size: 14px;
  font-weight: 700;
  color: #1a1a1a;
}

.card-icon-circle {
  width: 32px;
  height: 32px;
  background: #f1f1eb;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #1a1a1a;
}

.card-description {
  font-size: 13px;
  color: #777;
  line-height: 1.6;
}

/* Quick Pills */
.quick-pills-container {
  background: white;
  border-radius: 50px;
  padding: 32px;
  width: 990px;
  height: 220px;
  
}

.floating-pills {
  margin-bottom: 20px;
}

.fade-up-enter-active,
.fade-up-leave-active {
  transition: all 0.3s ease;
}

.fade-up-enter-from,
.fade-up-leave-to {
  opacity: 0;
  transform: translateY(20px);
}

.quick-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  justify-content: center;
}

.pill-btn {
  background: #f2f2f7;
  border: none;
  border-radius: 16px;
  padding: 12px 24px;
  font-size: 14px;
  color: #4b4b4b;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.pill-btn:hover {
  background: #e5e5ea;
}

/* Messages */
.message-wrapper {
  margin-bottom: 24px;
}

.user-message-container {
  display: flex;
  justify-content: flex-end;
}

.message-header {
  background: white;
  color: #4b4b4b;
  padding: 12px 20px;
  border-radius: 25px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.04);
  font-size: 14px;
}

.bot-message-container {
  display: flex;
  gap: 16px;
}

.bot-icon-wrapper {
  flex-shrink: 0;
}

.bot-icon {
  width: 32px;
  height: 32px;
  background: linear-gradient(135deg, #6B7BFF 0%, #9B4DFF 100%);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.bot-content-wrapper {
  flex: 1;
  min-width: 0;
}

.bot-device-info {
  margin-bottom: 12px;
  font-size: 14px;
  display: flex;
  align-items: center;
}

.device-label {
  font-weight: 700;
  color: #444;
  margin-right: 6px;
}

.device-value {
  color: #666;
  font-weight: 500;
}

.log-expansion {
  margin-top: 8px;
}

.log-expansion :deep(.q-focus-helper) {
  display: none !important;
}

.log-content {
  background: #1e293b;
  color: #f8fafc;
  padding: 12px;
  border-radius: 4px;
  font-family: 'Fira Code', monospace;
  font-size: 12px;
  max-height: 300px;
  overflow-y: auto;
  margin: 0;
  white-space: pre-wrap;
}

/* Status Items */
.status-item {
  background: white;
  border-radius: 30px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.04);
  margin-top: 12px;
}

.processing-container {
  display: flex;
  flex-direction: column;
  background: transparent !important;
  box-shadow: none !important;
  padding: 0 !important;
}

.processing-status-line {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 4px;
}

.hourglass-icon {
  display: flex;   
  align-items: center;
  justify-content: center;
}

.progress-card {
  background: white;
  border-radius: 30px;
  padding: 24px 32px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.05);
  margin-top: 8px;
  position: relative;
}

.progress-info-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  gap: 20px;
}

.software-info {
  display: flex;
  align-items: baseline;
  gap: 12px;
  flex: 1;
}

.software-name {
  font-weight: 700;
  font-size: 16px;
  color: #1a1a1a;
}

.software-version {
  font-size: 14px;
  color: #999;
}

.progress-stats-group {
  display: flex;
  align-items: center;
  gap: 24px;
}

.progress-downloaded {
  font-size: 14px;
  color: #999;
}

.progress-percentage {
  font-weight: 700;
  font-size: 16px;
  color: #1a1a1a;
  min-width: 40px;
  text-align: right;
}

.progress-close-btn {
  cursor: pointer;
  color: #1a1a1a;
  display: flex;
  align-items: center;
  padding: 4px;
  transition: opacity 0.2s;
}

.progress-close-btn:hover {
  opacity: 0.6;
}

.progress-bar-container {
  height: 8px;
  background: #f0f0f0;
  border-radius: 4px;
  overflow: hidden;
  width: 100%;
}

.progress-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #00BCC9 0%, #4C36E4 100%);
  border-radius: 4px;
  transition: width 0.3s ease;
}

.status-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 4px;
}

.status-title {
  font-weight: 600;
  color: #1a1a1a;
  font-size: 15px;
}

.status-icon {
  width: 20px;
  height: 20px;
  object-fit: contain;
}

.catalog-loading-icon {
  width: 40px;
  height: 40px;
  object-fit: contain;
}

.typing-indicator-wrapper {
  display: flex;
  align-items: center;
  background: white;
  padding: 8px 16px;
  border-radius: 20px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.04);
}

.status-subtext {
  display: block;
  font-size: 14px;
  color: #999;
  margin-left: 32px;
}

.rotating-icon {
  animation: rotate 2s linear infinite;
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Update Card */
.update-card {
  background: white;
  border-radius: 20px;
  padding: 24px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.05);
  margin-top: 16px;
}

.update-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 4px;
}

.update-title {
  font-weight: 600;
  color: #1a1a1a;
  font-size: 15px;
}

.update-subtitle {
  font-size: 14px;
  color: #999;
  margin-left: 32px;
  margin-bottom: 16px;
}

.update-info-box {
  background: #fcfcfc;
  border: 1px solid #f0f0f0;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 20px;
}

.update-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.update-label {
  color: #999;
  font-size: 13px;
}

.update-value {
  font-weight: 600;
  color: #1a1a1a;
  font-size: 13px;
}

.update-actions {
  display: flex;
  gap: 12px;
}

.update-btn {
  padding: 0 24px;
  text-transform: none;
  font-weight: 600;
}

.keep-btn {
  background: #f2f2f2;
  color: #777;
  text-transform: none;
  font-weight: 600;
}

/* Log Expansion */
.log-expansion {
  margin-top: 12px;
}

.log-content {
  background: #1E1E1E;
  color: #D4D4D4;
  padding: 16px;
  border-radius: 8px;
  font-size: 12px;
  font-family: 'Monaco', 'Courier New', monospace;
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 200px;
  overflow-y: auto;
}

/* Typing Indicator */
.typing-indicator {
  display: flex;
  gap: 6px;
  padding: 12px 16px;
}

.typing-indicator span {
  width: 8px;
  height: 8px;
  background: #BDBDBD;
  border-radius: 50%;
  animation: typing 1.4s infinite;
}

.typing-indicator span:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-indicator span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typing {
  0%, 60%, 100% { transform: translateY(0); }
  30% { transform: translateY(-10px); }
}

/* Input Section */
.input-section {
  padding: 20px 0 40px;
  z-index: 10;
  margin-top: -20px;
}

.input-container {
  background: white;
  border-radius: 40px;
  padding: 10px 10px 10px 32px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 12px 48px rgba(0,0,0,0.1);
  width: 930px;
  margin: 0 auto;
  height: 60px;
}

.chat-input {
  flex: 1;
  border: none;
  outline: none;
  font-size: 16px;
  color: #1a1a1a;
  background: transparent;
}

.send-btn {
  width: 44px;
  height: 44px;
  min-width: 44px;
  background: #5d5ce6 !important;
  transform: rotate(0deg);
  opacity: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Dialogs */
.device-dialog {
  width: 500px;
  max-width: 95vw;
  border-radius: 40px !important;
  background: white;
  display: flex;
  flex-direction: column;
  padding: 16px;
  overflow: hidden;
  height: 517px;
}

.device-form-dialog {
  width: 500px;
  height: 550px;
  padding: 24px 32px;
  border-radius: 40px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.device-form-dialog .dialog-header {
  padding: 16px 8px 24px !important;
}

.device-form-dialog .q-card__section {
  padding-left: 8px !important;
  padding-right: 8px;
}

.device-form-dialog .dialog-actions {
  padding: 16px 8px 8px;
}

.no-padding-side {
  padding-left: 0 !important;
  padding-right: 0 !important;
}

.title-bold {
  font-weight: 600 !important;
  font-size: 23px !important;
  color: #1a1a1a;
}

.dialog-header {
  padding: 24px 24px 12px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.close-btn {
  color: #1a1a1a;
}

.update-status {
  font-size: 13px;
  color: #999;
  font-weight: 600;
}

.refresh-btn {
  transition: transform 0.3s ease;
}

.refresh-btn:hover {
  background: #F0F2F5;
}

.select-all-btn {
  font-size: 15px;
  font-weight: 600;
  padding: 0;
  min-height: auto;
}

.device-list {
  padding: 8px 16px;
  flex: 1;
}

.device-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  background: #F8F9FB;
  border-radius: 60px;
  margin-bottom: 24px;
  transition: all 0.2s;
  cursor: pointer;
  border: 1px solid transparent;
  height: 70px;
}

.device-item:hover {
  background: #F0F2F5;
}

.device-item-selected {
  background: #F8F9FB;
}

.device-info {
  display: flex;
  align-items: center;
  gap: 20px;
}

.device-icon-wrapper {
  width: 52px;
  height: 52px;
  background: #F3F4F9;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.device-details {
  display: flex;
  flex-direction: column;
}

.device-name {
  font-weight: 500;
  color: #1a1a1a;
  font-size: 15px;
  white-space: nowrap;
}

.status-badge {
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 20px;
  margin-left: 13px;
  text-transform: capitalize;
}

.status-online {
  background: #E8FCEF;
  color: #00D23F;
}

.status-offline {
  background: #FFF0F0;
  color: #FF5C5C;
}

.device-ip {
  color: #999;
  font-size: 12px;
  margin-top: 4px;
}

.device-actions {
  display: flex;
  align-items: center;
}

.selection-circle {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.empty-circle {
  width: 20px;
  height: 20px;
  border: 2px solid #E0E0E0;
  border-radius: 50%;
}

.dialog-actions-footer {
  padding: 16px 32px 16px;
  display: flex;
  justify-content: flex-end;
  gap: 16px;
}

.select-mode-btn, .cancel-selection-btn {
  background: #F4F4EE;
  color: #444;
  text-transform: none;
  font-weight: 600;
  font-size: 14px;
  padding: 12px 28px;
  border-radius: 30px;
}

.add-device-btn-new, .connect-selection-btn {
  background: #4F37FD;
  color: white;
  text-transform: none;
  font-weight: 600;
  font-size: 14px;
  padding: 12px 28px;
  border-radius: 30px;
}

.connect-selection-btn:disabled {
  opacity: 0.6;
}

.empty-device-list {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}


.add-device-btn-custom {
  width: 158px;
  height: 42px;
  background: #5d5ce6;
  color: white;
  border-radius: 20px;
  padding: 10px 18px;
  text-transform: none;
  font-weight: 600;
  font-size: 13px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}
.text-primaryy {
  width: 158px;
  height: 42px;
  background: #5d5ce6;
  color: white;
  border-radius: 20px;
  padding: 10px 18px;
  text-transform: none;
  font-weight: 600;
  font-size: 13px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.form-group {
  margin-bottom: 18px;
}
.pill-input {
  background: #F3F3F3;
  border-radius: 30px;
  width: 100%;
  height: 48px;
  border: none;
}

.pill-input .q-field__control {
  border-radius: 30px;
  height: 48px;
  min-height: 48px;
  display: flex;
  align-items: center;
}

.pill-input .q-field__control:before,
.pill-input .q-field__control:after {
  display: none;
}

.pill-input .q-field__native {
  padding: 0 24px;
  font-size: 15px;
  text-align: center;
}


.form-label {
  font-size: 13px;
  color: #9e9e9e;
  margin-bottom: 6px;
  display: block;
  font-weight: 500;
  font-family: 'Manrope', sans-serif;
}
.form-input .q-field__control {
  background: #f5f5f5;
  border-radius: 24px  ;
  
}

.form-input .q-field__control:before,
.form-input .q-field__control:after {
  display: none;
}
.clean-input {
  background: #F6F6F6;
  border-radius: 24px;
  border: none;
  font-family: 'Manrope', sans-serif;
}

.clean-input .q-field__control {
  background: transparent;
  box-shadow: none;
}

.clean-input .q-field__native {
  padding: 14px 18px;
}

.clean-input.q-field--outlined .q-field__control:before,
.clean-input.q-field--outlined .q-field__control:after {
  display: none;
}

.clean-input-text {
  font-size: 15px;
  color: #333;
}

.clean-input ::placeholder {
  color: #B5B5B5;
  font-weight: 400;
}


.cancel-btn {
  background: #f1f1f1;
  color: #777;
  padding: 8px 22px;
  text-transform: none;
}

.add-btn {
  background: #4f46e5; 
  color: white;
  padding: 8px 28px;
  text-transform: none;
}
.error-message {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #d32f2f;
  font-size: 13px;
  margin-top: 8px;
}
/* Scrollbar */
.scroll::-webkit-scrollbar {
  width: 5px;
}
.scroll::-webkit-scrollbar-track {
  background: transparent;
}
.scroll::-webkit-scrollbar-thumb {
  background: rgba(0,0,0,0.1);
  border-radius: 10px;
}

/* Device Options Menu */
.device-options-menu {
  width: 160px;
  border-radius: 20px;
  background: white;
  box-shadow: 0 8px 32px rgba(0,0,0,0.12);
  padding: 8px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  font-family: 'Manrope', sans-serif;
}

.device-options-menu .q-list {
  padding: 0;
}

.device-options-menu .q-item {
  min-height: 30px;
  padding: 5px 18px;
  border-radius: 30px ;
  transition: all 0.2s ease;
  width: 125px;
}

.menu-item-remove {
  color: #1A1A1A;
  font-weight: 600;
  margin-bottom: 4px;
}

.menu-item-remove:hover {
  background: #F8F9FF;
}

.menu-item-default {
  color: #1a1a1a;
  font-weight: 500;
}

.menu-item-default:hover {
  background: #4C36E40D ;
}

/* Notification Toast */
.notification-toast {
  position: fixed;
  top: 32px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10000;
  background: white;
  border-radius: 100px;
  padding: 8px 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 380px;
  border: 1px solid rgba(0, 0, 0, 0.05);
}

.notification-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.notification-icon {
  display: flex;
  align-items: center;
  justify-content: center;
}

.warning-icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
}

.notification-message {
  font-family: 'Manrope', sans-serif;
  font-size: 16px;
  font-weight: 500;
  color: #1a1a1a;
  white-space: nowrap;
}

.notification-action-btn {
  background: none;
  border: none;
  color: #4F37FD;
  font-weight: 600;
  font-size: 16px;
  cursor: pointer;
  margin-left: 12px;
  padding: 4px 8px;
  font-family: 'Manrope', sans-serif;
}

.notification-action-btn:hover {
  opacity: 0.8;
}

/* Transitions */
.toast-fade-enter-active,
.toast-fade-leave-active {
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.toast-fade-enter-from,
.toast-fade-leave-to {
  opacity: 0;
  transform: translate(-50%, -40px);
}
div.borde-menu {
  border-radius: 18px;
  overflow: hidden;
}
</style>