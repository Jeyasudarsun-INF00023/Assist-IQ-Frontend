<template>
  <q-page class="manage-assets-page q-px-lg q-pt-sm">
    <!-- ===== Delete Confirmation Popup (Single) ===== -->
    <q-dialog v-model="showDeleteConfirm">
      <q-card class="unassign-popup" style="border-radius: 50px;">
        <q-card-section class="q-pa-xl">
          <div class="text-h5 text-weight-bold q-mb-md">Delete {{ assetToDelete?.type }}?</div>
          <p class="text-grey-7" style="font-size: 15px; line-height: 1.6;">Are you sure you want to delete this asset from the record? This action cannot be undone.</p>
          
          <div class="row justify-end q-mt-xl q-gutter-x-md">
            <q-btn unelevated no-caps label="No" class="unassign-no-btn" v-close-popup />
            <q-btn unelevated no-caps label="Yes" class="unassign-yes-btn" @click="doDelete" />
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- ===== Bulk Delete Confirmation Popup ===== -->
    <q-dialog v-model="showBulkDeleteConfirm">
      <q-card class="unassign-popup" style="border-radius: 50px;">
        <q-card-section class="q-pa-xl">
          <div class="text-h5 text-weight-bold q-mb-md">Delete {{ selected.length }} Assets?</div>
          <p class="text-grey-7" style="font-size: 15px; line-height: 1.6;">Are you sure you want to delete these {{ selected.length }} assets from the record? This action cannot be undone.</p>
          
          <div class="row justify-end q-mt-xl q-gutter-x-md">
            <q-btn unelevated no-caps label="No" class="unassign-no-btn" v-close-popup />
            <q-btn unelevated no-caps label="Yes" class="unassign-yes-btn" @click="doBulkDelete" />
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- ===== Manage Assets Dialog ===== -->
    <q-dialog v-model="showManageAssets">
      <div class="q-ml-lg asset-text"></div>
      <q-card class="manage-assets-popup" style="border-radius: 40px; width: 520px; min-height: 620px;">
        <q-card-section class="q-px-xl q-pt-md q-pb-lg">
          <div class="row justify-between items-center q-mb-sm">
            <div class="text-h5 text-weight-bold">Manage Assets</div>
            <q-btn flat round dense icon="close" v-close-popup />
          </div>
          <p class="text-grey-7 q-mb-xl" style="font-size: 14px; opacity: 0.8;">Note: All data will be removed if the asset contains its own data.</p>
          
          <div class="text-weight-bold q-mb-lg" style="font-size: 16px;">Select Assets</div>
          
          <div class="q-gutter-y-sm asset-manage-scroll">
            <div
              v-for="item in assetSummary"
              :key="item.type"
              class="asset-manage-row row items-center q-px-lg q-py-sm"
            >
              <q-checkbox v-model="selectedAssetTypesToManage" :val="item.type" color="indigo-7" class="rounded-checkbox" />
              <div class="q-ml-lg">
                <div class="text-weight-bold" style="font-size: 15px; line-height: 1.3;">{{ item.type }}</div>
                <div class="text-grey-6" style="font-size: 12px; margin-top: 2px;">{{ item.count }} Devices</div>
              </div>
              <q-space />
              <TrashIcon size="22" color="#EF4444" class="cursor-pointer" @click="selectedAssetTypesToManage = [item.type]; confirmRemoveTypes()" />
            </div>
          </div>
          
          <div class="row justify-end q-mt-xl q-gutter-x-md">
            <q-btn flat no-caps label="Cancel" class="unassign-no-btn" v-close-popup />
            <q-btn
              unelevated
              no-caps
              label="Remove"
              class="unassign-yes-btn"
              style="background: #E85B58 !important; min-width: 140px;"
              :disabled="selectedAssetTypesToManage.length === 0"
              @click="confirmRemoveTypes"
            />
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- ===== Manage Remove Confirmation ===== -->
    <q-dialog v-model="showRemoveTypeConfirm">
      <q-card class="unassign-popup" style="border-radius: 50px;">
        <q-card-section class="q-pa-xl">
          <div class="text-h5 text-weight-bold q-mb-md">Remove Selected Assets?</div>
          <p class="text-grey-7" style="font-size: 15px; line-height: 1.6;">Are you sure you want to remove all units of the selected categories? This cannot be undone.</p>
          
          <div class="row justify-end q-mt-xl q-gutter-x-md">
            <q-btn unelevated no-caps label="No" class="unassign-no-btn" v-close-popup />
            <q-btn unelevated no-caps label="Yes" class="unassign-yes-btn" style="background: #F0625F !important;" @click="doRemoveAssetTypes" />
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>


    <!-- ── LIST VIEW ── -->
    <div v-if="view === 'list'" class="fade-in">


      <!-- Curved Header & Toggle -->
      <div class="header-curve-container row justify-center no-wrap">
        <div class="header-curve-left"></div>
        <div class="asset-category-bar row no-wrap items-center">
          <div
            :class="['asset-category-btn', assetCategory === 'Employee' ? 'active-category' : '']"
            @click="assetCategory = 'Employee'; currentTab = employeeAssetTypes[0]; view='list'"
          >Employee Asset</div>
          <div
            :class="['asset-category-btn', assetCategory === 'Office' ? 'active-category' : '']"
            @click="assetCategory = 'Office'; currentTab = officeAssetTypes[0]; view='list'"
          >Office Asset</div>
        </div>
        <div class="header-curve-right"></div>
      </div>

      <!-- Table & Controls Card -->
      <div class="asset-table-card">
        <!-- Controls row inside card -->
        <div class="row items-center justify-between q-mb-lg no-wrap">
          <div class="asset-tabs-container row items-center no-wrap">
            <div
              v-for="tab in allAssetTypes"
              :key="tab"
              :class="['asset-tab-pill', currentTab === tab ? 'active-tab-pill' : '']"
              @click="onAssetTabClick(tab)"
            >{{ tab }}</div>
          </div>

          <div class="row items-center q-gutter-x-sm">
            <!-- Search -->
            <q-input
              v-model="searchQuery"
              placeholder="Search"
              outlined
              rounded
              dense
              bg-color="grey-1"
              class="header-search"
            >
              <template v-slot:prepend>
                <q-icon name="search" size="20px" color="grey-6" />
              </template>
            </q-input>

            <!-- Filter icon -->
            <q-btn flat round dense class="control-btn shadow-1 bg-white">
              <q-icon name="tune" size="20px" color="grey-9" />
            </q-btn>

            <!-- Actions menu -->
            <q-btn flat round dense class="control-btn shadow-1 bg-white" icon="more_horiz" color="grey-9">
               <q-menu auto-close class="premium-menu">
                 <q-list style="min-width: 150px">
                   <q-item clickable @click="openAddView">
                     <q-item-section>Add asset</q-item-section>
                   </q-item>
                   <q-item clickable @click="openManageAssetsDialog">
                     <q-item-section>Manage Asset</q-item-section>
                   </q-item>
                 </q-list>
               </q-menu>
            </q-btn>
          </div>
        </div>

        <div class="table-scroll">
          <q-table
            :rows="filteredAssets"
            :columns="columns"
            row-key="id"
            flat
            class="asset-table"
            v-model:pagination="pagination"
            selection="multiple"
            v-model:selected="selected"
            hide-bottom
          >
          <template v-slot:header="props">
            <q-tr :props="props" class="table-header-row">
              <q-th style="width: 50px">
                <q-checkbox v-model="props.selected" color="deep-purple-10" dense />
              </q-th>
              <q-th
                v-for="col in props.cols"
                :key="col.name"
                :props="props"
                class="text-weight-bold text-black table-header-cell"
              >{{ col.label }}</q-th>
            </q-tr>
          </template>

          <template v-slot:body="props">
            <q-tr :props="props" class="table-row">
              <q-td>
                <q-checkbox v-model="props.selected" color="deep-purple-10" dense />
              </q-td>
              <q-td
                v-for="col in props.cols"
                :key="col.name"
                :props="props"
                :class="col.name === 'brand' ? 'brand-text' : (col.name === 'model' ? 'model-text' : 'secondary-cell-text')"
              >
                <template v-if="col.name === 'action'">
                  <q-btn flat round dense icon="more_horiz" color="grey-7">
                    <q-menu auto-close class="action-menu">
                      <q-list style="min-width:120px">
                        <q-item clickable @click="openDetailView(props.row)">
                          <q-item-section side><q-icon name="visibility" size="18px" /></q-item-section>
                          <q-item-section>View Detail</q-item-section>
                        </q-item>
                        <q-item clickable @click="openEditView(props.row)">
                          <q-item-section side><q-icon name="edit" size="18px" /></q-item-section>
                          <q-item-section>Edit</q-item-section>
                        </q-item>
                        <q-item clickable class="text-red" @click="confirmDelete(props.row)">
                          <q-item-section side><TrashIcon size="18" color="red" class="cursor-pointer" /></q-item-section>
                          <q-item-section>Delete</q-item-section>
                        </q-item>
                      </q-list>
                    </q-menu>
                  </q-btn>
                </template>
                <template v-else-if="col.name === 'status' && assetCategory === 'Employee'">
                  <span :class="['status-badge', props.row.assignee ? 'badge-assigned' : 'badge-available']">
                    {{ props.row.assignee ? 'Assigned' : 'Available' }}
                  </span>
                </template>
                <template v-else>
                  {{ col.value }}
                </template>
              </q-td>
            </q-tr>
          </template>
          </q-table>
        </div>

        <!-- Pagination / Selection Bar Row -->
        <div class="pagination-container row items-center justify-between q-mt-lg" style="position: relative; min-height: 60px;">
          <div class="text-grey-6 records-label">Records Per Page: 10</div>
          
          <!-- Selection Bar (Center Floating) -->
          <transition
            appear
            enter-active-class="animated zoomIn"
            leave-active-class="animated zoomOut"
          >
            <div v-if="selected.length > 0" class="selection-bar row items-center no-wrap q-gutter-x-lg" style="position: absolute; left: 50%; transform: translateX(-50%); z-index: 10;">
              <div class="row items-center">
                <TrashIcon size="20" color="white" class="q-mr-md" />
                <div class="text-white text-weight-bold" style="font-size: 14px;">
                  Selected Assets <span class="q-ml-sm">{{ selected.length }}</span>
                </div>
              </div>
              
              <q-btn
                unelevated
                no-caps
                label="Delete"
                class="bulk-delete-action-btn"
                @click="showBulkDeleteConfirm = true"
              />
              
              <q-btn
                flat
                round
                dense
                icon="close"
                color="white"
                size="sm"
                @click="selected = []"
              />
            </div>
          </transition>

          <!-- Normal Pagination -->
          <div class="row items-center q-gutter-x-sm fade-in">
            <q-btn flat round dense icon="keyboard_double_arrow_left" color="grey-3" class="page-nav-btn" @click="pagination.page = 1" />
            <q-btn flat round dense icon="chevron_left" color="grey-3" class="page-nav-btn" :disabled="pagination.page === 1" @click="pagination.page--" />
            <div class="row items-center q-gutter-x-xs">
              <q-btn v-for="p in [1, 2, 3]" :key="p" flat dense :label="String(p)"
                :class="['page-num-circle', pagination.page === p ? 'active-page' : '']"
                @click="pagination.page = p" />
              <span class="text-grey-4 q-mx-xs">...</span>
              <q-btn flat dense label="10" class="page-num-circle" @click="pagination.page = 10" />
            </div>
            <q-btn flat round dense icon="chevron_right" color="grey-3" class="page-nav-btn" @click="pagination.page++" />
            <q-btn flat round dense icon="keyboard_double_arrow_right" color="grey-3" class="page-nav-btn" />
          </div>
        </div>
      </div>
    </div>

    <!-- ── ADD ASSET VIEW (INITIAL) ── -->
    <div v-else-if="view === 'add'" class="fade-in">
      <div class="row justify-center">
        <div class="add-asset-card text-center">
          <div class="form-header q-mb-xl">
             <h2 class="device-details-title">
               <span class="text-gradient">Add Asset</span>
             </h2>
             <p class="subtitle">Select asset and provide the required details.</p>
          </div>

          <!-- Select Asset Type -->
          <div class="full-width q-mb-lg text-left">
            <div class="input-label q-mb-sm">Asset</div>
            <q-select
              v-model="selectedAssetTypeToAdd"
              :options="allAssetTypes"
              :display-value="selectedAssetTypeToAdd || 'Select Asset'"
              outlined
              rounded
              dense
              bg-color="white"
              class="form-select full-width"
              placeholder="Select Asset"
              behavior="menu"
              popup-content-class="asset-select-popup"
              @update:model-value="onAssetTypeSelected"
            >
            </q-select>
          </div>

          <!-- Or divider -->
          <div class="full-width text-center text-grey-5 q-my-lg font-weight-medium" style="font-size:14px; margin-top: 10px;">(or)</div>

          <!-- Add New Asset button -->
          <q-btn
            unelevated
            no-caps
            class="add-new-asset-btn full-width"
            @click="showAddNewDialog = true"
          >
            <q-icon name="add" size="25px" class="q-mr-sm" />
            Create New Asset
          </q-btn>
        </div>
      </div>
    </div>

    <!-- ── DEVICE DETAIL / FORM VIEW (IMAGES 2-4) ── -->
    <div v-else-if="view === 'detail'" class="fade-in">
      <div class="row justify-center">
        <div class="form-container">
          <div class="form-header text-center position-relative">
             <q-btn v-if="isViewOnly" flat round dense icon="close" class="close-btn-top" @click="view = 'list'" />
             <h2 class="device-details-title">
               <span class="text-gradient">
                 {{ isViewOnly ? 'View' : (isEditMode ? 'Edit' : 'Add') }} {{ assetCategory }} Asset
               </span>
             </h2>
             <p class="subtitle">Select asset and provide the required details.</p>
          </div>

          <div class="form-body q-mt-xl full-width">

            <!-- Asset Dropdown (showing selected type) -->
            <div class="q-mb-xl">
              <label class="input-label">Asset</label>
              <q-select
                v-model="formData.type"
                :options="detailAssetOptions"
                outlined rounded dense bg-color="white"
                placeholder="Select Asset"
                class="form-select full-width"
                behavior="menu"
                popup-content-class="asset-select-popup"
                clearable
                :disable="isViewOnly"
                @clear="view = 'add'"
                @update:model-value="onAssetTypeSelected"
              >
              </q-select>
            </div>

            <div class="section-divider">Asset Information</div>

            <!-- Standard Fields (Laptop, Mouse, Headset) -->
            <template v-if="assetCategory === 'Employee'">
              <div class="row q-col-gutter-lg q-mb-lg" v-if="['Laptop', 'Mouse', 'Headset'].includes(formData.type)">
                <div class="col-12 col-md-6">
                  <label class="input-label">Brand</label>
                  <q-input v-model="formData.brand" outlined rounded dense  class="form-input" :readonly="isViewOnly" />
                </div>
                <div class="col-12 col-md-6">
                  <label class="input-label">Model</label>
                  <q-input v-model="formData.model" outlined rounded dense  class="form-input" :readonly="isViewOnly" />
                </div>
              </div>

              <div class="row q-col-gutter-lg q-mb-lg" v-if="['Laptop', 'Mouse', 'Headset'].includes(formData.type)">
                <div class="col-12 col-md-6">
                  <label class="input-label">Serial Number</label>
                  <q-input v-model="formData.sn" outlined rounded dense  class="form-input" :readonly="isViewOnly" />
                </div>
                <div class="col-12 col-md-6">
                  <label class="input-label">Price</label>
                  <q-input v-model="formData.price" outlined rounded dense  class="form-input" prefix="₹" :readonly="isViewOnly">
                  </q-input>
                </div>
              </div>

              <!-- Fallback for custom Employee assets -->
              <div class="row q-col-gutter-lg q-mb-lg" v-if="!['Laptop', 'Mouse', 'Headset', 'Air Conditioner', 'Fan', 'Office Furniture'].includes(formData.type)">
                <div v-for="field in customSchema" :key="field" class="col-12 col-md-6 q-mb-md">
                  <label class="input-label">{{ field }}</label>
                  <q-input v-model="formData.customFields[field]" outlined rounded dense class="form-input" :readonly="isViewOnly" />
                </div>
              </div>
            </template>

            <!-- Office Asset Forms -->
            <template v-else-if="assetCategory === 'Office'">
              <!-- Air Conditioner Form -->
              <template v-if="formData.type === 'Air Conditioner'">
                <div class="row q-col-gutter-lg q-mb-lg">
                  <div class="col-12 col-md-6">
                    <label class="input-label">Brand</label>
                    <q-input v-model="formData.brand" outlined rounded dense placeholder="Daikin" class="form-input" />
                  </div>
                  <div class="col-12 col-md-6">
                    <label class="input-label">Model</label>
                    <q-input v-model="formData.model" outlined rounded dense placeholder="FTKF50TV" class="form-input" />
                  </div>
                </div>
                <div class="row q-col-gutter-lg q-mb-lg">
                  <div class="col-12 col-md-6">
                    <label class="input-label">Capacity</label>
                    <q-input v-model="formData.customFields.capacity" outlined rounded dense placeholder="1.5 Ton" class="form-input" :readonly="isViewOnly" />
                  </div>
                  <div class="col-12 col-md-6">
                    <label class="input-label">Location</label>
                    <q-input v-model="formData.customFields.location" outlined rounded dense placeholder="Meeting Room" class="form-input" :readonly="isViewOnly" />
                  </div>
                </div>
                <div class="row q-col-gutter-lg q-mb-lg">
                  <div class="col-12 col-md-6">
                    <label class="input-label">Purchase Cost</label>
                    <q-input v-model="formData.price" outlined rounded dense placeholder="50,000" class="form-input" prefix="₹" :readonly="isViewOnly" />
                  </div>
                </div>
              </template>

              <!-- Fan Form -->
              <template v-else-if="formData.type === 'Fan'">
                <div class="row q-col-gutter-lg q-mb-lg">
                  <div class="col-12 col-md-6">
                    <label class="input-label">Brand</label>
                    <q-input v-model="formData.brand" outlined rounded dense placeholder="Crompton" class="form-input" :readonly="isViewOnly" />
                  </div>
                  <div class="col-12 col-md-6">
                    <label class="input-label">Quantity</label>
                    <q-input v-model="formData.customFields.quantity" type="number" outlined rounded dense placeholder="10" class="form-input" :readonly="isViewOnly" />
                  </div>
                </div>
                <div class="row q-col-gutter-lg q-mb-lg">
                  <div class="col-12 col-md-6">
                    <label class="input-label">Purchase Cost</label>
                    <q-input v-model="formData.price" outlined rounded dense placeholder="2,000" class="form-input" prefix="₹" :readonly="isViewOnly" />
                  </div>
                </div>
              </template>

              <!-- Office Furniture Form -->
              <template v-else-if="formData.type === 'Office Furniture'">
                <div class="row q-col-gutter-lg q-mb-lg">
                  <div class="col-12 col-md-6">
                    <label class="input-label">Select Furniture</label>
                    <q-select v-model="formData.customFields.furniture_type" :options="['Desk', 'Chair']" outlined rounded dense class="form-select" :disable="isViewOnly" />
                  </div>
                  <div class="col-12 col-md-6">
                    <label class="input-label">Brand</label>
                    <q-input v-model="formData.brand" outlined rounded dense placeholder="Featherlite" class="form-input" :readonly="isViewOnly" />
                  </div>
                </div>
                <div class="row q-col-gutter-lg q-mb-lg">
                  <div class="col-12 col-md-6">
                    <label class="input-label">Quantity</label>
                    <q-input v-model="formData.customFields.quantity" type="number" outlined rounded dense placeholder="10" class="form-input" :readonly="isViewOnly" />
                  </div>
                  <div class="col-12 col-md-6">
                    <label class="input-label">Per Item Cost</label>
                    <q-input v-model="formData.price" outlined rounded dense placeholder="4,000" class="form-input" prefix="₹" :readonly="isViewOnly" />
                  </div>
                </div>
              </template>

              <!-- Dynamic Fields Fallback (for any other Office asset like Phone, etc.) -->
              <template v-else>
                <div class="row q-col-gutter-lg q-mb-lg">
                  <div v-for="field in customSchema" :key="field" class="col-12 col-md-6 q-mb-md">
                    <label class="input-label">{{ field }}</label>
                    <q-select
                      v-if="field.toLowerCase().startsWith('select')"
                      v-model="formData.customFields[field]"
                      :options="['Desk', 'Chair', 'Table']"
                      outlined rounded dense class="form-select"
                      :disable="isViewOnly"
                    />
                    <q-input 
                      v-else
                      v-model="formData.customFields[field]" 
                      outlined rounded dense 
                      class="form-input" 
                      :readonly="isViewOnly"
                    />
                  </div>
                </div>
              </template>
            </template>

            <!-- Hardware Details (Laptop only) -->
            <template v-if="formData.type === 'Laptop'">
              <div class="section-divider q-mt-xl">Hardware Details</div>
              <div class="row q-col-gutter-lg q-mb-lg">
                <div class="col-6">
                  <label class="input-label">Processor</label>
                  <q-input v-model="formData.processor" outlined rounded dense  class="form-input" />
                </div>
                <div class="col-6">
                  <label class="input-label">RAM</label>
                  <q-input v-model="formData.ram" outlined rounded dense  class="form-input" />
                </div>
              </div>
              <div class="row q-col-gutter-lg q-mb-xl">
                <div class="col-6">
                  <label class="input-label">Storage Capacity</label>
                  <q-input v-model="formData.storage" outlined rounded dense  class="form-input" />
                </div>
                <div class="col-6">
                  <label class="input-label">Operating System</label>
                  <q-select
                    v-model="formData.os"
                    :options="['Windows 11', 'Windows 10', 'macOS', 'Linux']"
                    placeholder="Select Operating System"
                    outlined rounded dense
                    class="form-select"
                    behavior="menu"
                    popup-content-class="asset-select-popup"
                  >
                  </q-select>
                </div>
              </div>
            </template>

            <!-- Additional Notes -->
            <div class="q-mt-xl">
              <div class="section-divider">Additional Notes</div>
              <div class="q-mb-md">
                <label class="input-label">Remarks <span class="text-grey-5 font-weight-normal">(optional)</span></label>
                <q-input
                  v-model="formData.remarks"
                  type="textarea"
                  outlined rounded dense
                  placeholder="Enter details of any issues or physical damage (if any)"
                  class="form-textarea full-width"
                  rows="4"
                />
              </div>
            </div>

            <!-- Actions -->
            <div class="row justify-end q-gutter-x-md q-mt-xl">
              <template v-if="!isViewOnly">
                <q-btn flat label="Cancel" class="btn-cancel" @click="view = 'list'" />
                <q-btn unelevated :label="isEditMode ? 'Update' : 'Add'" class="btn-add" @click="saveDevice" />
              </template>
              <template v-else>
                <q-btn unelevated label="Back" class="btn-add" @click="view = 'list'" style="min-width: 140px;" />
              </template>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ── ADD NEW ASSET DIALOG (IMAGE 5) ── -->
    <q-dialog v-model="showAddNewDialog" persistent>
      <q-card class="add-new-dialog column no-wrap" style="max-height: 90vh;">
        <!-- Header Section (Fixed) -->
        <div class="q-px-xl q-pt-xl q-pb-md">
          <div class="row items-center justify-between q-mb-md">
            <div class="text-h6 text-weight-bold text-black" style="font-size:22px">Create New Asset</div>
            <q-btn flat round dense icon="close" color="black" @click="closeAddNewDialog" />
          </div>
          <p class="text-grey-6 no-margin" style="font-size:14px; line-height:1.6">
            Enter the asset name and basic details such as brand, model number, and price.
            For better tracking, add additional details under Asset Details, including a unique identifier (e.g., serial number).
          </p>
        </div>

        <!-- Scrollable Content Section -->
        <q-card-section class="col scroll q-px-xl q-py-md">
          <!-- Asset Section -->
          <div class="text-subtitle1 text-weight-bold text-black q-mb-md">Asset</div>
          <div class="q-mb-md">
            <label class="input-label text-grey-6">Asset Name</label>
            <div class="row items-center no-wrap q-gutter-x-md">
              <q-input
                v-model="newAsset.assetName"
                outlined rounded dense
                placeholder="e.g., Phone"
                class="form-input col"
              />
              <div style="width: 40px;"></div> <!-- Spacer to match the remove button width for alignment -->
            </div>
          </div>

          <!-- Asset Details Section -->
          <div class="text-subtitle1 text-weight-bold text-black q-mb-md">Asset Details</div>
          <div class="column q-gutter-y-md q-mb-md">
            <div v-for="(field, idx) in newAsset.fields" :key="idx" class="row items-center no-wrap q-gutter-x-md">
              <q-input
                v-model="newAsset.fields[idx]"
                outlined rounded dense
                class="form-input col"
              />
              <q-btn flat dense icon="remove" class="remove-field-btn" @click="removeExtraField(idx)" />
            </div>
          </div>

          <!-- Add other details -->
          <div class="row items-center cursor-pointer text-weight-bold q-mb-md" style="font-size:14px; color:#4B49E7" @click="addExtraField">
            <q-icon name="add" size="18px" class="q-mr-xs" />
            Add other details
          </div>
        </q-card-section>

        <!-- Footer Section (Fixed Actions) -->
        <div class="q-px-xl q-pb-xl q-pt-md">
          <div class="row justify-center q-gutter-x-md">
            <q-btn flat no-caps label="Cancel" class="btn-cancel" @click="closeAddNewDialog" />
            <q-btn unelevated no-caps label="Create" class="btn-add" @click="submitNewAsset" :loading="isSavingNew" />
          </div>
        </div>
      </q-card>
    </q-dialog>

  </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'
