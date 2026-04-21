<template>
  <q-page class="q-pa-lg page-background">
    <div v-if="!showAddEmployee && !showAccountCreation && !showProfile && !showOffboarded && !showMonitoring && !showEditBasicModal">
      <div class="row items-center q-mb-lg">
        <div class="text-h5 text-weight-bold text-black">Team</div>
      </div>

      <!-- Filter bar -->
      <div class="row items-center q-mb-lg q-gutter-sm flex-nowrap">
        <!-- Search -->
        <q-input
          v-model="searchQuery"
          placeholder="Search Employees..."
          outlined
          rounded
          dense
          bg-color="white"
          class="search-input filter-search"
        >
          <template v-slot:prepend>
            <SearchIcon :size="18" class="text-grey-5" />
          </template>
        </q-input>

        <!-- Role filter -->
        <div class="filter-pill-wrap">
          <q-btn-dropdown
            flat no-caps
            class="filter-pill"
            :label="roleFilter === 'All' ? 'Role: All' : 'Role: ' + roleFilter"
            dropdown-icon="keyboard_arrow_down"
          >
            <q-list dense style="min-width: 140px">
              <q-item
                v-for="r in roleOptions"
                :key="r"
                clickable v-close-popup
                @click="roleFilter = r"
                :class="roleFilter === r ? 'text-primary' : ''"
              >
                <q-item-section>{{ r }}</q-item-section>
              </q-item>
            </q-list>
          </q-btn-dropdown>
        </div>

        <!-- Email filter -->
        <div class="filter-pill-wrap">
          <q-btn-dropdown
            flat no-caps
            class="filter-pill"
            :label="emailFilter === 'All' ? 'Email: All' : 'Email: ' + emailFilter"
            dropdown-icon="keyboard_arrow_down"
          >
            <q-list dense style="min-width: 150px">
              <q-item v-for="ef in emailFilterOptions" :key="ef" clickable v-close-popup @click="emailFilter = ef" :class="emailFilter === ef ? 'text-primary' : ''">
                <q-item-section>{{ ef }}</q-item-section>
              </q-item>
            </q-list>
          </q-btn-dropdown>
        </div>

        <q-space />

        <!-- Offboarded button -->
        <q-btn
          flat no-caps
          class="offboarded-list-btn"
          @click="showOffboarded = true"
        >
          <UserRoundMinusIcon :size="18" class="q-mr-xs" />
          Offboarded
        </q-btn>

        <!-- Add New button -->
        <q-btn unelevated no-caps class="add-new-btn" icon="add" label="Add Employee" @click="openAddEmployee" />

      </div>

      <div class="row q-col-gutter-lg">
        <div v-for="employee in filteredEmployees" :key="employee.id" class="col-12 col-sm-6 col-md-4">
          <q-card flat class="employee-card column justify-between full-height">
            <div class="employee-header-box row no-wrap items-center relative-position" style="border-radius: 20px;">
              <q-avatar size="56px" class="q-mr-md">
                <img :src="employee.avatar" alt="Avatar" />
              </q-avatar>
              <div class="col">
                <div class="row items-center no-wrap">
                  <div class="text-subtitle1 text-weight-bold text-black ellipsis q-mr-sm" style="line-height: 1.2; font-size: 16px; font-weight: 600;">{{ employee.name }}</div>
                  <div v-if="activityMap[employee.empId]?.is_online" class="online-badge">Online</div>
                  <div v-else class="offline-badge">Offline</div>
                </div>
                <div class="text-caption text-grey-6" style="font-size: 12px;">{{ employee.role }}</div>
              </div>
              <q-btn flat round dense icon="more_vert" class="text-black">
                <q-menu>
                  <q-list style="min-width: 150px">
                    <q-item clickable v-close-popup @click="openProfile(employee)">
                      <q-item-section>View Profile</q-item-section>
                    </q-item>
                    <q-item clickable v-close-popup @click="openMonitoring(employee)">
                      <q-item-section>Monitoring</q-item-section>
                    </q-item>
                    <q-item clickable v-close-popup @click="downloadAgent(employee)">
                      <q-item-section>Download Agent</q-item-section>
                    </q-item>
                    <q-item clickable v-close-popup :disable="!!employee.email" @click="deleteEmployee(employee)">
                      <q-item-section :class="employee.email ? 'text-grey-5' : 'text-red'">Delete</q-item-section>
                    </q-item>
                  </q-list>
                </q-menu>
              </q-btn>
            </div>

            <div class="row q-mt-md q-col-gutter-x-sm">
              <div class="col-4">
                <div class="text-caption q-mb-xs" style="font-size: 12px; color: #585858;">Employee ID</div>
                <div class="text-subtitle2 text-black" style="font-size: 14px;">{{ employee.empId }}</div>
              </div>
              <div class="col-8">
                <div class="text-caption q-mb-xs" style="font-size: 12px; color: #585858;">Organization Email</div>
                <div v-if="employee.email" class="text-body2 ellipsis" :title="employee.email" style="font-size: 14px;">{{ employee.email }}</div>
                <div v-else class="text-body2" style="font-size: 14px;">
                  Email not created <span class="text-primary cursor-pointer" style="text-decoration: underline" @click="openAccountCreation(employee)">Create now</span>
                </div>
              </div>
            </div>

            <div class="q-mt-md">
              <div class="text-caption q-mb-xs" style="font-size: 12px; color: #585858;">Active Application</div>
              
              <!-- Multi-icon list for apps -->
              <div v-if="activityMap[employee.empId]?.recentApps?.length" class="row items-center no-wrap app-icons-row">
                 <div 
                   v-for="(act, idx) in activityMap[employee.empId].recentApps.slice(0, 5)" 
                   :key="idx"
                   class="app-icon-circle-wrap"
                   :class="{ 'active-app-outline': idx === 0 }"
                 >
                   <img :src="getAppIcon(act.app)" class="app-icon-mini" @error="(e) => { e.target.src = '/app-fallback.svg' }" />
                   
                   <!-- Premium Tooltip -->
                   <q-tooltip 
                     anchor="top middle" 
                     self="bottom middle" 
                     :offset="[10, 10]" 
                     class="active-app-tooltip"
                   >
                     <div class="tooltip-app-name">{{ act.app }}</div>
                     <div class="tooltip-window-title">{{ act.window }}</div>
                   </q-tooltip>
                 </div>
                 
                 <div v-if="activityMap[employee.empId].recentApps.length > 5" class="more-apps-count">
                   +{{ activityMap[employee.empId].recentApps.length - 5 }}
                 </div>
              </div>
              
              <!-- Fallback to single app if recentApps not populated yet -->
              <div v-else-if="activityMap[employee.empId] && activityMap[employee.empId].app" class="row items-center no-wrap">
                <div class="app-icon-wrap q-mr-sm">
                  <img :src="getAppIcon(activityMap[employee.empId].app)" class="app-icon" @error="(e) => { e.target.src = '/app-fallback.svg' }" />
                  <q-tooltip anchor="top middle" self="bottom middle" :offset="[10, 10]" class="active-app-tooltip">
                     <div class="tooltip-app-name">{{ activityMap[employee.empId].app }}</div>
                     <div class="tooltip-window-title">{{ activityMap[employee.empId].window }}</div>
                  </q-tooltip>
                </div>
                <div class="column">
                  <div class="text-subtitle2 text-black ellipsis" style="font-size: 13px; line-height: 1.2;">{{ activityMap[employee.empId].app }}</div>
                  <div class="text-caption text-grey-6 ellipsis" style="font-size: 11px;">{{ activityMap[employee.empId].window }}</div>
                </div>
              </div>
              
              <div v-else class="text-body2 text-grey-5" style="font-size: 14px;">No recent activity</div>
            </div>
          </q-card>
        </div>

        <!-- No Results Animation -->
        <div v-if="filteredEmployees.length === 0" class="col-12 flex flex-center q-mt-xl">
           <NoResult />
        </div>
      </div>
    </div>

    <!-- ===== OFFBOARDED EMPLOYEES VIEW ===== -->
    <div v-if="showOffboarded && !showProfile">
      <div class="row items-center q-mb-lg">
        <q-btn flat dense round icon="arrow_back" class="back-btn" @click="showOffboarded = false" />
        <div class="text-h5 text-weight-bold text-black q-ml-sm">Offboarded Employees</div>
      </div>

      <!-- Offboarded search -->
      <div class="row q-mb-lg">
        <q-input
          v-model="offboardedSearch"
          placeholder="Search Employees..."
          outlined rounded dense bg-color="white"
          class="search-input filter-search"
        >
          <template v-slot:prepend>
            <SearchIcon :size="18" class="text-grey-5" />
          </template>
        </q-input>
      </div>

      <div class="row q-col-gutter-lg">
        <div v-for="employee in filteredOffboardedEmployees" :key="employee.id" class="col-12 col-sm-6 col-md-4">
          <q-card flat class="employee-card column justify-between full-height" @click="openProfile(employee)">
            <div class="employee-header-box row no-wrap items-center" style="border-radius: 20px;">
              <q-avatar size="56px" class="q-mr-md">
                <img :src="employee.avatar" alt="Avatar" />
              </q-avatar>

              <div class="col">
                <div class="text-subtitle1 text-weight-bold text-black" style="font-size:16px;font-weight:600;">
                  {{ employee.name }}
                </div>
                <div class="text-caption text-grey-6" style="font-size:12px;">
                  {{ employee.role }}
                </div>
              </div>

              <ArrowRightIcon :size="20" class="text-grey-5" />
            </div>

            <div class="row q-mt-md q-col-gutter-x-sm">
              <div class="col-4">
                <div class="text-caption q-mb-xs" style="font-size:12px;color:#585858;">Employee ID</div>
                <div class="text-subtitle2 text-black" style="font-size:14px;">
                  {{ employee.empId }}
                </div>
              </div>

              <div class="col-8">
                <div class="text-caption q-mb-xs" style="font-size:12px;color:#585858;">Organization Email</div>
                <div class="text-body2 ellipsis" :title="employee.email" style="font-size:14px;">
                  {{ employee.email || 'No email' }}
                </div>
              </div>
            </div>
          </q-card>
        </div>
        
        <!-- No Results Animation -->
        <div v-if="filteredOffboardedEmployees.length === 0" class="col-12 flex flex-center q-mt-xl">
           <NoResult />
        </div>
      </div>
    </div>

    <div v-if="showProfile" class="profile-page">
      <!-- ===== Unassign Confirmation Popup ===== -->
      <q-dialog v-model="showUnassignConfirm">
        <q-card class="unassign-popup">
          <q-card-section class="q-pa-xl">
            <div class="text-h5 text-weight-bold q-mb-md">Unassign Asset?</div>
            <p class="text-grey-7" style="font-size: 15px; line-height: 1.6;">Are you sure you want to unassign this asset from the employee?</p>
            
            <div class="row justify-end q-mt-xl q-gutter-x-md">
              <q-btn flat no-caps label="No" class="unassign-no-btn" v-close-popup />
              <q-btn unelevated no-caps label="Yes" class="unassign-yes-btn" @click="doUnassign" />
            </div>
          </q-card-section>
        </q-card>
      </q-dialog>

      <!-- ===== Asset Details Popup ===== -->
      <q-dialog v-model="showAssetDetails">
        <q-card class="asset-details-popup">
          <q-card-section class="q-pa-lg">
            <!-- Header-like box in popup -->
            <div class="asset-details-header-box row items-center q-pa-md q-mb-lg">
              <div class="device-icon-circle q-mr-md" style="width: 44px; height: 44px;">
                <MonitorIcon v-if="selectedAssetDetails?.label === 'Laptop'" :size="20" class="text-primary" />
                <MouseIcon v-else-if="selectedAssetDetails?.label === 'Mouse'" :size="20" class="text-primary" />
                <HeadphonesIcon v-else-if="selectedAssetDetails?.label === 'Headphone'" :size="20" class="text-primary" />
                <IdCardIcon v-else :size="20" class="text-primary" />
              </div>
              <div>
                <div class="text-weight-bold" style="font-size: 18px; color: #111827;">{{ selectedAssetDetails?.brand || selectedAssetDetails?.label }}</div>
                <div class="text-caption text-grey-6" style="font-size: 13px;">{{ selectedAssetDetails?.model }}</div>
              </div>
            </div>

            <!-- Device Information Section -->
            <div class="q-mb-lg">
               <div class="row items-center q-mb-md">
                 <div class="text-weight-bold" style="font-size: 15px; color: #111827;">Device Information</div>
                 <q-separator class="col q-ml-md" style="opacity: 0.15;" />
               </div>
               <div class="column q-gutter-y-md">
                 <div class="row justify-between">
                   <div class="text-weight-medium text-black" style="font-size: 13px; color:#1A1A1A;">Brand</div>
                   <div class="text-grey-7" style="font-size: 14px;">{{ selectedAssetDetails?.brand }}</div>
                 </div>
                 <div class="row justify-between">
                   <div class="text-weight-medium text-black" style="font-size: 13px; color:#1A1A1A;">Model</div>
                   <div class="text-grey-7" style="font-size: 14px;">{{ selectedAssetDetails?.model }}</div>
                 </div>
                 <div class="row justify-between">
                   <div class="text-weight-medium text-black" style="font-size: 13px; color:#1A1A1A;">Serial Number</div>
                   <div class="text-grey-7" style="font-size: 14px;">{{ selectedAssetDetails?.sn }}</div>
                 </div>
                 <div class="row justify-between">
                   <div class="text-weight-medium text-black" style="font-size: 13px; color:#1A1A1A;">Price</div>
                   <div class="text-grey-7" style="font-size: 14px;">{{ selectedAssetDetails?.price || '₹0' }}</div>
                 </div>
               </div>
            </div>

            <!-- Hardware Information Section -->
            <div class="q-mb-lg">
               <div class="row items-center q-mb-md">
                 <div class="text-weight-bold" style="font-size: 15px; color: #111827;">Hardware Information</div>
                 <q-separator class="col q-ml-md" style="opacity: 0.15;" />
               </div>
               <div class="column q-gutter-y-md">
                 <div class="row justify-between">
                   <div class="text-weight-medium text-black" style="font-size: 13px; color:#1A1A1A;">Processor</div>
                   <div class="text-grey-7" style="font-size: 14px;">{{ selectedAssetDetails?.processor || '-' }}</div>
                 </div>
                 <div class="row justify-between">
                   <div class="text-weight-medium text-black" style="font-size: 13px; color:#1A1A1A;">RAM</div>
                   <div class="text-grey-7" style="font-size: 14px;">{{ selectedAssetDetails?.ram || '-' }}</div>
                 </div>
                 <div class="row justify-between">
                   <div class="text-weight-medium text-black" style="font-size: 13px; color:#1A1A1A;">Storage Capacity</div>
                   <div class="text-grey-7" style="font-size: 14px;">{{ selectedAssetDetails?.storage || '-' }}</div>
                 </div>
                 <div class="row justify-between">
                   <div class="text-weight-medium text-black" style="font-size: 13px; color:#1A1A1A;">Operating System</div>
                   <div class="text-grey-7" style="font-size: 14px;">{{ selectedAssetDetails?.os || '-' }}</div>
                 </div>
               </div>
            </div>

            <!-- Remarks Section -->
            <div class="q-mb-xl">
               <div class="row items-center q-mb-md">
                 <div class="text-weight-bold" style="font-size: 15px; color: #111827;">Remarks</div>
                 <q-separator class="col q-ml-md" style="opacity: 0.15;" />
               </div>
               <div class="text-grey-6" style="font-size: 13px; line-height: 1.6;">
                 {{ selectedAssetDetails?.remarks || 'No remarks provided' }}
               </div>
            </div>

            <div class="row justify-end">
              <q-btn unelevated no-caps label="Close" class="asset-details-close-btn" v-close-popup />
            </div>
          </q-card-section>
        </q-card>
      </q-dialog>

      <div class="row items-center q-mb-lg full-width">
        <q-btn flat dense round icon="arrow_back" class="back-btn" @click="closeProfile" />
        <div class="text-h6 text-weight-bold text-black q-ml-sm">Add Employee</div>
      </div>

      <q-card flat class="profile-card">
        <div class="profile-banner"></div>
        <div class="profile-content">
          <div class="profile-header-container">
            <div class="profile-avatar-wrap">
              <q-avatar size="100px" class="profile-avatar">
                <img :src="selectedEmployee?.avatar || '/Group 1000003562.svg'" alt="Avatar" />
              </q-avatar>
            </div>
          </div>
            
            <div class="row justify-between items-center q-mt-sm">
              <div>
                <div class="text-weight-bold text-black q-mb-xs" style="font-size: 23px">{{ selectedEmployee?.name || '' }}</div>
                <div class="profile-email-row row items-center">
                  <div class="text-body2" style="color: #585858;">{{ selectedEmployee?.email || 'Email not created' }}</div>
                  <span class="text-primary cursor-pointer q-ml-md" style="text-decoration: underline" color="#4C36E4"
                    @click="showCredentials = true"
                  >
                    Show credential
                  </span>
                </div>
              </div>
              <div class="row q-gutter-sm">
                <q-btn unelevated no-caps outline class="actions-dropdown-btn text-black bg-grey-2 q-px-md" style="border-radius: 20px; font-weight: 500" label="Actions" icon-right="keyboard_arrow_down">
                  <q-menu fit anchor="bottom right" self="top right">
                    <q-list style="min-width: 150px">
                      <q-item clickable v-close-popup @click="showOffboardConfirm = true" v-if="selectedEmployee?.email">
                        <q-item-section style="font-size: 14px">Off-boarding</q-item-section>
                      </q-item>
                      <q-item clickable v-close-popup>
                        <q-item-section style="font-size: 14px">Create Policy</q-item-section>
                      </q-item>
                    </q-list>
                  </q-menu>
                </q-btn>
              </div>
            </div>
            <q-separator class="profile-divider q-my-md" />

          <!-- ===== OFFBOARDING CONFIRM DIALOG ===== -->
          <q-dialog v-model="showOffboardConfirm" persistent>
            <q-card class="offboard-popup">
              <div class="offboard-popup-header">
                <div class="offboard-popup-title">Confirm Employee Offboarding</div>
                <q-btn flat round dense icon="close" v-close-popup />
              </div>
              <div class="offboard-popup-body">
                <p class="offboard-popup-question">Are you sure you want to initiate the offboarding process?</p>
                <p class="offboard-actions-title">The following actions will be completed:</p>
                <ul class="offboard-actions-list">
                  <li>Disable Microsoft 365 account</li>
                  <li>Remove Microsoft 365 licenses <span class="offboard-actions-sub">(frees up paid seats)</span></li>
                  <li>Collect assets <span class="offboard-actions-sub">(Laptop, Mouse, Headset and other assets)</span></li>
                  <li>Release workstation seat</li>
                  <li>Store offboarding record</li>
                </ul>
              </div>
              <div class="offboard-popup-footer">
                <q-btn unelevated no-caps class="offboard-cancel-btn" label="Cancel" v-close-popup />
                <q-btn unelevated no-caps class="offboard-confirm-btn" label="Confirm" @click="startOffboarding" :loading="isOffboarding" />
              </div>
            </q-card>
          </q-dialog>

          <!-- ===== OFFBOARDING IN-PROGRESS DIALOG ===== -->
          <q-dialog v-model="showOffboardProgress" persistent>
            <q-card class="offboard-popup">
              <div class="offboard-popup-title" style="padding: 24px 24px 0;">Offboarding In Progress</div>
              <div class="offboard-popup-body">
                <p class="offboard-progress-sub">Please wait while the system completes the following actions:</p>
                <ul class="offboard-progress-list">
                  <li v-for="(step, idx) in offboardSteps" :key="step.key" class="offboard-progress-item">
                    <span class="offboard-step-icon">
                      <svg v-if="step.status === 'done'" viewBox="0 0 24 24" width="22" height="22" fill="none">
                        <circle cx="12" cy="12" r="11" stroke="#22C55E" stroke-width="2" fill="none"/>
                        <path d="M7 12.5l3.5 3.5 6.5-7" stroke="#22C55E" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
                      </svg>
                      <svg v-else-if="step.status === 'loading'" viewBox="0 0 24 24" width="22" height="22" class="spin-icon">
                        <circle cx="12" cy="12" r="10" stroke="#D1D5DB" stroke-width="2" fill="none"/>
                        <path d="M12 2a10 10 0 0 1 10 10" stroke="#6366F1" stroke-width="2.5" stroke-linecap="round" fill="none"/>
                      </svg>
                      <svg v-else viewBox="0 0 24 24" width="22" height="22">
                        <circle cx="12" cy="12" r="10" stroke="#D1D5DB" stroke-width="2" fill="none"/>
                      </svg>
                    </span>
                    <span :class="['offboard-step-label', step.status === 'pending' ? 'text-grey-5' : 'text-black']">
                      {{ step.label }}
                      <span v-if="step.sub" class="offboard-actions-sub"> {{ step.sub }}</span>
                    </span>
                  </li>
                </ul>
              </div>
            </q-card>
          </q-dialog>

          <!-- ===== OFFBOARDING COMPLETED DIALOG ===== -->
          <q-dialog v-model="showOffboardDone" persistent>
            <q-card class="offboard-done-popup">
              <div class="offboard-done-icon-wrap">
                <div class="offboard-done-circle">
                  <svg viewBox="0 0 24 24" width="36" height="36" fill="none">
                    <path d="M5 13l4 4L19 7" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </div>
              </div>
              <div class="offboard-done-title">Offboarding Completed</div>
              <div class="offboard-done-subtitle">The employee offboarding process has been successfully completed.</div>
              <q-btn unelevated no-caps class="offboard-done-btn" label="Close" @click="closeOffboarding" />
            </q-card>
          </q-dialog>

          <q-dialog v-model="showCredentials" persistent>
          <q-card class="credential-popup">

            <div class="credential-header">
              <div class="credential-title">Credential Details</div>
              <q-btn flat round dense icon="close" v-close-popup />
            </div>

            <!-- EMAIL -->
            <div class="credential-row">
              <div class="credential-label">Email ID</div>

              <div class="credential-value-row">
                <div>{{ selectedEmployee?.email }}</div>

                <div class="copy-btn" @click="copyToClipboard(selectedEmployee?.email)">
                  <q-icon name="content_copy" size="18px"/>
                  <span>Copy</span>
                </div>
              </div>
            </div>

            <!-- PASSWORD -->
            <div class="credential-row">
              <div class="credential-label">Password</div>

              <div class="credential-value-row">
                <div class="password-text">
                  {{ showPassword ? (selectedEmployee?.tempPassword || 'Not available') : '••••••••••••' }}
                </div>

                <q-icon
                  :name="showPassword ? 'visibility_off' : 'visibility'"
                  class="cursor-pointer q-mx-sm"
                  @click="showPassword = !showPassword"
                />

                <div class="copy-btn" @click="copyToClipboard(selectedEmployee?.tempPassword)">
                  <q-icon name="content_copy" size="18px"/>
                  <span>Copy</span>
                </div>
              </div>
            </div>

            <q-btn
              unelevated
              no-caps
              label="Close"
              class="credential-close-btn"
              v-close-popup
            />

          </q-card>
        </q-dialog>

          <div class="profile-section q-mt-lg">
            <div class="row items-center q-mb-md">
               <div class="profile-section-title" style="font-size: 16px; font-weight: 700;">Basic Details</div>
               <span class="text-primary cursor-pointer q-ml-md" style="font-size: 14px; font-weight: 500" @click="openEditBasic">Edit</span>
            </div>
            
            <div class="row q-col-gutter-y-lg q-col-gutter-x-md q-mt-xs">
              <div class="col-12 col-md-3">
                <div class="text-caption q-mb-xs" style="font-size: 13px; color: #585858;">First Name</div>
                <div class="text-body1" style="font-size: 15px; font-weight: 500; color: #111827;">{{ selectedEmployee?.firstName || selectedEmployee?.name?.split(' ')[0] || '-' }}</div>
              </div>
              <div class="col-12 col-md-3">
                <div class="text-caption q-mb-xs" style="font-size: 13px; color: #585858;">Last Name</div>
                <div class="text-body1" style="font-size: 15px; font-weight: 500; color: #111827;">{{ selectedEmployee?.lastName || selectedEmployee?.name?.split(' ').slice(1).join(' ') || '-' }}</div>
              </div>
              <div class="col-12 col-md-3">
                <div class="text-caption q-mb-xs" style="font-size: 13px; color: #585858;">Phone Number</div>
                <div class="text-body1" style="font-size: 15px; font-weight: 500; color: #111827;">{{ selectedEmployee?.phoneNumber || '-' }}</div>
              </div>
              <div class="col-12 col-md-3">
                <div class="text-caption q-mb-xs" style="font-size: 13px; color: #585858;">Personal Email</div>
                <div class="text-body1" style="font-size: 15px; font-weight: 500; color: #111827;">{{ selectedEmployee?.personalEmail || '-' }}</div>
              </div>
              <div class="col-12 q-mt-sm">
                <div class="text-caption q-mb-xs" style="font-size: 13px; color: #585858;">Address</div>
                <div class="text-body1" style="font-size: 15px; font-weight: 500; color: #111827;">{{ selectedEmployee?.address || '-' }}</div>
              </div>
            </div>
          </div>

          <div class="profile-section q-mt-xl">
            <div class="row items-center q-mb-md">
               <div class="profile-section-title" style="font-size: 16px; font-weight: 700;">Job Details</div>
               <span class="text-primary cursor-pointer q-ml-md" style="font-size: 14px; font-weight: 500" @click="openEditJob">Edit</span>
            </div>
            
            <div class="row q-col-gutter-y-lg q-col-gutter-x-md q-mt-xs">
              <div class="col-12 col-md-2">
                <div class="text-caption q-mb-xs" style="font-size: 13px; color: #585858;">Employee ID</div>  
                <div class="text-body1" style="font-size: 15px; font-weight: 500; color: #111827;">{{ selectedEmployee?.empId || '-' }}</div>
              </div>
              <div class="col-12 col-md-2">
                <div class="text-caption q-mb-xs" style="font-size: 13px; color: #585858;">Role</div>
                <div class="text-body1" style="font-size: 15px; font-weight: 500; color: #111827;">{{ selectedEmployee?.role || '-' }}</div>
              </div>
              <div class="col-12 col-md-2">
                <div class="text-caption q-mb-xs" style="font-size: 13px; color: #585858;">Seat</div>
                <div class="text-body1" style="font-size: 15px; font-weight: 500; color: #111827;">{{ selectedEmployee?.seatId ? `0${selectedEmployee.seatId}` : '-' }}</div>
              </div>
              <div class="col-12 col-md-3">
                <div class="text-caption q-mb-xs" style="font-size: 13px; color: #585858;">Experience Level</div>
                <div class="text-body1" style="font-size: 15px; font-weight: 500; color: #5D5FEF;">{{ selectedEmployee?.experienceLevel || '-' }}</div>
              </div>
              <div class="col-12 col-md-3">
                <div class="text-caption q-mb-xs" style="font-size: 13px; color: #585858;">Start Date</div>
                <div class="text-body1" style="font-size: 15px; font-weight: 500; color: #111827;">
                  {{ selectedEmployee?.createdAt ? new Date(selectedEmployee.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '-' }}
                </div>
              </div>
            </div>
          </div>

          <div class="profile-section q-mt-lg">
            <div class="row items-center q-mb-md">
               <div class="profile-section-title" style="font-size: 16px; font-weight: 700;">Assigned Asset</div>
               <span class="text-primary cursor-pointer q-ml-md" style="font-size: 14px; font-weight: 500" @click="openEditAssets">Edit</span>
            </div>
            <div class="row q-col-gutter-lg q-mt-xs">
              <div v-for="device in profileDevices" :key="device.label" class="col-12 col-sm-4">
                <div class="device-card">
                  <div class="device-icon-circle">
                    <MonitorIcon v-if="device.label === 'Laptop'" :size="18" class="text-primary" />
                    <MouseIcon v-else-if="device.label === 'Mouse'" :size="18" class="text-primary" />
                    <HeadphonesIcon v-else-if="device.label === 'Headphone'" :size="18" class="text-primary" />
                    <IdCardIcon v-else :size="18" class="text-primary" />
                  </div>
                  <div class="device-meta">
                    <div class="device-title">{{ device.label === 'Laptop' ? device.value.split(' - ')[0] : device.label }}</div>
                    <div class="device-sub">{{ device.label === 'Laptop' ? device.value.split(' - ')[1] : device.value }}</div>
                  </div>
                  <q-btn flat round dense class="device-more cursor-pointer" size="sm">
                    <MoreVerticalIcon :size="20" />
                    <q-menu auto-close class="device-menu shadow-5">
                      <q-list style="min-width: 140px; border-radius: 12px;">
                        <q-item clickable class="q-py-md" @click="confirmUnassign(device)">
                          <q-item-section style="font-size: 14px; font-weight: 500;">Unassign</q-item-section>
                        </q-item>
                        <q-item clickable class="q-py-md" @click="viewAssetDetails(device)">
                          <q-item-section style="font-size: 14px; font-weight: 500;">View Details</q-item-section>
                        </q-item>
                      </q-list>
                    </q-menu>
                  </q-btn>
                </div>
              </div>
            </div>
          </div>

          <div class="profile-section q-mt-lg">
            <div class="row items-center q-mb-md">
               <div class="profile-section-title" style="font-size: 16px; font-weight: 700;">Proof & Documents</div>
               <span class="text-primary cursor-pointer q-ml-md" style="font-size: 14px; font-weight: 500" @click="openEditDocs">Edit</span>
            </div>
            <div class="row q-col-gutter-lg q-mt-xs">
              <div v-for="doc in (selectedEmployee?.documents || [])" :key="doc.name" class="col-12 col-sm-4">
                <div class="doc-card">
                  <div class="doc-icon-circle">
                    <FileTextIcon :size="18" class="text-primary" />
                  </div>
                  <div class="doc-meta">
                    <div class="doc-title">{{ doc.name }}</div>
                    <div class="doc-sub">{{ doc.size }}</div>
                  </div>
                  <ArrowRightIcon :size="20" class="doc-more cursor-pointer" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </q-card>
    </div>

    <!-- Edit Basic Profile Page -->
    <div v-if="showEditBasicModal" class="profile-page">
      <div class="row items-center q-mb-lg full-width">
        <q-btn flat dense round icon="arrow_back" class="back-btn" @click="closeEditBasic" />
        <div class="text-h6 text-weight-bold text-black q-ml-sm">Edit Profile</div>
      </div>
      <div class="row justify-center" style="width: 100%">
        <q-card flat class="edit-profile-card">
          <div class="row justify-center q-pb-md relative-position">
             <div class="relative-position" style="width: 80px; height: 80px; border-radius: 50%; display: inline-block;">
               <q-avatar size="80px" class="avatar-upload cursor-pointer" @click="triggerAvatarUpload">
                 <img :src="avatarPreview || '/Group 1000003562.svg'" />
               </q-avatar>
               <div class="bg-white flex flex-center cursor-pointer shadow-1" style="position: absolute; bottom: 0px; right: -8px; width: 28px; height: 28px; border-radius: 50%; border: 1px solid rgba(0,0,0,0.05)" @click="triggerAvatarUpload">
                 <q-icon name="camera_alt" size="14px" color="primary" />
               </div>
               <input type="file" ref="avatarInput" class="hidden" accept="image/*" @change="onAvatarChange" />
             </div>
          </div>
          <div class="text-center text-weight-bold text-black q-mb-xl" style="font-size: 16px">Basic Details</div>

          <div class="row q-col-gutter-lg q-px-md edit-profile-form">
            <div class="col-12 col-md-6">
              <div class="text-caption text-grey-6 q-mb-xs q-ml-sm">First Name</div>
              <q-input v-model="firstName" outlined dense rounded class="form-input" @keypress="allowOnlyLetters" />
            </div>
            <div class="col-12 col-md-6">
              <div class="text-caption text-grey-6 q-mb-xs q-ml-sm">Last Name</div>
              <q-input v-model="lastName" outlined dense rounded class="form-input" @keypress="allowOnlyLetters" />
            </div>
            <div class="col-12 col-md-6">
              <div class="text-caption text-grey-6 q-mb-xs q-ml-sm">Phone Number</div>
              <q-input v-model="phoneNumber" outlined dense rounded class="form-input" />
            </div>
            <div class="col-12 col-md-6">
              <div class="text-caption text-grey-6 q-mb-xs q-ml-sm">Personal Email</div>
              <q-input v-model="personalEmail" outlined dense rounded class="form-input" />
            </div>
            <div class="col-12">
              <div class="text-caption text-grey-6 q-mb-xs q-ml-sm">Address</div>
              <q-input v-model="address" type="textarea" outlined rounded class="form-input text-area-rounded" :rows="3" />
            </div>
          </div>

          <div class="row justify-center q-gutter-x-sm q-mt-xl">
             <q-btn unelevated no-caps label="Cancel" class="cancel-btn bg-grey-2 text-black" style="min-width: 120px; border-radius: 20px" @click="closeEditBasic" />
             <q-btn unelevated no-caps label="Save" class="primary-btn q-px-xl" style="min-width: 120px; border-radius: 20px" :loading="isSavingProfile" @click="saveSection('basic')" />
          </div>
        </q-card>
      </div>
    </div>

    <!-- Edit Job Details Modal -->
    <q-dialog v-model="showEditJobModal">
      <q-card style="width: 500px; max-width: 90vw; border-radius: 20px" class="q-pa-sm">
         <div class="row justify-between items-center q-mb-md q-px-sm q-pt-sm">
            <div class="text-h6 text-weight-bold" style="font-size: 18px">Job Details</div>
            <q-btn flat round dense icon="close" v-close-popup />
         </div>
         <div class="q-px-sm q-pb-md">
            <div class="q-mb-md">
              <div class="text-caption text-grey-6 q-mb-xs q-ml-sm">Employee ID</div>
              <q-input v-model="employeeId" outlined dense rounded class="form-input" />
            </div>
            <div class="q-mb-md">
              <div class="text-caption text-grey-6 q-mb-xs q-ml-sm">Role</div>
              <q-select v-model="department" :options="departmentOptions" outlined dense rounded class="form-input" popup-content-class="default-select-popup" dropdown-icon="expand_more" />
            </div>
            <div class="q-mb-md">
              <div class="text-caption text-grey-6 q-mb-xs q-ml-sm">Seat</div>
              <q-select v-model="selectedSeat" :options="seats.map(s => s.id)" outlined dense rounded class="form-input" popup-content-class="default-select-popup" dropdown-icon="expand_more">
                <template v-slot:selected>
                  {{ selectedSeat ? `0${selectedSeat}` : 'Select Seat' }}
                </template>
                <template v-slot:option="scope">
                  <q-item v-bind="scope.itemProps" :disable="assignedSeatIds.includes(scope.opt) && scope.opt !== selectedEmployee?.seatId">
                    <q-item-section>
                      <q-item-label>{{ `0${scope.opt}` }}</q-item-label>
                    </q-item-section>
                  </q-item>
                </template>
              </q-select>
            </div>
            <div class="q-mb-lg">
              <div class="text-caption text-grey-6 q-mb-xs q-ml-sm">Experience Level</div>
              <q-select v-model="experienceLevel" :options="experienceOptions" outlined dense rounded class="form-input" popup-content-class="default-select-popup" dropdown-icon="expand_more" />
            </div>
            <div class="row justify-end q-gutter-x-sm">
               <q-btn unelevated no-caps label="Cancel" class="cancel-btn bg-grey-2 text-black" style="min-width: 100px; border-radius: 20px" v-close-popup />
               <q-btn unelevated no-caps label="Save" class="primary-btn" style="min-width: 100px; border-radius: 20px" :loading="isSavingProfile" @click="saveSection('job')" />
            </div>
         </div>
      </q-card>
    </q-dialog>

    <!-- Edit Assets Modal -->
    <q-dialog v-model="showEditAssetsModal">
      <q-card style="width: 500px; max-width: 90vw; border-radius: 20px" class="q-pa-sm">
         <div class="row justify-between items-center q-mb-md q-px-sm q-pt-sm">
            <div class="text-h6 text-weight-bold" style="font-size: 18px">Employee Assets</div>
            <q-btn flat round dense icon="close" v-close-popup />
         </div>
         <div class="q-px-sm q-pb-md">
            <div class="q-mb-md">
              <div class="text-caption text-grey-6 q-mb-xs q-ml-sm">Laptop</div>
              <q-select v-model="laptop" :options="laptopOptions" outlined dense rounded class="form-input" popup-content-class="default-select-popup" dropdown-icon="expand_more" />
            </div>
            <div class="q-mb-md">
              <div class="text-caption text-grey-6 q-mb-xs q-ml-sm">Mouse</div>
              <q-select v-model="mouse" :options="mouseOptions" outlined dense rounded class="form-input" popup-content-class="default-select-popup" dropdown-icon="expand_more" />
            </div>
            <div class="q-mb-md">
              <div class="text-caption text-grey-6 q-mb-xs q-ml-sm">Headset</div>
              <q-select v-model="headphone" :options="headphoneOptions" outlined dense rounded class="form-input" popup-content-class="default-select-popup" dropdown-icon="expand_more" />
            </div>
            <div class="q-mb-lg">
              <div class="text-caption text-grey-6 q-mb-xs q-ml-sm">Phone</div>
              <q-select v-model="tempPhone" :options="['None']" outlined dense rounded class="form-input" popup-content-class="default-select-popup" dropdown-icon="expand_more" />
            </div>
            <div class="row justify-end q-gutter-x-sm">
               <q-btn unelevated no-caps label="Cancel" class="cancel-btn bg-grey-2 text-black" style="min-width: 100px; border-radius: 20px" v-close-popup />
               <q-btn unelevated no-caps label="Save" class="primary-btn" style="min-width: 100px; border-radius: 20px" :loading="isSavingProfile" @click="saveSection('assets')" />
            </div>
         </div>
      </q-card>
    </q-dialog>

    <!-- Edit Docs Modal -->
    <q-dialog v-model="showEditDocsModal">
      <q-card style="width: 500px; max-width: 90vw; border-radius: 20px" class="q-pa-sm">
         <div class="row justify-between items-center q-mb-md q-px-sm q-pt-sm">
            <div class="text-h6 text-weight-bold" style="font-size: 18px">Proof &amp; Documents</div>
            <q-btn flat round dense icon="close" v-close-popup />
         </div>
         <div class="q-px-sm q-pb-md">
            <div class="text-caption text-grey-5 q-mb-lg" style="font-size: 14px">
              Please upload the required documents such as U.S. Passport, Permanent Resident Card (Green Card), Employment Authorization Document (EAD) for verification.
            </div>
            
            <div class="q-mb-md">
              <div class="text-caption text-grey-6 q-mb-xs q-ml-xs" style="font-size: 13px">Upload Document</div>
              <q-file
                v-model="docsFile"
                label=" "
                borderless
                style="border: 1px dashed rgba(0,0,0,0.15); border-radius: 16px; padding: 12px"
                class="upload-input bg-white"
                @update:model-value="addDocFile"
              >
                <template v-slot:label>
                  <div class="column items-center justify-center full-width">
                    <q-icon name="file_upload" size="24px" class="q-mb-sm text-black" />
                    <div class="upload-label text-center" style="font-size: 13px;">
                      <span class="text-primary">Click here</span> to upload document
                    </div>
                  </div>
                </template>
              </q-file>
              <div class="q-mt-sm">
                 <div v-for="(doc, i) in docsList" :key="doc.name" class="row items-center justify-between no-wrap q-py-sm q-px-md q-mb-sm" style="background: rgba(246, 246, 251, 1); border-radius: 16px">
                   <div class="row items-center">
                     <div class="bg-white flex flex-center q-mr-md" style="width: 36px; height: 36px; border-radius: 10px;">
                       <q-icon name="description" size="18px" color="primary" />
                     </div>
                     <div>
                       <div class="text-weight-medium text-black" style="font-size: 14px">{{ doc.name }}</div>
                       <div class="row items-center">
                         <div class="text-grey-5" style="font-size: 12px">{{ doc.size }}</div>
                         <div v-if="doc.uploading" class="q-ml-sm row items-center text-primary" style="font-size: 11px">
                           <q-spinner size="10px" class="q-mr-xs" /> Uploading to SharePoint...
                         </div>
                         <div v-else-if="doc.sharepoint_url" class="q-ml-sm text-green row items-center" style="font-size: 11px">
                           <q-icon name="check_circle" size="10px" class="q-mr-xs" /> SharePoint Synchronized
                         </div>
                       </div>
                     </div>
                   </div>
                   <q-btn flat round dense icon="close" size="12px" @click="docsList.splice(i, 1)" class="text-black" />
                 </div>
              </div>
            </div>

            <div class="row justify-end q-gutter-x-sm q-mt-xl">
               <q-btn unelevated no-caps label="Cancel" class="cancel-btn bg-grey-2 text-black" style="min-width: 100px; border-radius: 20px" v-close-popup />
               <q-btn unelevated no-caps label="Save" class="primary-btn" style="min-width: 100px; border-radius: 20px" :loading="isSavingProfile" @click="saveSection('docs')" />
            </div>
         </div>
      </q-card>
    </q-dialog>

    <div v-if="showAccountCreation" class="account-page">
      <div class="row items-center q-mb-lg full-width">
        <q-btn flat dense round icon="arrow_back" class="back-btn" @click="closeAccountCreation" />
        <div class="text-h6 text-weight-bold text-black q-ml-sm">{{ emailStep === 'select' ? 'Add Employee' : 'Account Creation' }}</div>
      </div>

      <q-card flat class="account-page-card">
        <div class="account-page-inner">
          <template v-if="emailStep === 'select'">
            <div class="text-h6 text-weight-bold text-center q-mb-sm gradient-text" style="font-size: 26px;">Create Microsoft Account</div>
            <div class="text-caption text-grey-6 text-center q-mb-xl" style="font-weight: 400; font-size: 16px;">
              Create and set up an email account for an employee with secure access and communication.
            </div>

            <div class="row justify-center q-gutter-lg">
              <div class="email-option-card cursor-pointer" @click="emailStep = 'generate'">
                 <div class="email-option-icon-wrap">
                   <img src="/small cntact.svg" class="email-option-icon-img" />
                 </div>
                 <div class="email-option-title">Create New Email</div>
                 <div class="email-option-desc">Create a new business email account</div>
              </div>

              <div class="email-option-card cursor-pointer" @click="emailStep = 'existing'">
                 <div class="email-option-icon-wrap">
                    <img src="/message.svg" class="email-option-icon-img" />
                 </div>
                 <div class="email-option-title">Use Existing Email</div>
                 <div class="email-option-desc">Add and manage an existing email account</div>
              </div>
            </div>
          </template>

          <template v-else-if="emailStep === 'generate' || emailStep === 'preview'">
            <div class="text-h6 text-weight-bold text-center q-mb-sm gradient-text">Create Microsoft Account</div>
            <div class="text-caption text-grey-6 text-center q-mb-xl" style="font-weight: 400; font-size: 14px;">
              Kindly provide the employee's first and last name. Assist IQ will automatically create the official email address and generate a temporary password via Microsoft.
            </div>

            <div class="row q-col-gutter-md">
              <div class="col-12 col-sm-6">
                <q-input v-model="emailFirstName" label="First Name" outlined dense rounded class="form-input" style="color: #585858;"/>
              </div>
              <div class="col-12 col-sm-6">
                <q-input v-model="emailLastName" label="Last Name" outlined dense rounded class="form-input" style="color: #585858;"/>
              </div>
            </div>

            <div v-if="emailStep === 'preview'" class="account-preview-card q-mt-lg">
              <div class="account-preview-fields">
                <div class="account-preview-field">
                  <div class="account-preview-label">Email Preview</div>
                  <q-input v-model="emailPreview" outlined dense rounded class="account-preview-input" readonly />
                </div>
                <div class="account-preview-field">
                  <div class="account-preview-label">Password</div>
                  <q-input v-model="tempPassword" :type="showPassword ? 'text' : 'password'" outlined dense rounded class="account-preview-input">
                    <template v-slot:append>
                      <q-btn flat round dense :icon="showPassword ? 'visibility_off' : 'visibility'" @click="showPassword = !showPassword" />
                    </template>
                  </q-input>
                </div>
              </div>
            </div>

            <div class="row justify-center q-mt-lg">
              <q-btn v-if="emailStep === 'generate'" unelevated no-caps class="primary-btn account-action-btn" label="Generate Email" @click="generateEmail" :loading="isGeneratingEmail" />
              <q-btn v-else unelevated no-caps class="primary-btn account-action-btn" label="Create Account" @click="createMicrosoftAccount" :loading="isCreatingMicrosoftAccount" />
            </div>
          </template>

          <template v-else-if="emailStep === 'existing'">
             <div class="text-h6 text-weight-bold text-center q-mb-sm gradient-text">Existing Employee</div>
             <div class="text-caption text-center q-mb-xl" style="font-weight: 400; font-size: 14px; color: #585858">
               Enter a business email to assign and manage an email for an existing employee
             </div>

             <div class="row q-col-gutter-md justify-center">
               <div class="col-12 col-sm-8">
                 <div class="q-ml-sm q-mb-xs text-caption" style="font-size: 14px; color: #585858">Business mail</div>
                 <q-input v-model="emailExisting" placeholder="Enter the mail id" outlined dense rounded class="form-input" />
               </div>
             </div>

             <div class="row justify-center q-mt-xl">
               <q-btn unelevated no-caps class="primary-btn account-action-btn" label="Save Mail" @click="saveExistingEmail" :loading="isSendingVerificationCode" style="width: 440px; max-width: 100%;" />
             </div>
          </template>

          <template v-else-if="emailStep === 'success' || emailStep === 'existing_success'">
            <div class="account-success">
              <img src="/contact icon.svg" alt="Account Created" class="account-success-icon" />
              <div class="account-success-title">All Set!</div>
              <div class="account-success-subtitle">
                The employee's Microsoft account has been verified and saved successfully.
              </div>
              <q-btn v-if="emailStep === 'success'" unelevated no-caps class="primary-btn q-mb-md" label="Download Agent Package" @click="downloadAgent(selectedEmployee)" />
              <q-btn flat no-caps class="primary-btn q-mb-md" style="background: #4C36E4 !important; color: white !important;" label="Close" @click="closeAccountCreation" />
            </div>
          </template>
        </div>
      </q-card>

      <!-- Verification Modal (3rd Image) -->
      <q-dialog v-model="showVerifyModal" persistent>
        <q-card class="verify-popup">
          <div class="verify-popup-content q-pa-xl column items-center">
            <div class="text-h6 text-weight-bold text-black q-mb-sm">Email Verification</div>
            <div class="text-caption text-grey-6 text-center q-mb-lg">
              Code sent to {{ emailExisting }}
            </div>
            
            <div class="full-width">
              <div class="text-caption text-grey-6 q-mb-xs q-ml-sm" style="font-size: 14px">Enter Code</div>
              <q-input v-model="verificationCodeInput" outlined rounded class="form-input" placeholder="122620" />
            </div>
            
            <q-btn unelevated no-caps class="primary-btn q-mt-xl full-width" label="Verify Mail" @click="verifyEmailCode" :loading="isVerifyingEmailCode" style="height: 50px; border-radius: 20px;" />
            
            <div class="q-mt-md text-grey-6">
              Didn't receive a code? 
              <span class="text-primary cursor-pointer text-weight-bold" @click="resendTimer === 0 && sendVerificationCode()">
                Resend Code {{ resendTimer > 0 ? `(${resendTimer}s)` : '' }}
              </span>
            </div>
          </div>
        </q-card>
      </q-dialog>
    </div>

    <!-- Add Employee Page -->
    <div v-else-if="showAddEmployee" class="add-employee-page">
      <div class="row items-center q-mb-lg full-width">
        <q-btn flat dense round icon="arrow_back" class="back-btn" @click="cancelAddEmployee" />
        <div class="text-h6 text-weight-bold text-black q-ml-sm">{{ selectedEmployee ? 'Edit Employee' : 'Add Employee' }}</div>
      </div>

      <q-card flat class="add-employee-card q-pa-lg">
        <!-- Stepper -->
        <div class="row justify-center q-mb-xl">
          <div class="column items-center">
            <div class="stepper-wrapper" style="width: 480px;">
               <div class="step-circle" :class="{active: addStep >= 1}">1</div>
               <div class="step-line" :class="{active: addStep >= 2}"></div>
               <div class="step-circle" :class="{active: addStep >= 2}">2</div>
               <div class="step-line" :class="{active: addStep >= 3}"></div>
               <div class="step-circle" :class="{active: addStep >= 3}">3</div>
               <div class="step-line" :class="{active: addStep >= 4}"></div>
               <div class="step-circle" :class="{active: addStep >= 4}">4</div>
               <div class="step-line" :class="{active: addStep >= 5}"></div>
               <div class="step-circle" :class="{active: addStep >= 5}">5</div>
            </div>
            <div class="row full-width justify-between q-mt-sm stepper-labels" style="width: 520px; max-width: 100%;">
               <div class="text-center" style="font-size: 13px; width: 18%" :class="{'text-primary': addStep >= 1}">Basic Details</div>
               <div class="text-center" style="font-size: 13px; width: 18%" :class="{'text-primary': addStep >= 2}">Job Details</div>
               <div class="text-center" style="font-size: 13px; width: 18%" :class="{'text-primary': addStep >= 3}">Asset</div>
               <div class="text-center" style="font-size: 13px; width: 18%" :class="{'text-primary': addStep >= 4}">documents</div>
               <div class="text-center" style="font-size: 13px; width: 18%" :class="{'text-primary': addStep >= 5}">Completion</div>
            </div>
          </div>
        </div>
        
        <div style="max-width: 600px; margin: 0 auto;">
          <template v-if="addStep === 1">
            <!-- Basic Details -->
            
            <div class="column items-center q-mb-lg">
              <div class="avatar-wrapper" @click="triggerAvatarUpload">
                <q-avatar size="80px" class="add-avatar cursor-pointer shadow-1">
                  <img :src="avatarPreview || '/Group 1000003562.svg'" alt="Employee" />
                </q-avatar>
                <div class="camera-overlay" @click="triggerAvatarUpload">
                  <CameraIcon :size="15" color="blue" />
                </div>
                <input ref="avatarInput" type="file" accept="image/*" style="display:none" @change="onAvatarChange" />
              </div>
            </div>

            <div class="text-subtitle1 text-weight-bold q-mb-md text-center" style="font-size: 18px">Basic Details</div>
            
            <div class="row q-col-gutter-md">
              <div class="col-12 col-sm-6">
                <div class="q-ml-sm q-mb-xs text-caption text-grey-7"style="font-size: 14px">First Name</div>
                <q-input v-model="firstName" outlined dense rounded class="form-input"  :rules="[val => /^[A-Za-z\s]+$/.test(val) || 'Only letters allowed']"
  @keypress="allowOnlyLetters"/>
              </div>
              <div class="col-12 col-sm-6">
                <div class="q-ml-sm q-mb-xs text-caption text-grey-7"style="font-size: 14px">Last Name</div>
                <q-input v-model="lastName" outlined dense rounded class="form-input"  :rules="[val => /^[A-Za-z\s]+$/.test(val) || 'Only letters allowed']"
  @keypress="allowOnlyLetters"/>
              </div>
              <div class="col-12 col-sm-6">
                <div class="q-ml-sm q-mb-xs text-caption text-grey-7"style="font-size: 14px">Phone Number</div>
                <q-input v-model="phoneNumber" outlined dense rounded class="form-input" maxlength="10"
                  inputmode="numeric"
                  :rules="[
                    val => !!val || 'Phone number required',
                    val => /^[0-9]*$/.test(val) || 'Only numbers allowed',
                    val => val.length === 10 || 'Enter 10 digit phone number'
                  ]"
                  @update:model-value="phoneNumber = phoneNumber.replace(/\D/g, '')" />
              </div>
              <div class="col-12 col-sm-6">
                <div class="q-ml-sm q-mb-xs text-caption text-grey-7"style="font-size: 14px">Personal Email</div>
                <q-input v-model="personalEmail" outlined dense rounded class="form-input" :rules="[
                  val => !!val || 'Personal Email is required',
                  val => /.+@.+\..+/.test(val) || 'Enter a valid email'
                ]"/>
              </div>
              <div class="col-12">
                <div class="q-ml-sm q-mb-xs text-caption text-grey-7"style="font-size: 14px">Address</div>
                <q-input v-model="address" type="textarea" outlined rounded class="form-input text-area-rounded" :rows="3" :rules="[val => !!val || 'Address is required']"/>
              </div>
            </div>

            <!-- Proof & Documents -->
            <div class="text-subtitle1 text-weight-bold q-mt-xl q-mb-md" style="font-size: 16px; margin-top: 10px;">Proof & Documents</div>
            <div class="text-caption text-grey-7 q-mb-md" style="font-size: 14px">
              Please upload required documents such as U.S. Passport, Permanent Resident Card (Green Card), Employment Authorization Document (EAD) for verification.
            </div>

            <div class="q-ml-xs q-mb-xs text-caption text-grey-7"style="font-size: 14px">Upload Document</div>
            <q-file
              v-model="uploadedFile"
              label=" "
              borderless
              class="upload-input"
              @update:model-value="addDocument"
            >
              <template v-slot:label>
                <div class="column items-center justify-center full-width">
                  <UploadIcon :size="24" class="q-mb-sm text-black" />
                  <div class="upload-label text-center">
                    <span class="upload-link">Click here</span> to upload document
                  </div>
                </div>
              </template>
            </q-file>

            <div class="doc-list q-mt-md">
              <div v-for="(doc, i) in documents" :key="doc.id" class="row items-center justify-between no-wrap q-py-sm q-px-md q-mb-sm" style="background: rgba(246, 246, 251, 1); border-radius: 16px">
                <div class="row items-center">
                  <div class="bg-white flex flex-center q-mr-md" style="width: 38px; height: 38px; border-radius: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.04);">
                    <q-icon name="description" size="20px" color="primary" />
                  </div>
                  <div>
                    <div class="text-weight-medium text-black" style="font-size: 14px">{{ doc.name }}</div>
                    <div class="row items-center">
                      <div class="text-grey-5" style="font-size: 12px">{{ doc.size }}</div>
                      
                      <!-- SharePoint Status -->
                      <div v-if="doc.uploading" class="q-ml-sm row items-center text-primary" style="font-size: 11px">
                        <q-spinner size="10px" class="q-mr-xs" /> Uploading to SharePoint...
                      </div>
                      <div v-else-if="doc.sharepoint_url" class="q-ml-sm text-green row items-center" style="font-size: 11px">
                        <q-icon name="check_circle" size="10px" class="q-mr-xs" /> SharePoint Synchronized
                      </div>
                      <div v-else-if="doc.error" class="q-ml-sm text-negative row items-center" style="font-size: 11px">
                        <q-icon name="error" size="10px" class="q-mr-xs" /> Upload Failed
                      </div>
                    </div>
                  </div>
                </div>
                
                <div class="row items-center">
                   <a v-if="doc.sharepoint_url" :href="doc.sharepoint_url" target="_blank" class="q-mr-sm row items-center no-decoration">
                     <q-icon name="open_in_new" size="16px" color="primary" />
                   </a>
                   <q-btn flat round dense icon="close" size="10px" class="text-grey-6" @click="removeDocument(doc.id)" />
                </div>
              </div>
            </div>


            <div class="row justify-center q-mt-xl q-gutter-md">
              <q-btn outline no-caps class="secondary-btn" label="Cancel" @click="cancelAddEmployee" style="width: 120px;" />
              <q-btn unelevated no-caps class="primary-btn" label="Continue" @click="validateStep1" style="width: 120px;" />
            </div>
            
          </template>

          <template v-else-if="addStep === 2">
            <!-- Job Details -->
            <div class="text-subtitle1 text-weight-bold q-mb-xl text-center" style="font-size: 18px">Job Details</div>

            <!-- Identification & Allocation -->
            <div class="text-subtitle2 text-weight-bold q-mt-md" style="font-size: 16px">Identification & Allocation</div>
            <div class="text-caption text-grey-7 q-mb-md" style="font-size: 14px">Set the employee ID and select a role to allocate a workstation to the employee.</div>
            
            <div class="row q-col-gutter-lg">
              <div class="col-12 col-sm-6">
                <div class="q-ml-sm q-mb-xs text-caption text-grey-7" style="font-size: 14px">Employee ID</div>
                <q-input v-model="employeeId" outlined dense rounded class="form-input" placeholder="e.g. COMP0012" />
              </div>
              <div class="col-12 col-sm-6">
                <div class="q-ml-sm q-mb-xs text-caption text-grey-7" style="font-size: 14px">Role</div> 
                <q-select v-model="department" :options="departmentOptions" outlined dense rounded class="form-input" dropdown-icon="expand_more" />
              </div>
              <div class="col-12 col-sm-6">
                <div class="q-ml-sm q-mb-xs text-caption text-grey-7" style="font-size: 14px">Employment Type</div>
                <q-select v-model="employmentType" :options="employmentTypeOptions" outlined dense rounded class="form-input" dropdown-icon="expand_more" />
              </div>
            </div>

            <!-- Experience -->
            <div class="text-subtitle2 text-weight-bold q-mt-xl" style="font-size: 16px">Experience</div>
            <div class="text-caption text-grey-7 q-mb-md" style="font-size: 14px">Select the employee's experience level based on their professional experience.</div>
            
            <div class="row q-col-gutter-lg">
              <div class="col-12 col-sm-6">
                <div class="q-ml-sm q-mb-xs text-caption text-grey-7" style="font-size: 14px">Experience Level</div>
                <q-select v-model="experienceLevel" :options="experienceOptions" outlined dense rounded class="form-input" dropdown-icon="expand_more" />
              </div>
            </div>

            <div class="row justify-center q-mt-xl q-gutter-md">
              <q-btn outline no-caps class="secondary-btn" label="Cancel" @click="addStep = 1" style="width: 140px; border-radius: 20px;" />
              <q-btn unelevated no-caps class="primary-btn" label="Continue" @click="addStep = 3" style="width: 140px; border-radius: 20px;" />
            </div>
          </template>

          <template v-else-if="addStep === 3">
            <!-- Asset Allocation -->
            <div class="text-subtitle1 text-weight-bold q-mb-xl text-center" style="font-size: 18px">Asset Allocation</div>

            <div class="text-subtitle2 text-weight-bold" style="font-size: 16px">Assign Assets</div>
            <div class="text-caption text-grey-7 q-mb-md" style="font-size: 14px">Assign work devices to the employee.</div>
            
            <!-- Laptop Section -->
            <div class="q-mb-lg">
              <div class="text-caption text-grey-7 q-mb-xs" style="font-size: 14px">Laptop</div>
              <div v-if="laptop" class="row items-center no-wrap q-py-sm q-px-md bg-grey-1" style="border-radius: 16px; border: 1px solid #EEF0F5;">
                 <div class="text-weight-bold text-black q-mr-sm" style="font-size: 14px">{{ laptop.split(' ')[0] }}</div>
                 <div class="text-grey-6 ellipsis" style="font-size: 14px">{{ laptop.split(' ').slice(1).join(' ') }}</div>
                 <q-space />
                 <q-btn flat round dense icon="close" size="sm" @click="laptop = ''" />
              </div>
              <div v-else class="assign-asset-placeholder cursor-pointer flex flex-center" @click="openAssetSelect('Laptop')" style="border: 1.5px dashed #4C36E480; border-radius: 16px; height: 50px;">
                <div class="text-primary text-weight-medium">Assign Asset</div>
              </div>
            </div>

            <!-- Mouse Section -->
            <div class="q-mb-lg">
              <div class="text-caption text-grey-7 q-mb-xs" style="font-size: 14px">Mouse</div>
              <div v-if="mouse" class="row items-center no-wrap q-py-sm q-px-md bg-grey-1" style="border-radius: 16px; border: 1px solid #EEF0F5;">
                 <div class="text-weight-bold text-black q-mr-sm" style="font-size: 14px">{{ mouse.split(' ')[0] }}</div>
                 <div class="text-grey-6 ellipsis" style="font-size: 14px">{{ mouse.split(' ').slice(1).join(' ') }}</div>
                 <q-space />
                 <q-btn flat round dense icon="close" size="sm" @click="mouse = ''" />
              </div>
              <div v-else class="assign-asset-placeholder cursor-pointer flex flex-center" @click="openAssetSelect('Mouse')" style="border: 1.5px dashed #4C36E480; border-radius: 16px; height: 50px;">
                <div class="text-primary text-weight-medium">Assign Asset</div>
              </div>
            </div>

            <!-- Headphone Section -->
            <div class="q-mb-xl">
              <div class="text-caption text-grey-7 q-mb-xs" style="font-size: 14px">Headphone</div>
              <div v-if="headphone" class="row items-center no-wrap q-py-sm q-px-md bg-grey-1" style="border-radius: 16px; border: 1px solid #EEF0F5;">
                 <div class="text-weight-bold text-black q-mr-sm" style="font-size: 14px">{{ headphone.split(' ')[0] }}</div>
                 <div class="text-grey-6 ellipsis" style="font-size: 14px">{{ headphone.split(' ').slice(1).join(' ') }}</div>
                 <q-space />
                 <q-btn flat round dense icon="close" size="sm" @click="headphone = ''" />
              </div>
              <div v-else class="assign-asset-placeholder cursor-pointer flex flex-center" @click="openAssetSelect('Headphone')" style="border: 1.5px dashed #4C36E480; border-radius: 16px; height: 50px;">
                <div class="text-primary text-weight-medium">Assign Asset</div>
              </div>
            </div>

            <div class="row justify-center q-mt-xl q-gutter-md">
              <q-btn outline no-caps label="Cancel" @click="addStep = 2" style="width: 140px; border-radius: 20px;" />
              <q-btn unelevated no-caps class="primary-btn" label="Continue" @click="addStep = 4" style="width: 140px; border-radius: 20px;" />
            </div>
            
            <q-dialog v-model="showAssetSelectDialog">
              <q-card style="width: 500px; max-width: 90vw; border-radius: 24px;" class="q-pa-md">
                <div class="row items-center q-mb-md">
                  <q-input v-model="assetSearch" dense outlined rounded class="col q-mr-sm" placeholder="Search..." bg-color="white">
                    <template v-slot:prepend><q-icon name="search" size="20px" /></template>
                  </q-input>
                  <q-btn flat no-caps label="Close" v-close-popup />
                </div>
                <div class="q-gutter-y-sm">
                   <div v-for="opt in filteredAssetOptions" :key="opt" class="row items-center justify-between q-pa-md bg-white hover-asset" style="border-radius: 16px; border: 1px solid rgba(0,0,0,0.03)" @click="selectAsset(opt)">
                      <div class="row items-center">
                        <div class="text-weight-bold text-black q-mr-sm">{{ opt.split(' ')[0] }}</div>
                        <div class="text-grey-6">{{ opt.split(' ').slice(1).join(' ') }}</div>
                      </div>
                      <div class="row items-center">
                        <span class="text-primary q-mr-md cursor-pointer" style="font-size: 13px;">Asset Info</span>
                        <q-icon name="check_circle_outline" color="green" size="20px" />
                      </div>
                   </div>
                </div>
              </q-card>
            </q-dialog>
          </template>

          <template v-else-if="addStep === 4">
            <!-- documents (Payroll/Doc) -->
            <div class="text-subtitle1 text-weight-bold q-mb-xl text-center" style="font-size: 18px">Document</div>

            <div class="text-subtitle2 text-weight-bold" style="font-size: 16px">Basic Details</div>
            <div class="text-caption text-grey-7 q-mb-md" style="font-size: 14px">Fill in the fields below to populate the employee's information in the document</div>
            
            <div class="row q-col-gutter-lg q-mb-xl">
              <div class="col-12 col-sm-6">
                <div class="q-ml-sm q-mb-xs text-caption text-grey-7" style="font-size: 14px">Date</div>
                <q-input v-model="joiningDate" outlined dense rounded class="form-input">
                  <template v-slot:append>
                    <q-icon name="event" class="cursor-pointer">
                      <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                        <q-date v-model="joiningDate" mask="DD/MM/YYYY" />
                      </q-popup-proxy>
                    </q-icon>
                  </template>
                </q-input>
              </div>
              <div class="col-12 col-sm-6">
                <div class="q-ml-sm q-mb-xs text-caption text-grey-7" style="font-size: 14px">Name</div>
                <q-input v-model="firstName" outlined dense rounded class="form-input" readonly />
              </div>
              <div class="col-12 col-sm-6">
                <div class="q-ml-sm q-mb-xs text-caption text-grey-7" style="font-size: 14px">Job Role</div>
                <q-input v-model="department" outlined dense rounded class="form-input" readonly />
              </div>
              <div class="col-12 col-sm-6">
                <div class="q-ml-sm q-mb-xs text-caption text-grey-7" style="font-size: 14px">Salary (Per Annum)</div>
                <q-input v-model="salary" outlined dense rounded class="form-input" placeholder="e.g. 20,00,000" />
              </div>
              <div class="col-12 col-sm-6">
                <div class="q-ml-sm q-mb-xs text-caption text-grey-7" style="font-size: 14px">Joining Date</div>
                <q-input v-model="joiningDate" outlined dense rounded class="form-input" />
              </div>
            </div>

            <div class="text-subtitle2 text-weight-bold" style="font-size: 16px">Compensation Details</div>
            <div class="text-caption text-grey-7 q-mb-md" style="font-size: 14px">Fill in the fields below to populate the employee's information in the document</div>
            
            <q-card flat style="border-radius: 20px; border: 1px solid #EEF0F5; overflow: hidden;" class="q-mb-xl">
               <div class="row q-pa-md bg-grey-1 text-weight-bold" style="font-size: 14px;">
                  <div class="col-4">Payheads</div>
                  <div class="col-4 text-center">Monthly (₹)</div>
                  <div class="col-4 text-center">Yearly (₹)</div>
               </div>
               <div v-for="item in compensationData" :key="item.label" class="row q-pa-md items-center" style="border-top: 1px solid #EEF0F5;">
                  <div class="col-4 text-weight-medium text-grey-7" style="font-size: 12px;">{{ item.label }}</div>
                  <div class="col-4 q-px-sm">
                    <q-input v-model="item.monthly" dense outlined rounded class="form-input text-center" bg-color="white" />
                  </div>
                  <div class="col-4 q-px-sm">
                    <q-input v-model="item.yearly" dense outlined rounded class="form-input text-center" bg-color="white" />
                  </div>
               </div>
            </q-card>

            <div class="text-subtitle2 text-weight-bold" style="font-size: 16px">Submitted Document</div>
            <div class="text-caption text-grey-7 q-mb-md" style="font-size: 14px">Check the box for the document submitted by the employee</div>

            <div class="column q-gutter-y-sm q-mb-xl">
               <div v-for="doc in submittedDocsChecklist" :key="doc.label" class="row items-center justify-between q-py-sm">
                  <div class="text-grey-7" style="font-size: 14px;">{{ doc.label }}</div>
                  <q-checkbox v-model="doc.checked" color="primary" />
               </div>
            </div>

            <div class="row justify-between items-center q-mt-xl">
              <q-btn 
                outline 
                no-caps 
                label="Preview" 
                @click="previewPDF" 
                style="width: 140px; border-radius: 20px; border: 1.5px solid #4C36E4; color: #4C36E4;" 
              />
              <div class="row q-gutter-md">
                <q-btn unelevated no-caps label="Cancel" @click="addStep = 3" style="width: 140px; background: #F4F4F4; color: #000; border-radius: 20px;" />
                <q-btn unelevated no-caps class="primary-btn" label="Save & Continue" @click="createAccountWizard" :loading="isCreating" style="width: 140px; border-radius: 20px;" />
              </div>
            </div>
          </template>

          <template v-else-if="addStep === 5">
            <!-- Completion step -->
            <div class="column items-center justify-center text-center q-py-xl">
               <img src="/contact icon.svg" class="q-mb-md" style="width: 140px; height: 140px;" />
               <div class="text-h5 text-weight-bold q-mb-sm">All Set!</div>
               <div class="text-caption text-grey-6 q-mb-xl" style="max-width: 400px; font-size: 15px;">
                  The employee's profile has been securely saved and the document generated successfully.
               </div>
               <q-btn unelevated no-caps class="primary-btn" label="Close" @click="cancelAddEmployee" style="width: 160px; border-radius: 24px; height: 50px;" />
            </div>
          </template>
        </div>
      </q-card>
      
      <!-- PDF Preview Dialog -->
      <q-dialog v-model="showPreview" persistent maximized transition-show="fade" transition-hide="fade">
        <q-card class="column no-wrap" style="background: rgba(15, 23, 42, 0.95);">
          <div class="row items-center justify-between q-pa-md bg-white border-bottom">
            <div class="row items-center">
              <q-icon name="description" color="primary" size="24px" class="q-mr-sm" />
              <div class="text-subtitle1 text-weight-bold text-black" style="font-size: 18px;">Document Preview</div>
            </div>
            <q-btn flat round icon="close" v-close-popup class="text-grey-7" />
          </div>
          <div class="col full-width bg-transparent q-pa-xl flex flex-center">
             <div class="full-width full-height relative-position shadow-24" style="max-width: 900px; border-radius: 12px; overflow: hidden; background: white;">
                <iframe :src="previewUrl" width="100%" height="100%" frameborder="0"></iframe>
             </div>
          </div>
        </q-card>
      </q-dialog>
    </div>
    <!-- ===== MONITORING PAGE (Added based on UI) ===== -->
    <div v-else-if="showMonitoring" class="monitoring-page">
      <div class="row items-center q-mb-lg full-width">
        <q-btn flat dense round icon="arrow_back" class="back-btn" @click="closeMonitoring" />
        <div class="text-h6 text-weight-bold text-black q-ml-sm">Monitoring</div>
      </div>

      <div class="row q-col-gutter-lg">
        <!-- Employee Profile Card -->
        <div class="col-12 col-md-4">
          <q-card flat class="mon-profile-card">
            <div class="mon-profile-bg"></div>
            <div class="column justify-between full-height relative-position" style="z-index: 1;">
              <div>
                <div class="row justify-between items-start">
                  <div>
                    <div class="text-white text-h6 text-weight-bold" style="font-size: 18px; line-height: 1.2;">{{ selectedEmployee?.name || '-' }}</div>
                    <div class="text-white q-mt-xs" style="font-size: 12px; opacity: 0.9;">{{ selectedEmployee?.empId || '-' }}</div>
                  </div>
                  <q-avatar size="49px" class="mon-avatar shadow-2" style="border: 3px">
                    <img :src="selectedEmployee?.avatar || '/Group 1000003562.svg'" />
                  </q-avatar>
                </div>
                
                <div class="q-mt-md">
                   <div class="mon-badge-role">{{ selectedEmployee?.role || '-' }}</div>
                   <div class="mon-badge-email q-mt-md">{{ selectedEmployee?.email || 'Email not created' }}</div>
                </div>
              </div>
              
              <div class="q-mt-xl pt-lg">
                 <div class="text-white text-weight-bold ellipsis" style="font-size: 18px;">
                   {{ selectedEmployee?.laptop || 'No laptop assigned' }}
                 </div>
                 <div class="text-white ellipsis" style="font-size: 12px; opacity: 0.9;">
                   {{ [selectedEmployee?.mouse, selectedEmployee?.headphone].filter(Boolean).join(' | ') || ' ' }}
                 </div>
              </div>
            </div>
          </q-card>
        </div>

        <!-- Activity Overview Card -->
        <div class="col-12 col-md-8">
          <q-card flat class="mon-chart-card">
            <div class="row items-center justify-between q-mb-md">
              <div class="row items-center">
                <div class="text-subtitle1 text-weight-bold text-black q-mr-sm" style="font-size: 16px;">Activity Overview</div>
                <div class="mon-badge-green" v-if="monitoringStats?.is_overtime">Overtime</div>
                <div class="mon-badge-green" v-else>Regular</div>
              </div>
              <div class="text-grey-5 text-caption">{{ new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) }}</div>
            </div>
            
            <div v-if="monitoringStats" class="row items-center justify-center" style="height: calc(100% - 40px);">
              <div class="col-12 col-sm-6 flex justify-center relative-position q-py-sm">
                 <!-- SVG Donut Chart -->
                 <svg viewBox="0 0 200 100" class="mon-donut">
                   <defs>
                     <linearGradient id="monDonutGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                       <stop offset="0%" stop-color="#A78BFA" />
                       <stop offset="33%" stop-color="#F43F5E" />
                       <stop offset="66%" stop-color="#10B981" />
                       <stop offset="100%" stop-color="#FDE047" />
                     </linearGradient>
                   </defs>
                   <path d="M 12 90 A 88 88 0 0 1 188 90" fill="none" stroke="#F3F4F6" stroke-width="15" stroke-linecap="round" />
                   <path 
                     v-for="(seg, i) in monDonutSegments"
                     :key="i"
                     d="M 12 90 A 88 88 0 0 1 188 90" 
                     fill="none" 
                     :stroke="seg.color" 
                     stroke-width="15" 
                     stroke-linecap="round" 
                     :stroke-dasharray="`${seg.length} ${276.5}`"
                     :stroke-dashoffset="seg.offset"
                     style="transition: all 0.6s ease-out;"
                   />
                 </svg>
                 <div class="mon-donut-text">
                  <div class="text-weight-bold text-black" style="font-size: 18px;">
                    {{ formatDuration(monitoringStats.raw_total_seconds, true) }}/8h
                  </div>
                    <div class="text-grey-5" style="font-size: 11px;">Agent start: {{ monitoringStats.agent_start ? new Date(monitoringStats.agent_start).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--:--' }}</div>
                  </div>
              </div>
              <div class="col-12 col-sm-6">
                 <div class="row q-col-gutter-y-lg">
                   <div 
                     class="col-6" 
                     v-for="(app, idx) in monitoringStats.top_apps.slice(0, 5)" 
                     :key="idx"
                   >
                     <div class="row items-center q-mb-xs">
                       <span class="mon-dot" :style="{ background: ['#A78BFA', '#10B981', '#F43F5E', '#FDE047', '#9CA3AF'][idx] }"></span>
                       <span class="text-weight-bold ellipsis" style="font-size: 13px; max-width: 100px;">{{ getCleanAppName(app.app) }}</span>
                     </div>
                     <div class="text-grey-5 q-ml-md" style="font-size: 11px;">{{ formatDuration(app.duration) }}</div>
                   </div>
                 </div>
              </div>
            </div>
            <div v-else class="flex flex-center full-height full-width">
              <q-spinner-dots color="primary" size="40px" />
            </div>
          </q-card>
        </div>
      </div>

      <div class="row q-mt-lg q-col-gutter-lg">
        <!-- Today Activity Horizontal Bars Card -->
        <div class="col-12 col-md-6">
          <q-card flat class="mon-chart-card">
            <div class="row items-center justify-between q-mb-xl">
              <div class="row items-center">
                <div class="text-subtitle1 text-weight-bold text-black q-mr-sm" style="font-size: 16px;">Today Activity</div>
                <div class="mon-badge-green" v-if="monitoringStats?.is_overtime">Overtime</div>
                <div class="mon-badge-green" v-else>Regular</div>
              </div>
              <div class="text-grey-5 text-caption">Total hours: 9h</div>
            </div>

            <div v-if="monitoringStats" class="column q-gutter-y-lg">
              <div 
                v-for="(app, idx) in monitoringStats.top_apps" 
                :key="'bar'+idx" 
                class="row items-center no-wrap"
              >
                <img :src="getAppIcon(app.app)" class="mon-app-icon" @error="(e) => { e.target.src = '/app-fallback.svg' }" />
                <div class="mon-bar-wrap">
                  <div class="mon-bar-bg">
                    <div class="mon-bar-fill bg-gradient-cyan-to-indigo"
                      :style="{ 
                        width: Math.min(100, Math.max(2, 
                          (app.duration / monitoringStats.work_day_seconds) * 100
                        )) + '%' 
                      }">
                    </div>
                  </div>
                </div>
                <div class="mon-bar-label">{{ formatDuration(app.duration) }}</div>
              </div>
            </div>
          </q-card>
        </div>

        <!-- Productivity Trends Vertical Bars Card -->
        <div class="col-12 col-md-6">
          <q-card flat class="mon-chart-card">
            <div class="row items-center justify-between q-mb-xl">
              <div class="text-subtitle1 text-weight-bold text-black" style="font-size: 16px;">Productivity Trends</div>
              <div class="mon-dropdown">
                {{ selectedTimeframe }} <q-icon name="keyboard_arrow_down" size="18px" />
                <q-menu auto-close>
                  <q-list style="min-width: 120px">
                    <q-item clickable v-for="tf in ['This Week', 'This Month', 'Last Month']" :key="tf" @click="changeTimeframe(tf)">
                      <q-item-section>{{ tf }}</q-item-section>
                    </q-item>
                  </q-list>
                </q-menu>
              </div>
            </div>

            <div class="mon-column-chart">
               <!-- Left Y axis labels -->
               <div class="mon-y-axis">
                 <span>8h</span>
                 <span>6h</span>
                 <span>2h</span>
                 <span>1h</span>
               </div>
               
               <!-- Columns -->
               <div v-if="monitoringStats" class="mon-columns-container">
                 <div 
                   v-for="(day, idx) in monitoringStats.weekly_trends" 
                   :key="idx"
                   class="mon-column-col"
                 >
                   <div class="mon-column-track">
                     <!-- Set height based on worked hours relative to 8 hours -->
                     <div
                        class="mon-column-fill"
                        :class="day.is_overtime ? 'bg-gradient-purple-v' : 'bg-gradient-cyan-v'"
                        :style="{ height: Math.min(100, Math.max(4, (day.worked / 8) * 100)) + '%' }"
                      >
                       <q-tooltip anchor="top middle" self="bottom middle" class="mon-tooltip" :offset="[0, 16]">
                         <div class="row q-gutter-x-md text-weight-medium">
                            <div class="text-black">Worked - {{ formatDuration(day.worked * 3600, true) }}</div>
                            <div class="text-grey-6">Idle - {{ formatDuration(day.idle * 3600, true) }}</div>
                         </div>
                       </q-tooltip>
                     </div>
                   </div>
                   <div class="mon-column-label">{{ day.day }}</div>
                 </div>
               </div>
            </div>
          </q-card>
        </div>
      </div>
    </div>

  </q-page>
</template>

<script setup>
import { ref, computed, onMounted, reactive } from 'vue'
import api, { API_URL } from '../api'
import { IdCard as IdCardIcon, Search as SearchIcon, Upload as UploadIcon, Camera as CameraIcon, Armchair as ArmchairIcon, FileText as FileTextIcon, ArrowUpRight as ArrowUpRightIcon, ArrowRight as ArrowRightIcon, Mouse as MouseIcon, Monitor as MonitorIcon, Headphones as HeadphonesIcon, UserRoundMinus as UserRoundMinusIcon, MoreVertical as MoreVerticalIcon } from 'lucide-vue-next'
import NoResult from './NoResult.vue'

const employees = ref([])
const searchQuery = ref('')
const showAddEmployee = ref(false)
const isCreating = ref(false)
const wizardSessionId = ref('')


const showAccountCreation = ref(false)
const showProfile = ref(false)
const showMonitoring = ref(false)
const monitoringStats = ref(null)
const selectedEmployee = ref(null)
const showCredentials = ref(false)
const isCreatingMicrosoftAccount = ref(false)
const emailStep = ref('select') // select, generate, preview, existing, existing_verify, existing_success, success
const verificationCodeInput = ref('')
const isSendingVerificationCode = ref(false)
const isVerifyingEmailCode = ref(false)
const resendTimer = ref(0)
const resendInterval = ref(null)

const showPreview = ref(false)
const previewUrl = ref('')

const showVerifyModal = computed(() => emailStep.value === 'existing_verify')
const showAllSetModal = computed(() => emailStep.value === 'existing_success')

// ── Account Creation refs ──
const emailFirstName = ref('')
const emailLastName = ref('')
const emailEmployeeId = ref(null)
const emailPreview = ref('')
const tempPassword = ref('')
const showPassword = ref(false)
const isGeneratingEmail = ref(false)
const isSavingExistingEmail = ref(false)
const emailExisting = ref('')

const showUnassignConfirm = ref(false)
const assetToUnassign = ref(null)

const confirmUnassign = (device) => {
  assetToUnassign.value = device
  showUnassignConfirm.value = true
}

const doUnassign = async () => {
  if (!selectedEmployee.value || !assetToUnassign.value) return
  try {
    const res = await api.post(`/employees/${selectedEmployee.value.id}/unassign-asset`, {
      asset_type: assetToUnassign.value.label
    })
    if (res.data?.success) {
      // Update local state
      const empIdx = employees.value.findIndex(e => e.id === selectedEmployee.value.id)
      if (empIdx !== -1) {
        employees.value[empIdx].laptop = res.data.employee_laptop
        employees.value[empIdx].mouse = res.data.employee_mouse
        employees.value[empIdx].headphone = res.data.employee_headphone
        selectedEmployee.value = employees.value[empIdx]
      }
      showUnassignConfirm.value = false
      assetToUnassign.value = null
    }
  } catch (error) {
    console.error("Unassign error", error)
  }
}

const showAssetDetails = ref(false)
const selectedAssetDetails = ref(null)

const viewAssetDetails = async (device) => {
  try {
    // Extract SN from "Brand Model (SN)"
    const match = device.value.match(/\((.*?)\)/)
    if (match) {
      const sn = match[1]
      const res = await api.get(`/assets/by-sn/${sn}`)
      if (res.data) {
        selectedAssetDetails.value = {
          ...res.data,
          label: device.label // Store label to show correct icon
        }
        showAssetDetails.value = true
      }
    }
  } catch (error) {
    console.error("Fetch asset details error", error)
  }
}

// ── Offboarding state ──
const showOffboardConfirm = ref(false)
const showOffboardProgress = ref(false)
const showOffboardDone = ref(false)
const isOffboarding = ref(false)

const offboardSteps = ref([
  { key: 'disable_m365', label: 'Disable Microsoft 365 account', sub: '', status: 'pending' },
  { key: 'remove_licenses', label: 'Remove Microsoft 365 licenses', sub: '(frees up paid seats)', status: 'pending' },
  { key: 'collect_assets', label: 'Collect assets', sub: '(Laptop, Mouse, Headset and other assets)', status: 'pending' },
  { key: 'release_seat', label: 'Release workstation seat', sub: '', status: 'pending' },
  { key: 'store_record', label: 'Store offboarding record', sub: '', status: 'pending' }
])

const stepKeyMap = {
  disable_m365: 0,
  collect_assets: 1,
  release_seat: 2,
  store_record: 3
}

const monDonutSegments = computed(() => {
  if (!monitoringStats.value) return []
  const totalSeconds = 8 * 3600
  const colors = ['#A78BFA', '#10B981', '#F43F5E', '#FDE047', '#9CA3AF']
  let currentOffset = 0
  const totalArc = 276.5 // pi * 88 
  
  return monitoringStats.value.top_apps.map((app, idx) => {
    const duration = app.duration || 0
    const length = (duration / totalSeconds) * totalArc
    
    // We subtract a small gap only if the segment is substantial
    const gap = length > 3 ? 3 : 0
    
    const segment = {
      length: Math.max(0, length - gap),
      offset: -currentOffset,
      color: colors[idx] || '#E2E8F0'
    }
    currentOffset += length
    return segment
  })
})

const startOffboarding = async () => {
  if (!selectedEmployee.value) return
  showOffboardConfirm.value = false
  isOffboarding.value = true

  // Reset steps
  offboardSteps.value = offboardSteps.value.map(s => ({ ...s, status: 'pending' }))

  // Show progress dialog
  showOffboardProgress.value = true

  // Animate the first step to loading
  offboardSteps.value[0].status = 'loading'

  try {
    const res = await api.post(`/employees/${selectedEmployee.value.id}/offboard`)
    const steps = res.data?.steps || []

    // Animate each step completion with a short delay
    for (let i = 0; i < steps.length; i++) {
      offboardSteps.value[i].status = 'loading'
      await new Promise(r => setTimeout(r, 700))
      offboardSteps.value[i].status = steps[i].success ? 'done' : 'done'
      if (i + 1 < offboardSteps.value.length) {
        offboardSteps.value[i + 1].status = 'loading'
      }
      await new Promise(r => setTimeout(r, 300))
    }

    // Update local employee list
    const idx = employees.value.findIndex(e => e.id === selectedEmployee.value.id)
    if (idx !== -1) {
      employees.value[idx] = {
        ...employees.value[idx],
        offboarded: true,
        laptop: null,
        mouse: null,
        headphone: null,
        seatId: null
      }
    }

    await new Promise(r => setTimeout(r, 500))
    showOffboardProgress.value = false
    showOffboardDone.value = true
  } catch (e) {
    console.error('Offboarding failed', e)
    // Mark remaining steps as done anyway (best-effort)
    offboardSteps.value = offboardSteps.value.map(s => ({ ...s, status: 'done' }))
    await new Promise(r => setTimeout(r, 600))
    showOffboardProgress.value = false
    showOffboardDone.value = true
  } finally {
    isOffboarding.value = false
  }
}

const closeOffboarding = () => {
  showOffboardDone.value = false
  showProfile.value = false
  selectedEmployee.value = null
}

const firstName = ref('')
const lastName = ref('')
const phoneNumber = ref('')
const personalEmail = ref('')
const address = ref('')
const experienceLevel = ref('')
const addStep = ref(1)

const laptop = ref('')
const mouse = ref('')
const headphone = ref('')
const employeeId = ref('')
const department = ref('')
const selectedSeat = ref(null)
const assignedSeatIds = ref([])
const uploadedFile = ref(null)
const avatarPreview = ref(null)
const avatarInput = ref(null)

const joiningDate = ref('')
const salary = ref('')
const employmentType = ref('Full Time')
const compensationData = ref([
  { label: 'BASIC', monthly: 0, yearly: 0 },
  { label: 'HRA', monthly: 0, yearly: 0 },
  { label: 'OTHER ALLOWANCE', monthly: 0, yearly: 0 },
  { label: 'GROSS', monthly: 0, yearly: 0 },
  { label: 'ESI EMPLOER CONT', monthly: 0, yearly: 0 },
  { label: 'EPF EMPLOER CONT', monthly: 0, yearly: 0 },
  { label: 'CTC', monthly: 0, yearly: 0 },
  { label: 'TDS', monthly: 0, yearly: 0 },
  { label: 'EPF EMPLOYEE', monthly: 0, yearly: 0 },
  { label: 'ESI EMPLOYEE', monthly: 0, yearly: 0 },
  { label: 'NET SALARY', monthly: 0, yearly: 0 }
])

const submittedDocsChecklist = ref([
  { label: 'Address Proof (Any Valid ID)', checked: true },
  { label: 'Bank Passbook / Cancelled Cheque (First Page)', checked: false },
  { label: 'Passport Size Photographs (2 copies)', checked: false },
  { label: 'SSLC Certificates', checked: false },
  { label: 'HSC Certificates', checked: true },
  { label: 'Degree Certificate', checked: true },
  { label: 'Previous Company Offer Letter', checked: false },
  { label: 'Experience Letter', checked: true },
  { label: 'Relieving Letter ', checked: false }, // Note the space for uniqueness
  { label: 'Last 3 Months Payslips', checked: true },
  { label: 'Internship Certificate (If any)', checked: true },
  { label: 'Project / Training Certificate (If any)', checked: true },
  { label: 'Relieving Letter', checked: true }
])

const documents = ref([])

const laptopOptions = ref([])
const mouseOptions = ref([])
const headphoneOptions = ref([])

const showAssetSelectDialog = ref(false)
const assetSearch = ref('')
const selectingAssetType = ref('')

const openAssetSelect = (type) => {
  selectingAssetType.value = type
  assetSearch.value = ''
  showAssetSelectDialog.value = true
}

const selectAsset = (assetStr) => {
  if (selectingAssetType.value === 'Laptop') laptop.value = assetStr
  else if (selectingAssetType.value === 'Mouse') mouse.value = assetStr
  else if (selectingAssetType.value === 'Headphone') headphone.value = assetStr
  showAssetSelectDialog.value = false
}

const filteredAssetOptions = computed(() => {
  let opts = []
  if (selectingAssetType.value === 'Laptop') opts = laptopOptions.value
  else if (selectingAssetType.value === 'Mouse') opts = mouseOptions.value
  else if (selectingAssetType.value === 'Headphone') opts = headphoneOptions.value
  
  if (!assetSearch.value) return opts
  return opts.filter(o => o.toLowerCase().includes(assetSearch.value.toLowerCase()))
})

const fetchAssets = async () => {
  try {
    const res = await api.get('/assets')
    if (res.data) {
      // Show only assets that are NOT yet assigned
      const allAssets = res.data.filter(a => !a.assignee)
      
      laptopOptions.value = allAssets
        .filter(a => a.type === 'Laptop')
        .map(a => `${a.brand} ${a.model}${a.sn ? ' (' + a.sn + ')' : ''}`)
      
      mouseOptions.value = allAssets
        .filter(a => a.type === 'Mouse')
        .map(a => `${a.brand} ${a.model}${a.sn ? ' (' + a.sn + ')' : ''}`)
      
      headphoneOptions.value = allAssets
        .filter(a => a.type === 'Headset')
        .map(a => `${a.brand} ${a.model}${a.sn ? ' (' + a.sn + ')' : ''}`)
    }
  } catch (e) {
    console.error("Failed to fetch assets", e)
  }
}

const allowOnlyLetters = (event) => {
  const char = String.fromCharCode(event.keyCode)
  if (!/[a-zA-Z\s]/.test(char)) {
    event.preventDefault()
  }
}


onMounted(async () => {
  fetchAssets()
  try {
    const res = await api.get('/employees')

    if (res.data && res.data.length > 0) {
      employees.value = res.data.map(e => ({
        id: e.id,
        name: e.full_name,
        firstName: e.first_name,
        lastName: e.last_name,
        phoneNumber: e.phone_number,
        personalEmail: e.personal_email,
        address: e.address,
        experienceLevel: e.experience_level,
        role: e.role,
        empId: e.employee_id,
        email: e.email,
        avatar: e.avatar || '/Group 1000003562.svg',
        laptop: e.laptop,
        mouse: e.mouse,
        headphone: e.headphone,
        department: e.department,
        seatId: e.seat_id,
        documents: e.documents || [],
        tempPassword: e.temp_password || null,
        recentApps: e.recent_apps || [],
        offboarded: e.offboarded || false,
        createdAt: e.created_at
      }))

      employees.value.forEach(emp => {
        if (emp.empId && !emp.offboarded) {
          // Pre-populate activity from DB state if available
          activityMap[emp.empId] = {
            app: emp.last_app || '',
            window: emp.last_window || '',
            is_online: emp.is_online || false,
            recentApps: emp.recentApps || []
          }
          connectActivitySocket(emp.empId)
        }
      })

      assignedSeatIds.value = employees.value
        .map(e => e.seatId)
        .filter(id => id)
    }
  } catch (e) {
    console.error("Failed to fetch employees", e)
  }
})

// Hardcoded options removed - now fetched from API
const departmentOptions = ['Junior UX UI Designer', 'Senior Developer', 'Product Manager', 'QA Lead']
const employmentTypeOptions = ['Full Time', 'Part Time', 'Contract', 'Intern']
const experienceOptions = ['Level 1 (Beginner)', 'Level 2 (Intermediate)', 'Level 3 (Advanced)', 'Level 4 (Expert)']

const seats = ref([
  { id: 12, label: '012', available: true },
  { id: 13, label: '013', available: true },
  { id: 14, label: '014', available: true },
  { id: 15, label: '015', available: true },
  { id: 16, label: '016', available: true },
  { id: 17, label: '017', available: true },
  { id: 18, label: '018', available: true },
  { id: 19, label: '019', available: true },
  { id: 20, label: '020', available: false },
  { id: 21, label: '021', available: true },
  { id: 22, label: '022', available: false },
  { id: 23, label: '023', available: false }
])

const triggerAvatarUpload = () => {
  avatarInput.value?.click()
}

const onAvatarChange = (event) => {
  const file = event.target.files?.[0]
  if (!file) return

  // 📸 AUTO-EDIT: Square crop & Resize to 512x512
  const reader = new FileReader()
  reader.onload = (e) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      
      // Target a standard size for profile pictures
      const size = 512
      canvas.width = size
      canvas.height = size
      
      // Calculate crop/resize to cover the square (Centered)
      const minSide = Math.min(img.width, img.height)
      const sourceX = (img.width - minSide) / 2
      const sourceY = (img.height - minSide) / 2
      
      // Draw cropped version to canvas
      ctx.drawImage(img, sourceX, sourceY, minSide, minSide, 0, 0, size, size)
      
      // Set the compressed, squared preview (reduces server load too)
      avatarPreview.value = canvas.toDataURL('image/jpeg', 0.85)
    }
    img.src = e.target.result
  }
  reader.readAsDataURL(file)
}

