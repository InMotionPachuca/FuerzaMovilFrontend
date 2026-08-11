import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { ClientsComponent } from './pages/clients/clients.component';
import { AgentDashboardComponent } from './pages/agents-dashboard/agent-dashboard.component';
import { AdminDashboardComponent } from './pages/admin-dashboard/admin-dashboard.component';
import { AdminUsersComponent } from './pages/admin-users/admin-users.component';
import { AgentListComponent } from './features/agents/agent-list.component';
import { AdminAnalyticsComponent } from './components/dashboard-analytics/admin-analytics.component';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  // Redirección inicial obligatoria al Login
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },

  // Rutas protegidas por sesión
  { path: 'clients', component: ClientsComponent, canActivate: [authGuard] },
  { path: 'agent-dashboard', component: AgentDashboardComponent, canActivate: [authGuard] },
  { path: 'admin-dashboard', component: AdminDashboardComponent, canActivate: [authGuard] },
  { path: 'admin/users', component: AdminUsersComponent, canActivate: [authGuard] },
  { path: 'admin/agents', component: AgentListComponent, canActivate: [authGuard] },
  { path: 'admin/analytics', component: AdminAnalyticsComponent, canActivate: [authGuard] },

  // Cualquier otra ruta no encontrada redirige al Login
  { path: '**', redirectTo: 'login' }
];