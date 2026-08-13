import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { ClientsComponent } from './pages/clients/clients.component';
import { AgentDashboardComponent } from './pages/agents-dashboard/agent-dashboard.component';
import { AdminDashboardComponent } from './pages/admin-dashboard/admin-dashboard.component';
import { AdminUsersComponent } from './pages/admin-users/admin-users.component';
import { AgentListComponent } from './features/agents/agent-list.component';
import { AdminAnalyticsComponent } from './components/dashboard-analytics/admin-analytics.component';
import { TopAgentsComponent } from './pages/admin/top-agents/top-agents.component';

// Guards
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';

export const routes: Routes = [
  // Redirección inicial
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },

  // 🔹 RUTAS DE AGENTE Y GENERALES (Protegidas por sesión)
  { 
    path: 'clients', 
    component: ClientsComponent, 
    canActivate: [authGuard] 
  },
  { 
    path: 'agent-dashboard', 
    component: AgentDashboardComponent, 
    canActivate: [authGuard] 
  },

  // 🛡️ RUTAS EXCLUSIVAS DE ADMINISTRADOR (Requieren authGuard y adminGuard)
  { 
    path: 'admin-dashboard', 
    component: AdminDashboardComponent, 
    canActivate: [authGuard, adminGuard] 
  },
  { 
    path: 'admin/users', 
    component: AdminUsersComponent, 
    canActivate: [authGuard, adminGuard] 
  },
  { 
    path: 'admin/agents', 
    component: AgentListComponent, 
    canActivate: [authGuard, adminGuard] 
  },
  { 
    path: 'admin/analytics', 
    component: AdminAnalyticsComponent, 
    canActivate: [authGuard, adminGuard] 
  },
  { 
    path: 'admin/top-agents', 
    component: TopAgentsComponent, 
    canActivate: [authGuard, adminGuard] // <-- Ruta declarada correctamente
  },

  // Cualquier otra ruta no encontrada redirige al Login sin destruir la sesión automáticamente
  { path: '**', redirectTo: 'login' }
];