const addDocument = async () => {
  const file = uploadedFile.value
  if (!file) return
  const picked = Array.isArray(file) ? file[0] : file
  if (!picked) return
  
  const sizeMb = (picked.size / (1024 * 1024)).toFixed(1)
  const tempId = Date.now()
  
  // Add to list with uploading state
  const newDoc = { 
    id: tempId, 
    name: picked.name, 
    size: `${sizeMb} MB`, 
    uploading: true 
  }
  documents.value.push(newDoc)
  uploadedFile.value = null

  // Prepare FormData
  const formData = new FormData()
  formData.append('file', picked)
  // Prioritize name (FirstName_LastName) for folder naming, then ID, then wizard session
  const fName = (firstName.value || '').trim().replace(/\s+/g, '_')
  const lName = (lastName.value || '').trim().replace(/\s+/g, '_')
  
  const identifier = (fName && lName ? `${fName}_${lName}` : '') ||
                     (employeeId.value || '').trim() ||
                     wizardSessionId.value

  if (identifier && identifier.trim()) {
    formData.append('employee_id', identifier.trim())
  }


  try {
    const res = await api.post('/upload-document', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    
    // Update doc in list with SharePoint URL
    const idx = documents.value.findIndex(d => d.id === tempId)
    if (idx !== -1) {
      if (res.data && res.data.success) {
        documents.value.splice(idx, 1, {
          ...documents.value[idx],
          id: res.data.document.id,
          uploading: false,
          sharepoint_url: res.data.document.sharepoint_url
        })
      } else {
        const item = { ...documents.value[idx], uploading: false, error: true }
        documents.value.splice(idx, 1, item)
      }
    }
  } catch (e) {
    console.error('Upload failed', e)
    const idx = documents.value.findIndex(d => d.id === tempId)
    if (idx !== -1) {
      const item = { ...documents.value[idx], uploading: false, error: true }
      documents.value.splice(idx, 1, item)
    }
  }
}


const removeDocument = (id) => {
  documents.value = documents.value.filter(doc => doc.id !== id)
}

const previewPDF = async () => {
  try {
    const payload = {
      employee_name: `${firstName.value} ${lastName.value}`,
      address: address.value,
      date: new Date().toLocaleDateString('en-GB'), // 07-04-2026 format (ish)
      role: department.value,
      joining_date: joiningDate.value,
      salary: salary.value
    }
    
    const response = await fetch(`${API_URL}/preview-pdf`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })

    if (!response.ok) throw new Error("Failed to generate PDF")

    const blob = await response.blob()
    previewUrl.value = URL.createObjectURL(blob)
    showPreview.value = true
  } catch (error) {
    console.error("Preview PDF error:", error)
    alert("Failed to generate preview")
  }
}