import { Search as SearchIcon, Trash2 as TrashIcon } from 'lucide-vue-next'
import { assetView as view } from '../store/assetStore'

const API_URL = process.env.BACKEND_URL || 'http://127.0.0.1:8000'
const api = axios.create({ baseURL: API_URL })

// ── State ──
const currentTab = ref('Laptop')
const assetCategory = ref('Employee')
const searchQuery = ref('')
const pagination = ref({ page: 1, rowsPerPage: 10 })
const assets = ref([])
const selected = ref([])
const isEditMode = ref(false)
const selectedAssetId = ref(null)
const isSavingNew = ref(false)
const isViewOnly = ref(false)

const showDeleteConfirm = ref(false)
const assetToDelete = ref(null)

const showBulkDeleteConfirm = ref(false)

const showManageAssets = ref(false)
const selectedAssetTypesToManage = ref([])
const showRemoveTypeConfirm = ref(false)

// Missing state for Add functionality
const showAddNewDialog = ref(false)
const selectedAssetTypeToAdd = ref(null)

const assetSummary = computed(() => {
  // Use all possible types for the current category
  const currentTypes = allAssetTypes.value
  const counts = {}
  assets.value.forEach(a => {
    // Both type and category should match. 
    // Handle cases where a.category is missing by inferring from type
    const isOfficeType = officeAssetTypes.includes(a.type)
    const assetCat = a.category || (isOfficeType ? 'Office' : 'Employee')

    if (assetCat === assetCategory.value) {
      counts[a.type] = (counts[a.type] || 0) + 1
    }
  })
  // Return a summary for each type in the current category
  return currentTypes.map(t => ({ type: t, count: counts[t] || 0 }))
})

