import { Component, inject, input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Icon } from '../icon/icon';
import { DilgSeal } from '../dilg-seal/dilg-seal';
import { UiState } from '../../core/ui-state';

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

// Identity (name, role badge, org) and Sign Out both already live in the
// topbar's account dropdown — the sidebar stays navigation-only rather than
// duplicating them. Below the phone breakpoint this becomes an off-canvas
// drawer, opened by the hamburger button in Topbar via the shared UiState.
@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive, Icon, DilgSeal],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss',
})
export class Sidebar {
  protected readonly uiState = inject(UiState);

  readonly navItems = input<NavItem[]>(SUPER_ADMIN_NAV);
}