const downloadAgent = (employee) => {
  const empId = employee.empId || employee.employee_id
  if (!empId) return
  
  // Open the download link in a new tab/window
  window.open(`${API_URL}/agent/download/${empId}`, '_blank')
}

const resetAddEmployeeForm = () => {
  firstName.value = ''
  lastName.value = ''
  phoneNumber.value = ''
  personalEmail.value = ''
  address.value = ''
  experienceLevel.value = ''
  employeeId.value = ''
  department.value = ''
  laptop.value = ''
  mouse.value = ''
  headphone.value = ''
  uploadedFile.value = null
  documents.value = []
  avatarPreview.value = null
  selectedSeat.value = null
  addStep.value = 1
  // Generate a fresh session ID for this wizard instance
  wizardSessionId.value = `New_${Date.now()}`
}

const openAddEmployee = () => {
  resetAddEmployeeForm()
  showAddEmployee.value = true
}


const cancelAddEmployee = () => {
  resetAddEmployeeForm()
  showAddEmployee.value = false
  selectedEmployee.value = null
}

const isSeatAssigned = (id) => assignedSeatIds.value.includes(id)

const profileDevices = computed(() => {
  if (!selectedEmployee.value) return []
  const devices = [
    { label: 'Laptop', value: selectedEmployee.value.laptop },
    { label: 'Mouse', value: selectedEmployee.value.mouse },
    { label: 'Headphone', value: selectedEmployee.value.headphone }
  ]
  return devices.filter(d => d.value)
})