const openManageAssetsDialog = () => {
  selectedAssetTypesToManage.value = []
  showManageAssets.value = true
}

const confirmRemoveTypes = () => {
  showRemoveTypeConfirm.value = true
}

const doRemoveAssetTypes = async () => {
  const selectedTypes = selectedAssetTypesToManage.value || []
  if (!selectedTypes.length) {
    showRemoveTypeConfirm.value = false
    showManageAssets.value = false
    return
  }

  // Find all asset IDs that belong to the selected types, with safe category fallback
  const idsToDelete = assets.value
    .filter(a => {
      const assetCat = a.category || (officeAssetTypes.includes(a.type) ? 'Office' : 'Employee')
      return assetCat === assetCategory.value && selectedTypes.includes(a.type)
    })
    .map(a => a.id)

  try {
    if (idsToDelete.length > 0) {
      await api.post('/assets/bulk-delete', { ids: idsToDelete })
    } else {
      console.warn('No matching assets found to delete for types:', selectedTypes)
    }

    showRemoveTypeConfirm.value = false
    showManageAssets.value = false
    selectedAssetTypesToManage.value = []
    await fetchAssets()
  } catch (err) {
    console.error('Remove types error:', err)
  }
}

const confirmDelete = (row) => {
  assetToDelete.value = row
  showDeleteConfirm.value = true
}

