import { Component, computed, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Sidebar } from '../../shared/sidebar/sidebar';
import { ImpersonationBanner } from '../../shared/impersonation-banner/impersonation-banner';
import { StatusBanner } from '../../shared/status-banner/status-banner';
import { Session } from '../../core/session';
import { NAV_BY_ROLE } from '../../core/nav-by-role';

@Component({
  selector: 'app-admin-layout',
  imports: [RouterOutlet, Sidebar, ImpersonationBanner, StatusBanner],
  templateUrl: './admin-layout.html',
  styleUrl: './admin-layout.scss',
})
export class AdminLayout {
  private readonly session = inject(Session);

  protected readonly navItems = computed(() => NAV_BY_ROLE[this.session.currentRole()]);
}