const openProfile = (employee) => {
  selectedEmployee.value = employee
  showCredentials.value = false
  showProfile.value = true
  showAddEmployee.value = false
  showAccountCreation.value = false
}

const closeProfile = () => {
  showProfile.value = false
  selectedEmployee.value = null
}

const formatDuration = (seconds, compact = false) => {
  if (!seconds || seconds <= 0) return '0m'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (compact) {
    if (h > 0 && m > 0) return `${h}h ${m}m`   // show full "8h 24m"
    if (h > 0) return `${h}h`
    return `${m}m`
  }
  if (h > 0 && m > 0) return `${h}h ${m}m`
  if (h > 0) return `${h}h`
  return `${m}m`
}

const getCleanAppName = (exeName) => {
  const nameMap = {
    'msedge.exe': 'Microsoft Edge',
    'code.exe': 'Visual Studio Code',
    'figma.exe': 'Figma',
    'teams.exe': 'Microsoft Teams',
    'outlook.exe': 'Microsoft Outlook',
    'chrome.exe': 'Google Chrome'
  }
  return nameMap[exeName.toLowerCase()] || exeName.replace('.exe', '')
}

const selectedTimeframe = ref('This Week')

const changeTimeframe = async (tf) => {
  selectedTimeframe.value = tf
  if (selectedEmployee.value) {
    await fetchMonitoringStats(selectedEmployee.value)
  }
}