const doDelete = async () => {
  if (!assetToDelete.value) return
  try {
    await api.delete(`/assets/${assetToDelete.value.id}`)
    showDeleteConfirm.value = false
    assetToDelete.value = null
    fetchAssets()
  } catch (err) {
    console.error('Error deleting asset:', err)
  }
}

const doBulkDelete = async () => {
  const ids = selected.value.map(row => row.id)
  try {
    await api.post('/assets/bulk-delete', { ids })
    selected.value = []
    showBulkDeleteConfirm.value = false
    fetchAssets()
  } catch (err) {
    console.error('Bulk delete error:', err)
  }
}

const localCustomTypes = ref({
  Employee: [],
  Office: []
})
const localCustomSchemas = ref({
  Employee: {},
  Office: {}
})

const customSchema = ref([])

const formData = ref({
  type: 'Laptop',
  brand: '',
  model: '',
  sn: '',
  processor: '',
  ram: '',
  storage: '',
  os: 'Windows 11',
  remarks: '',
  assignee: '',
  assigned_date: '',
  price: '',
  customFields: {}
})

const newAsset = ref({
  assetName: '',
  fields: ['Brand', 'Model Number/Name', 'Price']
})

// ── Column / Tab Computations ──
const columns = computed(() => {
  const formatPrice = (val) => val ? `₹ ${Number(val).toLocaleString('en-IN')}` : '-'

  const base = [
    { name: 'brand', label: 'Brand', align: 'left', field: 'brand' },
    { name: 'model', label: 'Model', align: 'left', field: 'model' },
    { name: 'sn', label: 'S/N', align: 'left', field: 'sn', format: val => val || '-' },
    { name: 'price', label: 'Price', align: 'left', field: 'price', format: formatPrice },
    { name: 'status', label: 'Device Status', align: 'left', field: 'assignee' },
    { name: 'assignee', label: 'Assignee', align: 'left', field: 'assignee', format: val => val || '-' },
    { name: 'action', label: 'Action', align: 'center', field: 'action' }
  ]

  if (assetCategory.value === 'Office') {
    if (currentTab.value === 'Fan') {
      return [
        { name: 'brand', label: 'Brand', align: 'left', field: 'brand' },
        { name: 'quantity', label: 'Quantity', align: 'left', field: row => row.custom_fields?.quantity || '-' },
        { name: 'price', label: 'Per Fan Cost', align: 'left', field: 'price', format: formatPrice },
        { name: 'total_cost', label: 'Total Cost', align: 'left', field: row => `₹ ${Number((row.price || 0) * (row.custom_fields?.quantity || 0)).toLocaleString('en-IN')}` },
        { name: 'action', label: 'Action', align: 'center', field: 'action' }
      ]
    } else if (currentTab.value === 'Office Furniture') {
      return [
        { name: 'furniture', label: 'Furniture', align: 'left', field: row => row.custom_fields?.furniture_type || '-' },
        { name: 'brand', label: 'Brand', align: 'left', field: 'brand' },
        { name: 'quantity', label: 'Quantity', align: 'left', field: row => row.custom_fields?.quantity || '-' },
        { name: 'price', label: 'Per Item Cost', align: 'left', field: 'price', format: formatPrice },
        { name: 'total_cost', label: 'Total Cost', align: 'left', field: row => `₹ ${Number((row.price || 0) * (row.custom_fields?.quantity || 0)).toLocaleString('en-IN')}` },
        { name: 'action', label: 'Action', align: 'center', field: 'action' }
      ]
    }

    // Dynamic Columns for Custom Types
    const categoryName = assetCategory.value
    const customFieldsForType = localCustomSchemas.value[categoryName][currentTab.value]
    
    if (customFieldsForType && customFieldsForType.length > 0 && !['Air Conditioner'].includes(currentTab.value)) {
       const customCols = []
       customFieldsForType.forEach(f => {
         const fieldKey = f.toLowerCase().trim()
         customCols.push({
           name: fieldKey.replace(/\s+/g, '_'),
           label: f,
           align: 'left',
           field: row => {
             // Check custom_fields first (case insensitive match for the label)
             if (row.custom_fields) {
               // Exact match
               if (row.custom_fields[f] !== undefined) return row.custom_fields[f]
               // Case-insensitive match if user entered differently
               const keyMatch = Object.keys(row.custom_fields).find(k => k.toLowerCase() === fieldKey)
               if (keyMatch) return row.custom_fields[keyMatch]
             }
             
             // Fallback to top-level fields if it sounds like a core field
             if (fieldKey.includes('brand')) return row.brand || '-'
             if (fieldKey.includes('model')) return row.model || '-'
             if (fieldKey.includes('price') || fieldKey.includes('cost')) return row.price ? `₹ ${Number(row.price).toLocaleString('en-IN')}` : '-'
             if (fieldKey.includes('sn') || fieldKey.includes('serial')) return row.sn || '-'
             return '-'
           }
         })
       })
       // Add total cost if quantity and price exist
       if (customFieldsForType.some(f => f.toLowerCase().includes('quantity')) && customFieldsForType.some(f => f.toLowerCase().includes('price') || f.toLowerCase().includes('cost'))) {
         customCols.push({
           name: 'total_cost',
           label: 'Total Cost',
           align: 'left',
           field: row => {
             const qty = row.custom_fields?.quantity || row.custom_fields?.Quantity || 0
             const price = parseFloat(String(row.price || 0).replace(/,/g, ''))
             return `₹ ${Number(qty * price).toLocaleString('en-IN')}`
           }
         })
       }
       customCols.push({ name: 'action', label: 'Action', align: 'center', field: 'action' })
       return customCols
    }

    // Fallback logic for office assets
    if (currentTab.value === 'Air Conditioner') {
      return [
        { name: 'brand', label: 'Brand', align: 'left', field: 'brand' },
        { name: 'model', label: 'Model', align: 'left', field: 'model' },
        { name: 'capacity', label: 'Capacity', align: 'left', field: row => row.custom_fields?.capacity || '-' },
        { name: 'location', label: 'Location', align: 'left', field: row => row.custom_fields?.location || '-' },
        { name: 'price', label: 'Price', align: 'left', field: 'price', format: formatPrice },
        { name: 'action', label: 'Action', align: 'center', field: 'action' }
      ]
    }

    // Default for any other type (uncovered custom or unexpected)
    return [
      { name: 'brand', label: 'Brand', align: 'left', field: 'brand' },
      { name: 'model', label: 'Model', align: 'left', field: 'model' },
      { name: 'sn', label: 'S/N', align: 'left', field: row => row.sn || '-' },
      { name: 'price', label: 'Price', align: 'left', field: 'price', format: formatPrice },
      { name: 'action', label: 'Action', align: 'center', field: 'action' }
    ]
  }

  return base
})

