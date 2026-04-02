// routes updated
const routes = [
  {
    path: '/',
    component: () => import('pages/LoginPage.vue')
  },
  {
    path: '/dashboard',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { path: '', redirect: '/dashboard/helpdesk' },
      { path: 'helpdesk', component: () => import('components/HelpdeskInbox.vue') },
      { path: 'ticket-board', component: () => import('components/TicketBoard.vue') },
      { path: 'softwareinstaller', component: () => import('components/SoftwareInstaller.vue') },
      { path: 'onboarding', component: () => import('components/OnboardingPage.vue') },
      { path: 'manage-assets', component: () => import('components/AssetManagement.vue') },
      { path: 'chat', component: () => import('pages/Index.vue') }
    ]
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue')
  }
]

export default routes