const fetchMonitoringStats = async (employee) => {
  try {
    const res = await api.get(`/employees/${employee.empId}/activity-stats`, {
      params: { timeframe: selectedTimeframe.value }
    })
    if (res.data && res.data.success) {
      monitoringStats.value = res.data
    } else {
      throw new Error("Invalid response format")
    }
  } catch (err) {
    console.warn('Failed to fetch activity stats, using empty data:', err.message)
    monitoringStats.value = {
      success: true,
      today_total_seconds: 0,
      top_apps: [],
      weekly_trends: [],
      is_overtime: false
    }
  }
}

const openMonitoring = async (employee) => {
  selectedEmployee.value = employee
  showCredentials.value = false
  showProfile.value = false
  showAddEmployee.value = false
  showAccountCreation.value = false
  showOffboarded.value = false
  showMonitoring.value = true
  monitoringStats.value = null
  selectedTimeframe.value = 'This Week'
  
  await fetchMonitoringStats(employee)
}

const closeMonitoring = () => {
  showMonitoring.value = false
  selectedEmployee.value = null
  monitoringStats.value = null
}

const editProfile = () => {
  if (!selectedEmployee.value) return
  openEditBasic()
}

const showEditBasicModal = ref(false)
const showEditJobModal = ref(false)
const showEditAssetsModal = ref(false)
const showEditDocsModal = ref(false)