const employeeAssetTypes = ['Laptop', 'Mouse', 'Headset']
const officeAssetTypes = ['Air Conditioner', 'Office Furniture', 'Fan']

const allAssetTypes = computed(() => {
  const base = assetCategory.value === 'Office' ? officeAssetTypes : employeeAssetTypes
  const types = new Set([...base])

  // include custom asset types created for the current category
  const customTypes = localCustomTypes.value[assetCategory.value] || []
  customTypes.forEach(type => types.add(type))

  // also include any backend asset types that are not base types (persisted custom types)
  assets.value.forEach(a => {
    const assetCat = a.category || (officeAssetTypes.includes(a.type) ? 'Office' : 'Employee')
    if (assetCat !== assetCategory.value) return
    if (a.type) {
      types.add(a.type)
    }
  })

  return Array.from(types)
})

const detailAssetOptions = computed(() => {
  const base = assetCategory.value === 'Office' ? officeAssetTypes : employeeAssetTypes
  const custom = localCustomTypes.value[assetCategory.value] || []
  const options = new Set([...base, ...custom])

  if (formData.value.type) options.add(formData.value.type)

  return Array.from(options)
})

// ── Filtered list ──
const filteredAssets = computed(() => {
  return assets.value.filter(a => {
    // Both type and category should match. 
    // Handle cases where a.category is missing by inferring from type
    const categoryToMatch = assetCategory.value
    const isOfficeType = officeAssetTypes.includes(a.type)
    const assetCat = a.category || (isOfficeType ? 'Office' : 'Employee')

    const matchesCategory = assetCat === categoryToMatch
    const matchesTab = a.type === currentTab.value
    const q = searchQuery.value.toLowerCase()
    const matchesSearch =
      (a.brand || '').toLowerCase().includes(q) ||
      (a.model || '').toLowerCase().includes(q) ||
      (a.sn && a.sn.toLowerCase().includes(q))
    return matchesCategory && matchesTab && matchesSearch
  })
})

