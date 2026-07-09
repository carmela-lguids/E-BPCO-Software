import { Component, input } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { Icon } from '../icon/icon';
import { DilgSeal } from '../dilg-seal/dilg-seal';

export interface NavItem {
  label: string;
  icon: string;
  path: string;
}

const SUPER_ADMIN_NAV: NavItem[] = [
  { label: 'Dashboard', icon: 'home', path: '/dashboard' },
  { label: 'User & Roles', icon: 'user-check', path: '/user-roles' },
  { label: 'System Logs', icon: 'logs', path: '/system-logs' },
  { label: 'Tenants', icon: 'building', path: '/tenants' },
  { label: 'Workflow', icon: 'workflow', path: '/workflow' },
];

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive, Icon, DilgSeal],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss',
})
export class Sidebar {
  readonly navItems = input<NavItem[]>(SUPER_ADMIN_NAV);
  readonly logoutPath = input<string>('/login');

  constructor(private readonly router: Router) {}

  logout(): void {
    this.router.navigateByUrl(this.logoutPath());
  }
}