const isSavingProfile = ref(false)
const tempPhone = ref('None')
const docsList = ref([])
const docsFile = ref(null)

const openEditBasic = () => {
  if (!selectedEmployee.value) return
  const emp = selectedEmployee.value
  const nameParts = (emp.name || '').split(' ')
  firstName.value = emp.firstName || nameParts[0] || ''
  lastName.value = emp.lastName || nameParts.slice(1).join(' ') || ''
  phoneNumber.value = emp.phoneNumber || ''
  personalEmail.value = emp.personalEmail || ''
  address.value = emp.address || ''
  avatarPreview.value = emp.avatar || null
  showProfile.value = false
  showEditBasicModal.value = true
}

const openEditJob = () => {
  if (!selectedEmployee.value) return
  const emp = selectedEmployee.value
  employeeId.value = emp.empId || ''
  department.value = emp.role || '' 
  selectedSeat.value = emp.seatId || null
  experienceLevel.value = emp.experienceLevel || ''
  showEditJobModal.value = true
}

const openEditAssets = () => {
  if (!selectedEmployee.value) return
  const emp = selectedEmployee.value
  laptop.value = emp.laptop || ''
  mouse.value = emp.mouse || ''
  headphone.value = emp.headphone || ''
  showEditAssetsModal.value = true
}

const openEditDocs = () => {
  if (!selectedEmployee.value) return
  const emp = selectedEmployee.value
  docsList.value = emp.documents ? [...emp.documents] : []
  docsFile.value = null
  showEditDocsModal.value = true
}