// ── Fetch ──
async function fetchAssets() {
  try {
    const res = await api.get('/assets')
    assets.value = res.data

    // Rebuild local custom type cache from backend results, so refresh keeps custom tabs.
    const foundCustom = { Employee: new Set(), Office: new Set() }
    res.data.forEach(a => {
      const assetCat = a.category || (officeAssetTypes.includes(a.type) ? 'Office' : 'Employee')
      const baseTypes = assetCat === 'Office' ? officeAssetTypes : employeeAssetTypes
      if (a.type && !baseTypes.includes(a.type)) {
        foundCustom[assetCat].add(a.type)
      }
    })

    localCustomTypes.value.Employee = Array.from(foundCustom.Employee)
    localCustomTypes.value.Office = Array.from(foundCustom.Office)

    // Rebuild localCustomSchemas by peeking at items, but MERGE with existing ones
    // to avoid clearing schemas of types that aren't yet in the database.
    res.data.forEach(a => {
       const assetCat = a.category || (officeAssetTypes.includes(a.type) ? 'Office' : 'Employee')
       const baseTypes = assetCat === 'Office' ? officeAssetTypes : employeeAssetTypes
       if (a.type && !baseTypes.includes(a.type)) {
         if (!localCustomSchemas.value[assetCat][a.type] || localCustomSchemas.value[assetCat][a.type].length === 0) {
           const fields = []
           // Add core fields to schema if they exist, so they become columns
           if (a.brand) fields.push('Brand')
           if (a.model) fields.push('Model Number/Name')
           if (a.sn) fields.push('Serial Number')
           if (a.price) fields.push('Price')

           if (a.custom_fields) {
             fields.push(...Object.keys(a.custom_fields))
           }
           localCustomSchemas.value[assetCat][a.type] = Array.from(new Set(fields))
         }
       }
    })

    // ensure current tab remains valid after refresh
    const allTypes = allAssetTypes.value
    if (!allTypes.includes(currentTab.value)) {
      currentTab.value = allTypes[0] || (assetCategory.value === 'Office' ? officeAssetTypes[0] : employeeAssetTypes[0])
    }
  } catch (err) {
    console.error('Error fetching assets:', err)
  }
}

const goBack = () => {
  view.value = 'list'
}

onMounted(() => {
  fetchAssets()
  // Manage Asset landing should show table view by default.
  view.value = 'list'
})

// ── Navigation ──
function openAddView() {
  selectedAssetTypeToAdd.value = null
  isViewOnly.value = false
  view.value = 'add'
}

function onAssetTypeSelected(type) {
  if (!type) return
  currentTab.value = type
  selectedAssetTypeToAdd.value = null
  isEditMode.value = false
  isViewOnly.value = false
  // When asset type is chosen from Add screen, show detail form with preloaded type.
  view.value = 'detail'
  formData.value = {
    type,
    brand: '',
    model: '',
    sn: '',
    processor: '',
    ram: '',
    storage: '',
    os: type === 'Laptop' ? 'Windows 11' : '',
    remarks: '',
    assignee: '',
    assigned_date: '',
    price: '',
    customFields: {}
  }
  // Setup custom schema for the form
  customSchema.value = localCustomSchemas.value[assetCategory.value][type] || []
}

function onAssetTabClick(type) {
  currentTab.value = type
  // Show table for selected asset tab on top (not detail edit form)
  view.value = 'list'
  isEditMode.value = false
}

function prepareCustomFormData(row) {
  let cFields = {}
  let schema = []

  if (row.brand) { cFields['brand'] = row.brand; schema.push('brand') }
  if (row.price) { cFields['price'] = row.price; schema.push('price') }
  if (row.sn) { cFields['s:no'] = row.sn; schema.push('s:no') }
  if (row.model) { cFields['model'] = row.model; schema.push('model') }

  if (row.remarks) {
    try {
      const parsed = JSON.parse(row.remarks)
      for (const [k, v] of Object.entries(parsed)) {
        cFields[k] = v
        schema.push(k)
      }
      formData.value.remarks = ''
    } catch (e) {
      formData.value.remarks = row.remarks
    }
  }

  // Union existing schema with row fields to be comprehensive
  const baseSchema = localCustomSchemas.value[assetCategory.value][row.type] || []
  customSchema.value = Array.from(new Set([...baseSchema, ...schema]))
  formData.value.customFields = cFields
}

function openDetailView(row) {
  isEditMode.value = true
  isViewOnly.value = true
  selectedAssetId.value = row.id
  formData.value = {
    type: row.type,
    brand: row.brand || '',
    model: row.model || '',
    sn: row.sn || '',
    processor: row.processor || '',
    ram: row.ram || '',
    storage: row.storage || '',
    os: row.os || 'Windows 11',
    remarks: row.remarks || '',
    assignee: row.assignee || '',
    assigned_date: row.assigned_date || '',
    price: row.price || '',
    customFields: {}
  }
  
  if (!['Laptop', 'Mouse', 'Headset'].includes(row.type)) {
     prepareCustomFormData(row)
  }
  
  view.value = 'detail'
}

function openEditView(row) {
  openDetailView(row)
  isViewOnly.value = false
}

// ── Save Device ──
async function saveDevice() {
  try {
    let payload = {
      type: formData.value.type,
      category: assetCategory.value,
      brand: formData.value.brand || null,
      model: formData.value.model || null,
      sn: formData.value.sn?.trim() || null,
      processor: formData.value.processor,
      ram: formData.value.ram,
      storage: formData.value.storage,
      os: formData.value.os,
      remarks: formData.value.remarks,
      assignee: formData.value.assignee,
      assigned_date: formData.value.assigned_date,
      price: formData.value.price || null,
      custom_fields: null
    }

    // If custom asset type, map any recognized control keys to core props + preserve custom fields in DB
    let customData = {}
    for (const [key, val] of Object.entries(formData.value.customFields || {})) {
      const k = key.toLowerCase().trim()
      if (!val) continue

      if (k === 'brand') payload.brand = val
      else if (k === 'model' || k === 'model number/name') payload.model = val
      else if (k === 'price' || k.includes('cost')) payload.price = val
      else if (k === 's:no' || k === 'sn' || k === 'serial number') payload.sn = val
      else customData[key] = val
    }
    payload.custom_fields = Object.keys(customData).length > 0 ? customData : null

    // if custom fields exist, keep remarks as additional notes or as serialized backup
    if (!payload.remarks && payload.custom_fields && !['Laptop', 'Mouse', 'Headset'].includes(payload.type)) {
      payload.remarks = JSON.stringify(payload.custom_fields)
    }

    if (!payload.brand) payload.brand = 'Generic'
    if (!payload.model && ['Laptop', 'Mouse', 'Headset'].includes(payload.type)) payload.model = 'Device'

    if (isEditMode.value) {
      await api.put(`/assets/${selectedAssetId.value}`, payload)
    } else {
      await api.post('/assets', payload)
    }
    // Keep current tab in place (and category) for the saved asset type
    currentTab.value = payload.type
    view.value = 'list'
    fetchAssets()
  } catch (err) {
    console.error('Error saving device:', err)
  }
}

// ── Add New Asset Dialog ──
function closeAddNewDialog() {
  showAddNewDialog.value = false
  newAsset.value = { assetName: '', fields: ['Brand', 'Model Number/Name', 'Price'] }
}

function addExtraField() {
  newAsset.value.fields.push('')
}

function removeExtraField(idx) {
  newAsset.value.fields.splice(idx, 1)
}

