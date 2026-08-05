import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { ClientsComponent } from './pages/clients/clients.component';
import { AdminUsersComponent } from './pages/admin-users/admin-users.component';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { 
    path: 'clients', 
    component: ClientsComponent, 
    canActivate: [authGuard] 
  },
  { 
    path: 'admin/users', 
    component: AdminUsersComponent, 
    canActivate: [authGuard, roleGuard],
    data: { expectedRole: 'ADMIN' } 
  },
  { path: '**', redirectTo: 'login' }
];