const formatSize = (bytes) => {
  if(bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const addDocFile = async (val) => {
  const file = docsFile.value || val
  if (!file) return
  const picked = Array.isArray(file) ? file[0] : file
  if (!picked) return

  const tempId = Date.now()
  const newDoc = {
    id: tempId,
    name: picked.name,
    size: formatSize(picked.size),
    uploading: true
  }
  docsList.value.push(newDoc)
  docsFile.value = null // reset

  const formData = new FormData()
  formData.append('file', picked)
  
  const fName = (firstName.value || '').trim().replace(/\s+/g, '_')
  const lName = (lastName.value || '').trim().replace(/\s+/g, '_')
  
  // Prioritize FirstName_LastName to match existing SharePoint folders like David_Beckam
  const identifier = (fName && lName ? `${fName}_${lName}` : '') ||
                     (selectedEmployee.value?.empId || '').trim()

  if (identifier) {
    formData.append('employee_id', identifier)
  }

  try {
    const res = await api.post('/upload-document', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    const idx = docsList.value.findIndex(d => d.id === tempId)
    if (idx !== -1) {
      if (res.data && res.data.success) {
        docsList.value.splice(idx, 1, {
          ...docsList.value[idx],
          uploading: false,
          sharepoint_url: res.data.document.sharepoint_url
        })
      } else {
        docsList.value.splice(idx, 1, { ...docsList.value[idx], uploading: false, error: true })
      }
    }
  } catch (err) {
    console.error("Upload error", err)
    const idx = docsList.value.findIndex(d => d.id === tempId)
    if (idx !== -1) {
      docsList.value[idx].uploading = false
    }
  }
}

const closeEditBasic = () => {
  showEditBasicModal.value = false
  showProfile.value = true
}

const saveSection = async (type) => {
  if (!selectedEmployee.value) return
  isSavingProfile.value = true
  
  const payload = {}
  
  if (type === 'basic') {
    payload.first_name = firstName.value
    payload.last_name = lastName.value
    payload.phone_number = phoneNumber.value
    payload.personal_email = personalEmail.value
    payload.address = address.value
    if (avatarPreview.value && avatarPreview.value.startsWith('data:image')) {
       payload.avatar = avatarPreview.value
    }
  } else if (type === 'job') {
    payload.employee_id = employeeId.value
    payload.role = department.value
    payload.seat_id = selectedSeat.value
    payload.experience_level = experienceLevel.value
  } else if (type === 'assets') {
    payload.laptop = laptop.value
    payload.mouse = mouse.value
    payload.headphone = headphone.value
  } else if (type === 'docs') {
    // Strip out real file objects before saving to DB config
    payload.documents = docsList.value.map(d => ({ 
      name: d.name, 
      size: d.size, 
      sharepoint_url: d.sharepoint_url 
    }))
  }

  try {
    const res = await api.patch(`/employees/${selectedEmployee.value.id}`, payload)
    if (res.data?.success) {
      const idx = employees.value.findIndex(e => e.id === selectedEmployee.value.id)
      if (idx !== -1) {
        const dbEmp = res.data.employee
        employees.value[idx] = { 
          ...employees.value[idx],
          firstName: dbEmp.first_name,
          lastName: dbEmp.last_name,
          name: dbEmp.full_name,
          phoneNumber: dbEmp.phone_number,
          personalEmail: dbEmp.personal_email,
          address: dbEmp.address,
          avatar: dbEmp.avatar,
          role: dbEmp.role,
          empId: dbEmp.employee_id,
          seatId: dbEmp.seat_id,
          experienceLevel: dbEmp.experience_level,
          laptop: dbEmp.laptop,
          mouse: dbEmp.mouse,
          headphone: dbEmp.headphone,
          department: dbEmp.department,
          documents: dbEmp.documents
        }
        selectedEmployee.value = employees.value[idx]
      }
      
      if (type === 'basic') {
        showEditBasicModal.value = false
        showProfile.value = true
      } else if (type === 'job') {
        showEditJobModal.value = false
      } else if (type === 'assets') {
        showEditAssetsModal.value = false
      } else if (type === 'docs') {
        showEditDocsModal.value = false
      }
    }
  } catch (e) {
    console.error('Save failed', e)
    alert('Failed to save details')
  } finally {
    isSavingProfile.value = false
  }
}

const openAccountCreation = (employee) => {
  const parts = (employee?.name || '').trim().split(' ').filter(Boolean)
  emailFirstName.value = parts.shift() || ''
  emailLastName.value = parts.join(' ')
  emailEmployeeId.value = employee?.id || null
  emailPreview.value = ''
  tempPassword.value = ''
  emailExisting.value = ''
  emailStep.value = 'select'
  showPassword.value = false
  showAccountCreation.value = true
  showAddEmployee.value = false
}
const copyToClipboard = (text) => {
  if (!text) return
  navigator.clipboard.writeText(text)
}
const closeAccountCreation = () => {
  showAccountCreation.value = false
}

const generateEmail = async () => {
  if (!emailFirstName.value.trim()) return
  isGeneratingEmail.value = true
  try {
    const res = await api.post('/preview-email', {
      first_name: emailFirstName.value.trim(),
      last_name: emailLastName.value.trim()
    })
    if (res.data?.success) {
      emailPreview.value = res.data.email
      tempPassword.value = res.data.temporary_password
      emailStep.value = 'preview'
    }
  } catch (e) {
    console.error('Failed to generate email', e)
  } finally {
    isGeneratingEmail.value = false
  }
}

const startResendTimer = () => {
  resendTimer.value = 60
  if (resendInterval.value) clearInterval(resendInterval.value)
  resendInterval.value = setInterval(() => {
    if (resendTimer.value > 0) {
      resendTimer.value--
    } else {
      clearInterval(resendInterval.value)
    }
  }, 1000)
}

const saveExistingEmail = async () => {
  if (!emailExisting.value.trim() || !emailEmployeeId.value) return
  isSendingVerificationCode.value = true // Reusing variable for loading state to avoid defining a new one
  try {
    await api.patch(`/employees/${emailEmployeeId.value}/email`, {
      email: emailExisting.value.trim()
    })
    
    const idx = employees.value.findIndex(e => e.id === emailEmployeeId.value)
    if (idx !== -1) {
      employees.value[idx].email = emailExisting.value.trim()
      if (selectedEmployee.value && selectedEmployee.value.id === emailEmployeeId.value) {
         selectedEmployee.value = employees.value[idx]
      }
    }
    emailStep.value = 'existing_success'
  } catch (e) {
    console.error('Failed to update email', e)
    alert("Failed to update email. Please try again.")
  } finally {
    isSendingVerificationCode.value = false
  }
}

const createMicrosoftAccount = async () => {
  if (!emailPreview.value || !tempPassword.value) return

  isCreatingMicrosoftAccount.value = true

  try {
    const fullName = `${emailFirstName.value} ${emailLastName.value}`.trim()

    const res = await api.post('/create-m365-user', {
      full_name: fullName,
      email: emailPreview.value,
      password: tempPassword.value
    })

    //force success UI
    emailStep.value = 'success'

    if (emailEmployeeId.value) {
      try {
        await api.patch(`/employees/${emailEmployeeId.value}/email`, {
          email: emailPreview.value,
          temp_password: tempPassword.value
        })

        const idx = employees.value.findIndex(
          e => e.id === emailEmployeeId.value
        )

        if (idx !== -1) {
          employees.value[idx] = {
            ...employees.value[idx],
            email: emailPreview.value,
            tempPassword: tempPassword.value 
          }
           if (selectedEmployee.value && selectedEmployee.value.id === emailEmployeeId.value) {
             selectedEmployee.value = employees.value[idx]
           } 
        }
      } catch (e) {
        console.error('Failed to update employee email', e)
      }
    }

  } catch (e) {
    console.error('Failed to create Microsoft account', e)
  } finally {
    isCreatingMicrosoftAccount.value = false
  }
}

const createAccountWizard = async () => {
  if (!firstName.value.trim() || !lastName.value.trim()) return
  isCreating.value = true
  
  try {
    const payload = {
      first_name: firstName.value.trim(),
      last_name: lastName.value.trim(),
      phone_number: phoneNumber.value.trim(),
      personal_email: personalEmail.value.trim(),
      address: address.value.trim(),
      experience_level: experienceLevel.value,
      role: department.value || 'Employee',
      employee_id: employeeId.value || 'N/A',
      email: selectedEmployee.value ? selectedEmployee.value.email : '', 
      avatar: avatarPreview.value || '/Group 1000003562.svg',
      laptop: laptop.value,
      mouse: mouse.value,
      headphone: headphone.value,
      department: department.value,
      seat_id: selectedSeat.value,
      documents: documents.value.map(d => ({ name: d.name, size: d.size }))
    }

    let createdRecord = null;
    let localCreatedAt = new Date().toISOString()
    
    if (selectedEmployee.value) {
      // Update existing employee
      const patchRes = await api.patch(`/employees/${selectedEmployee.value.id}`, payload)
      if (patchRes.data && patchRes.data.employee) {
         localCreatedAt = patchRes.data.employee.created_at
      }
      
      const updatedEmp = {
        ...selectedEmployee.value,
        name: `${payload.first_name} ${payload.last_name}`,
        firstName: payload.first_name,
        lastName: payload.last_name,
        phoneNumber: payload.phone_number,
        personalEmail: payload.personal_email,
        address: payload.address,
        experienceLevel: payload.experience_level,
        role: payload.role,
        empId: payload.employee_id,
        avatar: payload.avatar,
        laptop: payload.laptop,
        mouse: payload.mouse,
        headphone: payload.headphone,
        department: payload.department,
        seatId: payload.seat_id,
        documents: documents.value,
        createdAt: localCreatedAt
      }
      createdRecord = updatedEmp
      
      const idx = employees.value.findIndex(e => e.id === selectedEmployee.value.id)
      if (idx !== -1) {
        employees.value[idx] = updatedEmp
      }
      
      // Update seat assignment
      assignedSeatIds.value = assignedSeatIds.value.filter(id => id !== selectedEmployee.value.seatId)
      if (selectedSeat.value) {
        assignedSeatIds.value.push(selectedSeat.value)
      }

    } else {
      // Create new employee
      const res = await api.post('/employees', payload)
      
      const newEmployee = {
        id: res.data.id,
        name: res.data.full_name,
        firstName: res.data.first_name,
        lastName: res.data.last_name,
        phoneNumber: res.data.phone_number,
        personalEmail: res.data.personal_email,
        address: res.data.address,
        experienceLevel: res.data.experience_level,
        role: res.data.role,
        empId: res.data.employee_id,
        email: res.data.email,
        avatar: res.data.avatar,
        seatId: res.data.seat_id,
        laptop: res.data.laptop,
        mouse: res.data.mouse,
        headphone: res.data.headphone,
        department: res.data.department,
        tempPassword: res.data.temp_password || null,
        documents: res.data.documents ? JSON.parse(res.data.documents) : [],
        createdAt: res.data.created_at
      }
      createdRecord = newEmployee

      employees.value.unshift(newEmployee)

      if (selectedSeat.value && !assignedSeatIds.value.includes(selectedSeat.value)) {
        assignedSeatIds.value.push(selectedSeat.value)
      }
    }
    
    addStep.value = 5 // Move to completion wizard step

  } catch (e) {
    console.error('Failed to save user', e)
  } finally {
    isCreating.value = false
  }
}

const deleteEmployee = async (employee) => {
  if (employee.email && employee.email.trim() !== '') return // Safety check
  try {
    await api.delete(`/employees/${employee.id}`)
    employees.value = employees.value.filter(e => e.id !== employee.id)
    // Release seat if assigned
    if (employee.seatId) {
      assignedSeatIds.value = assignedSeatIds.value.filter(id => id !== employee.seatId)
    }
  } catch (e) {
    console.error('Failed to delete employee', e)
  }
}

const roleFilter = ref('All')
const emailFilter = ref('All')
const showOffboarded = ref(false)
const offboardedSearch = ref('')

const emailFilterOptions = ['All', 'Created', 'Not Created']

const roleOptions = computed(() => {
  const roles = [...new Set(employees.value.map(e => e.role).filter(Boolean))].sort()
  return ['All', ...roles]
})

const activeEmployees = computed(() => employees.value.filter(e => !e.offboarded))

const offboardedEmployees = computed(() => employees.value.filter(e => e.offboarded))

const filteredOffboardedEmployees = computed(() => {
  const q = offboardedSearch.value.toLowerCase()
  if (!q) return offboardedEmployees.value
  return offboardedEmployees.value.filter(e =>
    (e.name || '').toLowerCase().includes(q) ||
    (e.role || '').toLowerCase().includes(q) ||
    (e.empId || '').toLowerCase().includes(q) ||
    (e.email || '').toLowerCase().includes(q)
  )
})

const filteredEmployees = computed(() => {
  let list = activeEmployees.value
  const q = searchQuery.value.toLowerCase()
  if (q) {
    list = list.filter(e =>
      (e.name || '').toLowerCase().includes(q) ||
      (e.role || '').toLowerCase().includes(q) ||
      (e.empId || '').includes(q) ||
      (e.email || '').toLowerCase().includes(q)
    )
  }
  if (roleFilter.value !== 'All') {
    list = list.filter(e => e.role === roleFilter.value)
  }
  if (emailFilter.value === 'Created') {
    list = list.filter(e => !!e.email)
  } else if (emailFilter.value === 'Not Created') {
    list = list.filter(e => !e.email)
  }
  return list
})

const validateStep1 = () => {
  if (!personalEmail.value || !personalEmail.value.trim()) {
    alert("Personal Email is required")
    return
  }

  addStep.value = 2
}

const activityMap = reactive({})
const connectedSockets = new Set()

const normalizeAppKey = (appFile) => {
  const low = (appFile || '').toString().trim().toLowerCase()
  if (!low) return ''
  if (low.endsWith('.exe') || low === 'idle' || low === 'desktop') return low
  return `${low}.exe`
}

const getAppIcon = (appFile) => {
  const key = normalizeAppKey(appFile)
  if (!key) return '/app-fallback.svg'
  // Agent uploads real icons; backend serves them from /app-icons/<app>.png
  return `${API_URL}/app-icons/${encodeURIComponent(key)}.png`
}

const connectActivitySocket = (employeeEmpId) => {
  if (connectedSockets.has(employeeEmpId)) return
  
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  const host = API_URL.replace(/^https?:\/\//, '')
  const ws = new WebSocket(`${protocol}//${host}/ws/activity/${employeeEmpId}`)

  ws.onopen = () => {
    connectedSockets.add(employeeEmpId)
    if (!activityMap[employeeEmpId]) {
      activityMap[employeeEmpId] = { is_online: false, app: '', window: '', recentApps: [] }
    }
  }

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data)
      console.log(`[WS] ${employeeEmpId} ->`, data.app, '|', data.window)
      const app = data.app || ''
      const window = data.window || ''
      const isOnline = data.is_online ?? true

      if (!activityMap[employeeEmpId]) {
        activityMap[employeeEmpId] = { is_online: isOnline, recentApps: [] }
      }
      
      activityMap[employeeEmpId].app = app
      activityMap[employeeEmpId].window = window
      activityMap[employeeEmpId].is_online = isOnline

      if (app) {
        if (!activityMap[employeeEmpId].recentApps) {
          activityMap[employeeEmpId].recentApps = []
        }
        
        // Ensure this app is at the top of recentApps
        const existingIdx = activityMap[employeeEmpId].recentApps.findIndex(a => a.app.toLowerCase() === app.toLowerCase())
        if (existingIdx !== -1) {
          activityMap[employeeEmpId].recentApps.splice(existingIdx, 1)
        }
        activityMap[employeeEmpId].recentApps.unshift({ app, window })

        // Limit to 7 recent apps
        if (activityMap[employeeEmpId].recentApps.length > 7) {
          activityMap[employeeEmpId].recentApps.pop()
        }
      }
    } catch (e) {
      console.error('WS parse error', e)
    }
  }

  ws.onclose = () => {
    connectedSockets.delete(employeeEmpId)
    if (activityMap[employeeEmpId]) {
      activityMap[employeeEmpId].is_online = false
    }
    setTimeout(() => connectActivitySocket(employeeEmpId), 3000)
  }
  
  ws.onerror = () => {
    ws.close()
  }
}
</script>

<style scoped>
.page-background {
  font-family: 'Manrope', sans-serif;
  background-image: url('/Assist IQ (9).svg');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  background-attachment: fixed;
  min-height: 100vh;
}

/* ── Search & Header ── */
.search-input :deep(.q-field__control) {
  border-radius: 30px;
  background: #ffffff;
}

.add-btn {
  color: #5D5FEF;
  font-weight: 600;
  border-radius: 30px;
}

.add-btn:hover {
  border-radius: 30px;
}

/* ── Filter bar ── */
.filter-search {
  max-width: 260px;
  min-width: 160px;
}

.filter-pill-wrap {
  display: flex;
  align-items: center;
}

.filter-pill {
  background: #ffffff;
  border: 1px solid #E5E7EB;
  border-radius: 999px;
  color: #374151;
  font-weight: 500;
  font-size: 13px;
  padding: 4px 14px;
  height: 38px;
}

.filter-pill :deep(.q-btn-dropdown__arrow) {
  margin-left: 2px;
}

.offboarded-list-btn {
  border-radius: 999px;
  color: #4C36E4;
  font-weight: 600;
  font-size: 14px;
  padding: 4px 16px;
  height: 38px;
  white-space: nowrap;
}

.add-new-btn {
  background: #4C36E4;
  color: #ffffff;
  border-radius: 999px;
  font-weight: 600;
  font-size: 13px;
  padding: 4px 18px;
  height: 38px;
  white-space: nowrap;
}

/* ── Offboarded Employee Cards ── */
.offboarded-card {
  background: #ffffff;
  border-radius: 22px;
  padding: 18px 18px 14px;
  border: none;
  box-shadow: 0 4px 18px rgba(0, 0, 0, 0.05);
  width: 100%;
  cursor: pointer;
  transition: box-shadow 0.18s ease, transform 0.18s ease;
}

.offboarded-card:hover {
  box-shadow: 0 8px 28px rgba(93, 95, 239, 0.12);
  transform: translateY(-2px);
}

/* ── Employee Cards ── */
.employee-card {
  background: #ffffff;
  border-radius: 30px;
  padding: 16px;
  border: none;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03);
  width: 100%;
}

.online-badge {
  background: #1587061A;
  color: #158706;
  font-size: 11px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 999px;
  white-space: nowrap;
}

.offline-badge {
  background: #DD28281A;
  color: #DD2828;
  font-size: 11px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 999px;
  white-space: nowrap;
}

.app-icon-wrap {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #F8F9FA;
  border: 1px solid #EDEDED;
}

.app-icon {
  width: 24px;
  height: 24px;
  object-fit: contain;
}

.employee-header-box {
  border-radius: 14px;
  background: linear-gradient(180deg, #F6F5FD 0%, #FFFFFF 100%);
  padding: 12px 14px;
}

/* Remove old grid styles */
.employee-header,
.employee-details,
.card-grid,
.card-col {
  display: initial;
}

.employee-avatar {
  background: #ffffff;
  border: 1px solid #ffffff;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
  flex: 0 0 auto;
}

.employee-avatar :deep(img),
.q-avatar img {
  object-fit: cover;
}

.employee-details {
  padding-left: 6px;
}

.employee-header-text {
  line-height: 1.2;
}

.icon-accent { color: #5D5FEF; }
.icon-muted  { color: #9CA3AF; }

.view-btn {
  background: #5D5FEF;
  color: #ffffff;
  border-radius: 999px;
  font-weight: 600;
  height: 40px;
}

.profile-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
}

.profile-card {
  width: 100%;
  border-radius: 30px;
  background: #ffffff;
  box-shadow: 0 14px 32px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  position: relative;
}

.profile-banner {
  height: 100px;
  background-image: url('/Subtract.svg');
  background-size: cover;
  background-position: left bottom;
  background-repeat: no-repeat;
}

.profile-content {
  padding: 62px 24px 32px;
}

.profile-header-container {
  position: absolute;
  left: 45px;
  top: 95px;
  transform: translateY(-50%);
  z-index: 3;
}

.profile-avatar-wrap {
  margin: 0;
}

.profile-avatar {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

@media (max-width: 768px) {
  .profile-content {
    padding: 56px 16px 24px;
  }

  .profile-header-container {
    left: 19px;
  }
}

.profile-edit-btn {
  border-radius: 30px;
  color: #5D5FEF;
  background: #F3F0FF;
  padding: 8px 16px;
  font-weight: 600;
}

.offboard-btn {
  border-radius: 30px;
  color: #ffffff;
  background: linear-gradient(135deg, #5D5FEF 0%, #7C3AED 100%);
  padding: 8px 18px;
  font-weight: 600;
}

/* ── Offboarding Popup ── */
.offboard-popup {
  width: 520px;
  border-radius: 24px;
  padding: 0;
  box-shadow: 0 20px 60px rgba(0,0,0,0.14);
  overflow: hidden;
}

.offboard-popup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px 24px 10px;
}

.offboard-popup-title {
  font-size: 18px;
  font-weight: 700;
  color: #111827;
}

.offboard-popup-body {
  padding: 8px 24px 20px;
}

.offboard-popup-question {
  font-size: 14px;
  color: #374151;
  margin-bottom: 14px;
}

.offboard-actions-title {
  font-size: 14px;
  font-weight: 700;
  color: #111827;
  margin-bottom: 10px;
}

.offboard-actions-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.offboard-actions-list li {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  font-size: 14px;
  color: #111827;
}

.offboard-actions-list li::before {
  content: '';
  display: inline-block;
  width: 8px;
  height: 8px;
  min-width: 8px;
  border-radius: 50%;
  background: #5D5FEF;
  margin-top: 5px;
}

.offboard-actions-sub {
  color: #9CA3AF;
  font-size: 13px;
}

.offboard-popup-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 12px 24px 24px;
}

.offboard-cancel-btn {
  border-radius: 999px;
  background: #F3F4F6;
  color: #374151;
  font-weight: 500;
  min-width: 90px;
}

.offboard-confirm-btn {
  border-radius: 999px;
  background: #5D5FEF;
  color: #ffffff;
  font-weight: 600;
  min-width: 90px;
}

/* ── Offboarding Progress ── */
.offboard-progress-sub {
  font-size: 13px;
  color: #374151;
  margin-bottom: 16px;
}

.offboard-progress-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.offboard-progress-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.offboard-step-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.offboard-step-label {
  font-size: 14px;
  font-weight: 500;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}

.spin-icon {
  animation: spin 0.9s linear infinite;
  transform-origin: center;
}

/* ── Offboarding Done ── */
.offboard-done-popup {
  width: 400px;
  border-radius: 24px;
  padding: 40px 32px 32px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 14px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.14);
}

.offboard-done-icon-wrap {
  margin-bottom: 4px;
}

.offboard-done-circle {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: linear-gradient(135deg, #06B6D4 0%, #5D5FEF 50%, #A855F7 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 0 12px rgba(99, 102, 241, 0.10);
}

.offboard-done-title {
  font-size: 18px;
  font-weight: 700;
  color: #111827;
}

.offboard-done-subtitle {
  font-size: 13px;
  color: #9CA3AF;
  max-width: 280px;
}

.offboard-done-btn {
  border-radius: 999px;
  background: #5D5FEF;
  color: #ffffff;
  font-weight: 600;
  min-width: 140px;
  height: 42px;
  margin-top: 8px;
}

.device-card,
.doc-card {
  background: #F6F6FB;
  border-radius: 999px; /* Pill shape */
  padding: 12px 20px;
  display: flex;
  align-items: center;
  gap: 12px;
  border: none;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.02);
  transition: all 0.2s ease;
}

.device-card:hover,
.doc-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.05);
}

.device-icon-circle,
.doc-icon-circle {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: #FFFFFF;
  color: #5D5FEF;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.device-meta,
.doc-meta {
  flex: 1;
  overflow: hidden;
  padding-left: 4px;
}

.device-title,
.doc-title {
  font-size: 14px;
  color: #111827;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.device-sub,
.doc-sub {
  font-size: 12px;
  color: #585858;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-weight: 400;
}

.device-more,
.doc-more {
  color: #111827;
  flex-shrink: 0;
  opacity: 0.6;
}

.device-more:hover,
.doc-more:hover {
  opacity: 1;
}

/* ── Popups ── */
.unassign-popup {
  border-radius: 40px;
  width: 500px;
  max-width: 90vw;
}

.unassign-no-btn {
  background: #F3F4FB;
  color: #111827;
  border-radius: 30px;
  padding: 8px 36px;
  font-weight: 600;
}

.unassign-yes-btn {
  background: #5D5FEF;
  color: #ffffff;
  border-radius: 30px;
  padding: 8px 36px;
  font-weight: 600;
}

.asset-details-popup {
  border-radius: 40px;
  width: 500px;
  max-width: 90vw;
}

.asset-details-header-box {
  background: #F8F9FD;
  border-radius: 20px;
}

.asset-details-close-btn {
  background: #F3F4FB;
  color: #111827;
  border-radius: 30px;
  padding: 8px 40px;
  font-weight: 600;
}

.device-menu {
  border-radius: 30px !important;
  overflow: hidden;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1) !important;
  border: 1px solid #EDEDED;
}

:deep(.q-menu),
:deep(.q-menu .q-list),
:deep(.default-select-popup),
:deep(.default-select-popup .q-list) {
  border-radius: 30px !important;
}

/* ── Add Employee ── */
.add-employee-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
}

.add-employee-card {
  width: 100%;
  border-radius: 40px;
  padding: 40px;
  background: #ffffff;
  border: 1px solid #EEF0F5;
  box-shadow: 0 14px 32px rgba(0, 0, 0, 0.08);
}

/* Avatar with camera overlay */
.avatar-wrapper {
  position: relative;
  width: 72px;
  height: 72px;
}

.add-avatar {
  width: 72px !important;
  height: 72px !important;
  background: #E8E7F9;
  box-shadow: 0 4px 12px rgba(93, 95, 239, 0.15);
  overflow: hidden;
}

.add-avatar img {
  object-fit: cover !important;
}

.camera-overlay {
  position: absolute;
  bottom: 2px;
  right: 2px;
  width: 22px;
  height: 22px;
  background: #ffffff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border: 2px solid #ffffff;
}

