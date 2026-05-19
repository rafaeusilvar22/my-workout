const routes = [
  {
    path: '/',
    redirect: '/auth/login',
  },
  {
    path: '/auth',
    component: () => import('src/layouts/MainLayout.vue'),
    children: [
      { path: 'login', component: () => import('src/pages/auth/LoginPage.vue') },
      { path: 'register', component: () => import('src/pages/auth/RegisterPage.vue') },
    ],
  },
  {
    path: '/trainer',
    component: () => import('src/layouts/TrainerLayout.vue'),
    meta: { requiresAuth: true, role: 'trainer' },
    children: [
      { path: 'dashboard', component: () => import('src/pages/trainer/DashboardPage.vue') },
      { path: 'athletes', component: () => import('src/pages/trainer/AthletesPage.vue') },
      { path: 'athletes/:id', component: () => import('src/pages/trainer/AthleteDetailPage.vue') },
      { path: 'athletes/:id/report', component: () => import('src/pages/trainer/AthleteReportPage.vue') },
      { path: 'exercises', component: () => import('src/pages/trainer/ExercisesPage.vue') },
      { path: 'programs/new', component: () => import('src/pages/trainer/ProgramBuilderPage.vue') },
      { path: 'programs/:id', component: () => import('src/pages/trainer/ProgramBuilderPage.vue') },
      { path: 'schedule', component: () => import('src/pages/trainer/SchedulePage.vue') },
    ],
  },
  {
    path: '/athlete',
    component: () => import('src/layouts/AthleteLayout.vue'),
    meta: { requiresAuth: true, role: 'athlete' },
    children: [
      { path: 'home', component: () => import('src/pages/athlete/HomePage.vue') },
      { path: 'workout/:splitId', component: () => import('src/pages/athlete/WorkoutPage.vue') },
      { path: 'progress', component: () => import('src/pages/athlete/ProgressPage.vue') },
      { path: 'profile', component: () => import('src/pages/athlete/ProfilePage.vue') },
    ],
  },
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue'),
  },
]

export default routes