function submitNewAsset() {
  if (!newAsset.value.assetName) return

  const schemaArr = newAsset.value.fields.filter(f => f.trim() !== '')
  
  const category = assetCategory.value || 'Employee'
  if (!localCustomTypes.value[category].includes(newAsset.value.assetName)) {
    localCustomTypes.value[category].push(newAsset.value.assetName)
  }
  localCustomSchemas.value[category][newAsset.value.assetName] = schemaArr

  customSchema.value = schemaArr

  // Go to detail view with custom schema fields, like new UI for custom asset type
  formData.value = {
    type: newAsset.value.assetName,
    brand: '',
    model: '',
    sn: '',
    processor: '',
    ram: '',
    storage: '',
    os: '',
    remarks: '',
    assignee: '',
    assigned_date: '',
    price: '',
    customFields: {},
    category
  }

  closeAddNewDialog()
  currentTab.value = newAsset.value.assetName
  view.value = 'detail'
}


// ── Delete ──
// Handled by doDelete via confirmDelete
</script>

<style scoped>
.text-gradient {
  background: linear-gradient(90deg, #00BCC9 0%, rgba(76, 54, 228, 0.99) 50%, #CF20AE 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-weight: 600;
}

.add-new-asset-btn {
  height: 52px;
  border-radius: 999px;
  background: #4B49E7;
  color: white;
  font-size: 15px;
  font-weight: 600;
  margin-top: -10px;
}
.manage-assets-page {
  font-family: 'Manrope', sans-serif;
  background-image: url('/Assist IQ (9).svg');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  background-attachment: fixed;
  min-height: 100vh;
}

/* --- Curved Header --- */
.header-curve-container {
  margin-top: 20px;
  position: relative;
  z-index: 10;
  display: flex;
  align-items: flex-end;
}

.header-curve-left, .header-curve-right {
  flex: 1;
  background: white;
  height: 60px;
  border-top-left-radius: 30px;
  border-top-right-radius: 30px;
  position: relative;
}

.header-curve-left::after {
  content: "";
  position: absolute;
  right: -30px;
  bottom: 0;
  width: 30px;
  height: 30px;
  background: transparent;
  border-bottom-left-radius: 30px;
  box-shadow: -15px 0 0 0 white;
}

.header-curve-right::before {
  content: "";
  position: absolute;
  left: -30px;
  bottom: 0;
  width: 30px;
  height: 30px;
  background: transparent;
  border-bottom-right-radius: 30px;
  box-shadow: 15px 0 0 0 white;
}

/* --- Category Switcher (Employee / Office) --- */
.asset-category-bar {
  background: #F1F5F9;
  padding: 4px;
  border-radius: 40px;
  height: 46px;
  z-index: 20;
  margin: 0 10px;
}
.asset-category-btn {
  padding: 8px 24px;
  border-radius: 40px;
  cursor: pointer;
  font-weight: 600;
  color: #64748B;
  transition: all 0.3s;
  font-size: 14px;
}
.active-category {
  background: #4B49E7;
  color: white;
  box-shadow: 0 4px 10px rgba(75, 73, 231, 0.2);
}

/* --- Sub-Tabs (Laptop / Mouse / Headset) --- */
.asset-tabs-container {
  background: #F1F5F9;
  padding: 4px;
  border-radius: 20px;
  width: fit-content;
}

.unassign-no-btn {
  background: #F1F1F1 !important;
  color: #111827 !important;
  border-radius: 999px;
  min-width: 110px;
  height: 44px;
  font-weight: 600;
  font-size: 15px;
}

.unassign-yes-btn {
  background: #5D5FEF !important;
  color: #ffffff !important;
  border-radius: 999px;
  min-width: 110px;
  height: 44px;
  font-weight: 600;
  font-size: 15px;
}

/* ── Selection Bar Styles ── */
.selection-bar {
  background: #EA6060;
  padding: 10px 24px;
  border-radius: 999px;
  box-shadow: 0 4px 15px rgba(239, 99, 97, 0.2);
}

.bulk-delete-action-btn {
  background: white;
  color: #EF6361;
  border-radius: 999px;
  padding: 0 24px;
  height: 32px;
  font-weight: 700;
  font-size: 13px;
}

/* dedicated scrolling section for long list content */
.asset-manage-scroll {
  max-height: 320px;  
  overflow-y: auto;
  padding-right: 6px;
}
.asset-manage-scroll::-webkit-scrollbar {
  width: 8px;
}

.asset-manage-scroll::-webkit-scrollbar-thumb {
  background-color: rgba(100, 116, 139, 0.38);
  border-radius: 999px;
}

.asset-manage-scroll::-webkit-scrollbar-track {
  background-color: rgba(227, 242, 253, 0.65);
}

.asset-manage-row {
  background: #FFFFFF;              /* clean white like design */
  border-radius: 30px;
  padding: 10px 18px;
  margin-bottom: 14px;
  min-height: 62px;

  display: flex;
  align-items: center;

  box-shadow: 0 2px 6px rgba(0,0,0,0.04); /* soft elevation */
  border: 1px solid #F1F2F4;
}
.rounded-checkbox {
  margin-left: 4px;
}
.rounded-checkbox :deep(.q-checkbox__bg) {
  border-radius: 5px !important;
}
.asset-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.asset-text .title {
  font-size: 15px;
  font-weight: 600;
}

.asset-text .sub {
  font-size: 12px;
  color: #9ca3af;
}
.asset-tab-pill {
  padding: 6px 18px;
  border-radius: 16px;
  cursor: pointer;
  font-weight: 500;
  color: #94A3B8;
  font-size: 14px;
  transition: all 0.2s;
}
.active-tab-pill {
  background: #FFFFFF;
  color: #1E293B;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}

/* --- Controls Row --- */
.header-search { width: 280px; }
.header-search :deep(.q-field__control) {
  border-radius: 30px !important;
  border: none !important;
  background: #F4F7FB !important;
  height: 48px;
}
.header-search :deep(.q-field__marginal) {
  height: 48px;
}
.header-search :deep(.q-field__control:before),
.header-search :deep(.q-field__control:after) {
  display: none !important;
}
.control-btn {
  width: 44px;
  height: 44px;
  border-radius: 30px !important;
}

/* --- Action Menus --- */
.premium-menu,
.action-menu {
  border-radius: 30px !important;
  overflow: hidden;
}

.premium-menu {
  box-shadow: 0 10px 30px rgba(0,0,0,0.1);
  margin-top: 8px;
  border: 1px solid #F1F5F9;
}

.premium-menu :deep(.q-list),
.action-menu :deep(.q-list),
:deep(.asset-select-popup),
:deep(.asset-select-popup .q-list) {
  border-radius: 30px !important;
}

/* --- Main Table Card --- */
.asset-table-card {
  background: white;
  border-radius: 0 0 40px 40px;
  padding: 40px 32px 20px;
  box-shadow: 0 4px 25px rgba(0,0,0,0.04);
  z-index: 5;
  margin-top: -1px;
  min-height: calc(100vh - 220px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.table-scroll {
  flex: 1;
  min-height: 400px;
  overflow-y: auto;
}

.table-scroll .q-table__middle {
  min-width: 900px; /* keep columns aligned, adjust as needed */
}

.table-scroll::-webkit-scrollbar {
  width: 10px;
}

.table-scroll::-webkit-scrollbar-thumb {
  background-color: rgba(0, 0, 0, 0.15);
  border-radius: 999px;
}

.table-scroll::-webkit-scrollbar-track {
  background: rgba(240, 248, 255, 0.5);
}

.table-header-cell {
  border-bottom: 2px solid #F8FAFC !important;
  padding: 24px 12px;
  color: #1E293B;
  font-size: 14px;
  font-weight: 700;
}

.table-row :deep(td) {
  border-bottom: 1px solid #F8FAFC !important;
  padding: 16px 12px;
  font-size: 14px;
  color: #1E293B;
}

.brand-text { font-weight: 600; }
.secondary-cell-text { color: #64748B; font-weight: 400; }

/* --- Status Badges --- */
.status-badge {
  display: inline-block;
  padding: 6px 14px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
}
.badge-available {
  background: #ECFDF5;
  color: #10B981;
}
.badge-assigned {
  background: #EEF2FF;
  color: #4B49E7;
}

/* --- Pagination --- */
.pagination-container {
  margin-top: auto !important;
  position: sticky !important;
  bottom: 0;
  z-index: 15;
  background: #FFFFFF;
  padding-top: 14px;
}

.records-label { font-size: 14px; color: #94A3B8; font-weight: 500; }

@media (max-width: 1024px) {
  .asset-table-card {
    min-height: calc(100vh - 190px);
    padding: 28px 18px 14px;
  }

  .table-scroll {
    min-height: 280px;
  }
}

.page-num-circle {
  width: 32px;
  height: 32px;
  min-width: 32px;
  border-radius: 50%;
  font-weight: 600;
  color: #64748B;
  margin: 0 2px;
}
.active-page {
  background: #4B49E7 !important;
  color: white !important;
}
.page-nav-btn {
  border: 1px solid #F1F5F9;
  width: 32px;
  height: 32px;
}

/* --- Views (Add / Detail) --- */
.form-container {
  display: flex;
  width: 100%;
  max-width: 1700px;
  padding: 50px clamp(24px, 12vw, 300px) !important;
  flex-direction: column;
  align-items: center;
  border-radius: 30px !important;
  background: #ffffff !important;
  min-height: calc(100vh - 100px);
  margin: 0 auto;
}
.add-asset-card{
  display: flex;
  width: 100%;
  max-width: 1700px;
  padding: 50px clamp(24px, 12vw, 300px) !important;
  flex-direction: column;
  align-items: center;
  min-height: calc(100vh - 100px);
  border-radius: 30px !important;
  background: #FFFFFF !important;
  margin: 0 auto;
}

@media (max-width: 1024px) {
  .form-container {
    min-height: auto;
    border-radius: 24px !important;
  }

  .add-asset-card {
    min-height: auto;
    border-radius: 24px !important;
  }
}

@media (max-width: 768px) {
  .form-container {
    padding: 28px 16px !important;
    border-radius: 18px !important;
  }

  .add-asset-card {
    padding: 28px 16px !important;
    border-radius: 18px !important;
  }
}

.form-header {
  width: 100%;
}

.form-body {
  width: 100%;
  max-width: 760px;
  margin: 0 auto;
}

.add-asset-card .form-header,
.add-asset-card .full-width {
  width: 100%;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
}

@media (max-width: 1024px) {
  .add-asset-card .form-header,
  .add-asset-card .full-width {
    max-width: 600px;
  }
}

@media (max-width: 600px) {
  .add-asset-card .form-header,
  .add-asset-card .full-width {
    max-width: 100%;
  }
}

.device-details-title { font-size: 30px; font-weight: 800; width: 100%; text-align: center; margin-top:  1px;}
.subtitle { font-size: 16px; font-weight: 400; color: rgba(168, 168, 168, 1); width: 100%; text-align: center; margin-top: 10px;}
.input-label { font-size: 14px; font-weight: 600; color: #585858; margin-bottom: 8px; display: block; }
.section-divider { font-size: 18px; font-weight: 700; color: #1A1A1A; margin: 30px 0 20px; margin-top: 10px;}

.form-input :deep(.q-field__control),
.form-select :deep(.q-field__control),
.form-textarea :deep(.q-field__control) {
  border-radius: 20px !important;
  background: #ffffff !important;
}

.form-textarea :deep(.q-field__native) {
  padding: 12px !important;
}

.btn-cancel {
  border-radius: 999px;
  background: #F4F4F4 !important;
  color: #1E293B !important;
  padding: 10px 36px;
  font-weight: 700;
  transition: all 0.2s;
}

.btn-add {
  border-radius: 999px;
  background: #4B49E7 !important;
  color: white !important;
  padding: 10px 48px;
  font-weight: 700;
  transition: all 0.2s;
}

/* --- Add New Asset Dialog (Image 5) --- */
.add-new-dialog {
  width: 100%;
  max-width: 600px;
  border-radius: 24px;
  background: white;
  --dialog-padding: clamp(16px, 5vw, 48px);
}

.add-new-dialog .q-px-xl {
  padding-left: var(--dialog-padding) !important;
  padding-right: var(--dialog-padding) !important;
}

.add-new-dialog .q-pt-xl {
  padding-top: var(--dialog-padding) !important;
}

.add-new-dialog .q-pb-xl {
  padding-bottom: var(--dialog-padding) !important;
}

.add-new-dialog .scroll::-webkit-scrollbar {
  width: 6px;
}

.add-new-dialog .scroll::-webkit-scrollbar-thumb {
  background-color: rgba(0, 0, 0, 0.1);
  border-radius: 10px;
}

.remove-field-btn {
  background: #F8F9FA;
  color: #1A1A1A;
  border-radius: 12px;
  width: 40px;
  height: 40px;
  min-width: 20px;
  min-height: 20px;
}

.remove-field-btn .q-icon {
  font-size: 20px;
}

/* Manage Assets Popup padding adjustment */
.manage-assets-popup :deep(.q-card__section) {
  padding: 1px 30px !important;
  max-height: 70vh;
}
.manage-assets-popup .text-h5 {
  font-size: 20px;
  font-weight: 600;
  margin: 0;
  margin-top: 35px;
}
/* --- Global popup scroll / max height --- */
.q-dialog__inner .q-card, .q-dialog .q-card {
  max-height: 85vh !important;
  overflow: hidden !important;
}

.q-dialog__inner .q-card-section, .q-dialog .q-card-section {
  max-height: calc(75vh - 100px);
  overflow-y: hidden;
  padding-right: 6px;
}

/* dedicated scrolling section for long list content */
.asset-manage-scroll {
  max-height: 50vh;
  overflow-y: auto;
  padding-right: 4px;
}

.asset-manage-scroll::-webkit-scrollbar {
  width: 8px;
}

.asset-manage-scroll::-webkit-scrollbar-thumb {
  background-color: rgba(100, 116, 139, 0.38);
  border-radius: 999px;
}

.asset-manage-scroll::-webkit-scrollbar-track {
  background-color: rgba(227, 242, 253, 0.65);
}


.q-dialog__inner .q-card-section::-webkit-scrollbar,
.q-dialog .q-card-section::-webkit-scrollbar {
  width: 8px;
}

.q-dialog__inner .q-card-section::-webkit-scrollbar-thumb,
.q-dialog .q-card-section::-webkit-scrollbar-thumb {
  background-color: rgba(100, 116, 139, 0.35);
  border-radius: 999px;
}

.q-dialog__inner .q-card-section::-webkit-scrollbar-track,
.q-dialog .q-card-section::-webkit-scrollbar-track {
  background-color: rgba(227, 242, 253, 0.6);
}
.position-relative {
  position: relative;
}

.close-btn-top {
  position: absolute;
  top: 0;
  right: -60px;
  color: #6B7280;
}

@media (max-width: 1200px) {
  .close-btn-top {
    right: 0;
    top: -40px;
  }
}
</style>

<!-- Global styles for portalled menus -->
<style>
.premium-menu,
.action-menu,
.asset-select-popup {
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

.q-menu .q-item:hover,
.q-menu .q-item--active {
  background: #4C36E40D !important;
  color: #4C36E4 !important;
  font-weight: 600;
}
</style>