/* Upload box — dashed border with centered icon + text (image 1 style) */
.upload-input :deep(.q-field__control) {
  background: transparent;
  border: 1.5px dashed #C4C6D8;
  border-radius: 30px;
  min-height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.upload-input :deep(.q-field__control:before),
.upload-input :deep(.q-field__control:after) {
  border: none !important;
}

.upload-input :deep(.q-field__label) {
  position: static;
  transform: none;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 1;
}

.upload-input :deep(.q-field__control-container) {
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.upload-input :deep(.q-field__native) {
  display: none;
}

.upload-label {
  font-size: 14px;
  color: #000000;
  text-align: center;
}

.upload-link {
  color: #5D5FEF;
  font-weight: 600;
  text-decoration: underline;
}

/* Documents */
.doc-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.doc-item {
  background: #F7F7FB;
  border-radius: 14px;
  padding: 10px 12px;
  gap: 10px;
}

.doc-icon  { color: #5D5FEF; }
.doc-name  { font-size: 13px; font-weight: 600; color: #111827; }
.doc-size  { font-size: 11px; color: #9CA3AF; }
.doc-remove { color: #9CA3AF; }

.doc-meta {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

/* Form fields */
.form-input :deep(.q-field__control) {
  background: transparent;
  border: 1px solid #E2E2E2;
  border-radius: 999px;
  height: 40px;
  margin-top: 5px;
}

.form-input :deep(.q-field__control:before),
.form-input :deep(.q-field__control:after) {
  display: none;
}

.form-input :deep(.q-field__label) {
  top: -24px;
  left: 0;
  transform: none;
  font-size: 13px;
  color: #585858;
  font-weight: 500;
}

.form-input :deep(.q-field__native) {
  padding-top: 0;
  padding-bottom: 0;
  min-height: 48px;
}


.row.q-col-gutter-md > div {
  padding-top: 23px;
}

.form-input :deep(.q-select__dropdown-icon) {
  color: #111827;
}

.section-title {
  font-weight: 700;
  font-size: 15px;
}

.seat-grid-container {
  background: #FAFAFA;
  border-radius: 30px;
  padding: 30px 24px;
}

.seat-grid {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 30px 40px;
}

.hover-asset {
  transition: all 0.2s ease;
  cursor: pointer;
}
.hover-asset:hover {
  background: #F3F4FB !important;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
}

.assign-asset-placeholder {
  transition: all 0.2s ease;
}
.assign-asset-placeholder:hover {
  background: rgba(76, 54, 228, 0.05);
  border-color: #4C36E4 !important;
}

/* Fix stepper label alignment */
.stepper-labels .text-primary {
  color: #4C36E4 !important;
  font-weight: 600;
}

.form-input :deep(.q-field__control) {
  border-radius: 20px !important;
}

.form-input :deep(.q-placeholder) {
  color: #9CA3AF;
  opacity: 1;
}

.seat-wrapper {
  transition: transform 0.2s;
}

.seat-wrapper:hover {
  transform: scale(1.05);
}

.seat-icon {
  transition: color 0.2s;
}

.seat-label {
  font-size: 12px;
  font-weight: 600;
}

/* Back button */
.back-btn { color: #4B5563; }

/* Footer buttons */
.secondary-btn {
  border-radius: 999px;
  color: #E2E2E2;
  border-color: #E5E7EB;
}

.primary-btn {
  border-radius: 999px;
  background: #4C36E4;
  color: #FFFFFF;
  font-weight: 600;
  min-width: 86px;
}

.account-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
}

.account-page-card {
  width: 100%;
  height: 573px;
  border-radius: 30px;
  padding: 40px;
  background: #ffffff;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.account-page-inner {
  max-width: 800px;
  width: 100%;
  margin: 0 auto;
}

.account-preview-card {
  background: #F7F7FB;
  border-radius: 28px;
  padding: 30px;
  width: 100%;
}

.account-preview-fields {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.account-preview-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.account-preview-label {
  font-size: 13px;
  color: #9CA3AF;
  font-weight: 500;
}

.account-preview-input :deep(.q-field__control) {
  background: #F3F4F6;
  border: none;
  border-radius: 999px;
  height: 44px;
}

.account-preview-input :deep(.q-field__control:before),
.account-preview-input :deep(.q-field__control:after) {
  display: none;
}

.account-preview-input :deep(.q-field__native) {
  padding-top: 0;
  padding-bottom: 0;
  min-height: 44px;
}

.account-action-btn {
  width: 100%;
  height: 44px;
}

.account-success {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 12px;
}

.account-success-icon {
  width: 120px;
  height: 120px;
}

.account-success-title {
  font-weight: 700;
  font-size: 16px;
  color: #111827;
}

.account-success-subtitle {
  font-size: 12px;
  color: #9CA3AF;
  max-width: 320px;
}

.gradient-text {
 background: linear-gradient(90deg, #00BCC9 0%, rgba(76, 54, 228, 0.99) 50%, #CF20AE 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-weight: 600;
  font-size: 26px;
  margin-top: -150px;
}

.account-success-btn {
  min-width: 120px;
  height: 36px;
  margin-top: 6px;
}
.credential-popup {
  width: 520px;
  border-radius: 30px;
  padding: 28px;
}

.credential-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.credential-title {
  font-size: 20px;
  font-weight: 600;
}

.credential-row {
  margin-bottom: 20px;
}

.credential-label {
  font-size: 13px;
  color: #9CA3AF;
  margin-bottom: 6px;
}

.credential-value-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 16px;
}

.copy-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #4C36E4;
  cursor: pointer;
}

.credential-close-btn {
  width: 80px;
  margin-top: 20px;
  border-radius: 20px;
  background: #F3F4F6;
  color: #111827;
  margin-left: 85%;
}
.profile-divider {
  margin-top: 14px;
  margin-bottom: 18px;
  border-color: rgba(0, 0, 0, 0.08);
}

.stepper-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 320px;
  max-width: 100%;
}

.step-circle {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background-color: #F3F4F6;
  color: #9CA3AF;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 600;
  transition: all 0.3s;
}

.step-circle.active {
  background-color: #4C36E4;
  color: #FFFFFF;
}

.step-line {
  flex: 1;
  height: 2px;
  background-color: #F3F4F6;
  margin: 0 6px;
  transition: all 0.3s;
}

.step-line.active {
  background-color: #4C36E4;
}

.stepper-labels .text-primary {
  color: #4C36E4;
  font-weight: 600;
}

.app-icons-row {
  display: flex;
  align-items: center;
  gap: 6px;
  min-height: auto;
}

.app-icon-circle-wrap {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
}

.app-icon-circle-wrap:hover {
  background: #F3F4F6;
  transform: translateY(-2px);
}

.active-app-outline {
  background: #EEF2FF;
  box-shadow: 0 4px 12px rgba(93, 95, 239, 0.1);
}

.app-icon-mini {
  width: 22px;
  height: 22px;
  object-fit: contain;
  transform: rotate(180deg) scaleX(-1);
}

.more-apps-count {
  font-size: 15px;
  font-weight: 700;
  color: #585858;
  margin-left: 2px;
  user-select: none;
}

/* ── Active App Tooltip ── */
.active-app-tooltip {
  background: #ffffff !important;
  color: #111827 !important;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1), 0 4px 10px rgba(0, 0, 0, 0.05) !important;
  border-radius: 12px !important;
  padding: 12px 16px !important;
  border: 1px solid #F3F4F6 !important;
  max-width: 280px;
}

.online-badge {
  background: #DCFCE7;
  color: #16A34A;
  font-size: 11px;
  font-weight: 700;
  padding: 2px 10px;
  border-radius: 999px;
  display: flex;
  align-items: center;
  gap: 5px;
}

.online-badge::before {
  content: '';
  width: 6px;
  height: 6px;
  background: #16A34A;
  border-radius: 50%;
  box-shadow: 0 0 8px #16A34A;
}

.offline-badge {
  background: #FEE2E2;
  color: #DC2626;
  font-size: 11px;
  font-weight: 700;
  padding: 2px 10px;
  border-radius: 999px;
  display: flex;
  align-items: center;
  gap: 5px;
}

.offline-badge::before {
  content: '';
  width: 6px;
  height: 6px;
  background: #DC2626;
  border-radius: 50%;
}

.tooltip-app-name {
  font-size: 14px;
  font-weight: 700;
  margin-bottom: 2px;
  color: #111827;
}

.tooltip-window-title {
  font-size: 12px;
  color: #9CA3AF;
  line-height: 1.4;
  word-break: break-all;
}
</style>

<!-- Global styles for portalled menus -->
<style>
.q-menu {
  border-radius: 30px !important;
  overflow: hidden;
  padding: 8px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1) !important;
  border: 1px solid #EDEDED !important;
}

.q-menu .q-item {
  border-radius: 20px;
  font-weight: 500;
  margin: 2px 0;
  padding: 10px 16px;
}

.q-menu .q-item:hover {
  background: #4C36E40D !important;
  color: #4C36E4 !important;
  font-weight: 600;
}

.edit-profile-card {
  max-width: 1000%;
  width: 100%;
  border-radius: 24px !important;
  padding: 40px;
  background: white;
  height: 670px;
}

.edit-profile-form {
  max-width: 750px;
  width: 100%;
  margin: 0 auto;
  height:50%;
}

@media (max-width: 768px),(max-height:700px){
  .edit-profile-card {
    padding: 24px;
  }
}
</style>


<!-- Global Style for Portalled Tooltips -->
<style>
.active-app-tooltip {
  background: #ffffff !important;
  color: #111827 !important;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1), 0 4px 10px rgba(0, 0, 0, 0.05) !important;
  border-radius: 12px !important;
  padding: 12px 16px !important;
  border: 1px solid #F3F4F6 !important;
  max-width: 280px;
}
/* ── Monitoring Page ── */
.monitoring-page {
  width: 100%;
}

.mon-profile-card {
  border-radius: 24px;
  overflow: hidden;
  height: 300px;
  padding: 29px;
  position: relative;
}

.mon-profile-bg {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: url("/mini frame.svg");
  background-size: cover;
  background-position: center;
  z-index: 0;
}

.mon-avatar {
  border: 3px solid #ffffff;
}

.mon-badge-role {
  display: inline-block;
  background: rgba(255, 255, 255, 0.15);
  color: #ffffff;
  font-size: 12px;
  font-weight: 500;
  padding: 6px 14px;
  border-radius: 999px;
  backdrop-filter: blur(4px);
}

.mon-badge-email {
  display: block;              
  width: fit-content;          
  max-width: 100%;             
  background: rgba(255, 255, 255, 0.2);
  color: #ffffff;
  font-size: 13px;            
  padding: 10px 18px;         
  border-radius: 999px;
  backdrop-filter: blur(6px);
  margin-top: 10px;
}

.mon-chart-card {
  border-radius: 24px;
  background: #ffffff;
  padding: 24px;
  border: 1px solid #EEF0F5;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.03);
  height: 100%;
}

.mon-badge-green {
  background: #D1FAE5;
  color: #10B981;
  font-size: 10px;
  font-weight: 600;
  padding: 4px 8px;
  border-radius: 999px;
}

.mon-donut {
  width: 140px;
  height: 70px;
  overflow: visible;
}

.mon-donut-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -20%);
  text-align: center;
}

.mon-dot {
  width: 8px;
  height: 4px;
  border-radius: 2px;
  display: inline-block;
  margin-right: 8px;
}

.mon-app-icon {
  width: 24px;
  height: 24px;
  object-fit: contain;
  margin-right: 16px;
}

.mon-bar-wrap {
  flex: 1;
  margin-right: 16px;
}

.mon-bar-bg {
  background: #F3F4F6;
  border-radius: 999px;
  height: 10px;
  width: 100%;
  overflow: hidden;
}

.mon-bar-fill {
  height: 100%;
  border-radius: 999px;
}

.mon-bar-label {
  width: 50px;
  font-size: 13px;
  font-weight: 600;
  color: #374151;
  text-align: right;
}

.bg-gradient-cyan-to-indigo {
  background: linear-gradient(90deg, #06B6D4 0%, #6366F1 100%);
}

.bg-gradient-purple-v {
  background: linear-gradient(180deg, #A78BFA 0%, #E0E7FF 100%);
}

.bg-gradient-cyan-v {
  background: linear-gradient(180deg, #6366F1 0%, #06B6D4 100%);
}

.mon-dropdown {
  background: #F9FAFB;
  border-radius: 12px;
  padding: 6px 12px;
  font-size: 12px;
  font-weight: 500;
  color: #374151;
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  border: 1px solid #EEF0F5;
}

.mon-column-chart {
  display: flex;
  height: 240px;
  padding-bottom: 20px;
}

.mon-y-axis {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding-right: 16px;
  color: #9CA3AF;
  font-size: 11px;
  padding-bottom: 24px; /* Space for X axis labels */
}

.mon-columns-container {
  flex: 1;
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  position: relative;
  height: 100%;
}

.mon-column-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
  justify-content: flex-end;
  flex: 1;
}

.mon-column-track {
  width: 12px;
  height: calc(100% - 24px); /* Space for X axis labels */
  background: #F3F4F6;
  border-radius: 999px;
  display: flex;
  align-items: flex-end;
  margin-bottom: 8px;
}

.mon-column-fill {
  width: 100%;
  border-radius: 999px;
  position: relative;
  cursor: pointer;
  transition: all 0.2s;
}

.mon-column-fill:hover {
  filter: brightness(0.9);
}

.mon-column-label {
  font-size: 11px;
  color: #9CA3AF;
}

/* Tooltip for columns */
.mon-tooltip {
  background: #ffffff !important;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1) !important;
  border-radius: 12px !important;
  padding: 12px 16px !important;
  border: 1px solid #EEF0F5 !important;
}

/* ── Verification Popups ── */
.verify-popup {
  border-radius: 24px;
  overflow: hidden;
  width: 450px;
  max-width: 90vw;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.1);
}

.verify-popup-content {
  padding: 48px;
  background: white;
}

.verify-code-input :deep(.q-field__control) {
  height: 56px;
  border-radius: 12px;
  font-size: 18px;
  letter-spacing: 2px;
  text-align: center;
}

.verify-btn {
  height: 50px;
  border-radius: 12px;
  font-weight: 600;
  font-size: 16px;
  background: #4C36E4 !important;
}

.allset-popup {
  border-radius: 24px;
  overflow: hidden;
  width: 450px;
  max-width: 90vw;
}

.allset-popup-content {
  padding: 48px;
  background: white;
}

.allset-icon-wrap {
  width: 120px;
  height: 120px;
  margin-bottom: 24px;
}

.allset-close-btn {
  width: 100%;
  height: 50px;
  border-radius: 12px;
  font-weight: 600;
  background: #4C36E4 !important;
  color: white !important;
}

/* ── Email Option Cards ── */

.mon-app-icon {
  width: 24px;
  height: 24px;
  object-fit: contain;
  margin-right: 16px;
}

.mon-bar-wrap {
  flex: 1;
  margin-right: 16px;
}

.mon-bar-bg {
  background: #F3F4F6;
  border-radius: 999px;
  height: 10px;
  width: 100%;
  overflow: hidden;
}

.mon-bar-fill {
  height: 100%;
  border-radius: 999px;
}

.mon-bar-label {
  width: 50px;
  font-size: 13px;
  font-weight: 600;
  color: #374151;
  text-align: right;
}

.bg-gradient-cyan-to-indigo {
  background: linear-gradient(90deg, #06B6D4 0%, #6366F1 100%);
}

.bg-gradient-purple-v {
  background: linear-gradient(180deg, #A78BFA 0%, #E0E7FF 100%);
}

.bg-gradient-cyan-v {
  background: linear-gradient(180deg, #6366F1 0%, #06B6D4 100%);
}

.mon-dropdown {
  background: #F9FAFB;
  border-radius: 12px;
  padding: 6px 12px;
  font-size: 12px;
  font-weight: 500;
  color: #374151;
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  border: 1px solid #EEF0F5;
}

.mon-column-chart {
  display: flex;
  height: 240px;
  padding-bottom: 20px;
}

.mon-y-axis {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding-right: 16px;
  color: #9CA3AF;
  font-size: 11px;
  padding-bottom: 24px; /* Space for X axis labels */
}

.mon-columns-container {
  flex: 1;
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  position: relative;
  height: 100%;
}

.mon-column-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
  justify-content: flex-end;
  flex: 1;
}

.mon-column-track {
  width: 12px;
  height: calc(100% - 24px); /* Space for X axis labels */
  background: #F3F4F6;
  border-radius: 999px;
  display: flex;
  align-items: flex-end;
  margin-bottom: 8px;
}

.mon-column-fill {
  width: 100%;
  border-radius: 999px;
  position: relative;
  cursor: pointer;
  transition: all 0.2s;
}

.mon-column-fill:hover {
  filter: brightness(0.9);
}

.mon-column-label {
  font-size: 11px;
  color: #9CA3AF;
}

/* Tooltip for columns */
.mon-tooltip {
  background: #ffffff !important;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1) !important;
  border-radius: 12px !important;
  padding: 12px 16px !important;
  border: 1px solid #EEF0F5 !important;
}

/* ── Verification Popups ── */
.verify-popup {
  border-radius: 24px;
  overflow: hidden;
  width: 450px;
  max-width: 90vw;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.1);
}

.verify-popup-content {
  padding: 48px;
  background: white;
}

.verify-code-input :deep(.q-field__control) {
  height: 56px;
  border-radius: 12px;
  font-size: 18px;
  letter-spacing: 2px;
  text-align: center;
}

.verify-btn {
  height: 50px;
  border-radius: 12px;
  font-weight: 600;
  font-size: 16px;
  background: #4C36E4 !important;
}

.allset-popup {
  border-radius: 24px;
  overflow: hidden;
  width: 450px;
  max-width: 90vw;
}

.allset-popup-content {
  padding: 48px;
  background: white;
}

.allset-icon-wrap {
  width: 120px;
  height: 120px;
  margin-bottom: 24px;
}

.allset-close-btn {
  width: 100%;
  height: 50px;
  border-radius: 12px;
  font-weight: 600;
  background: #4C36E4 !important;
  color: white !important;
}

/* ── Email Option Cards ── */
.email-option-card {
  background: #ffffff;
  border-radius: 30px;
  padding: 30px;
  text-align: left;
  border: 1px solid #EEF0F5;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
  transition: all 0.25s ease;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  width: 250px;
  height: 200px;
}

.email-option-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 12px 40px rgba(93, 95, 239, 0.12);
  border-color: #5D5FEF3D;
  background: linear-gradient(131.34deg, rgba(128, 220, 228, 0.5) 0.05%, rgba(171, 154, 239, 0.5) 56.01%, rgba(231, 143, 214, 0.5) 111.97%);
}

.email-option-icon-wrap {
  width: 54px;
  height: 54px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 24px;
}

.email-option-icon-img {
  width: 45px;
  height: 45px;
  object-fit: contain;
  padding-left: 0px ;
  margin-right: 18px;
  margin-top: -15px;
}

.email-option-title {
  font-size: 18px;
  font-weight: 700;
  color: #1A1A1A;
  margin-bottom: 12px;
}

.email-option-desc {
  font-size: 16px;
  color: #585858;
  line-height: 1.5;
}

.gradient-text {
  background: linear-gradient(90deg, #5D5FEF 0%, #7C3AED 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
</style>
