import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Sidebar, NavItem } from '../../shared/sidebar/sidebar';

const TENANT_NAV: NavItem[] = [
  { label: 'Dashboard', icon: 'home', path: '/tenant/dashboard' },
  { label: 'Applications', icon: 'user', path: '/tenant/applications' },
  { label: 'Evaluations', icon: 'calendar', path: '/tenant/evaluations' },
  { label: 'Payments', icon: 'wallet', path: '/tenant/payments' },
  { label: 'Permit Release', icon: 'file-check', path: '/tenant/permit-release' },
  { label: 'Workflow', icon: 'workflow', path: '/tenant/workflow' },
];

@Component({
  selector: 'app-tenant-layout',
  imports: [RouterOutlet, Sidebar],
  templateUrl: './tenant-layout.html',
  styleUrl: './tenant-layout.scss',
})
export class TenantLayout {
  protected readonly tenantNav = TENANT_NAV;
}
