import { Component, computed, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Sidebar } from '../../shared/sidebar/sidebar';
import { AccountSwitcher } from '../../shared/account-switcher/account-switcher';
import { ImpersonationBanner } from '../../shared/impersonation-banner/impersonation-banner';
import { Session } from '../../core/session';
import { NAV_BY_ROLE } from '../../core/nav-by-role';

@Component({
  selector: 'app-tenant-layout',
  imports: [RouterOutlet, Sidebar, AccountSwitcher, ImpersonationBanner],
  templateUrl: './tenant-layout.html',
  styleUrl: './tenant-layout.scss',
})
export class TenantLayout {
  private readonly session = inject(Session);

  // While a support account is impersonating a tenant, show that tenant's
  // full workspace nav (what a Tenant Administrator would see) rather than
  // the support account's own (Group A) nav.
  protected readonly navItems = computed(() =>
    this.session.impersonating() ? NAV_BY_ROLE['tenant-admin'] : NAV_BY_ROLE[this.session.currentRole()],
  );
  protected readonly activeTenant = this.session.activeTenant;
}
