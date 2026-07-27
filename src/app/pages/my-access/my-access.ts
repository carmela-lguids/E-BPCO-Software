import { Component, computed, inject } from '@angular/core';
import { Topbar } from '../../shared/topbar/topbar';
import { Icon } from '../../shared/icon/icon';
import { RoleBadge } from '../../shared/role-badge/role-badge';
import { Session } from '../../core/session';
import { NAV_BY_ROLE, restrictedModulesFor } from '../../core/nav-by-role';
import { CAPABILITIES } from '../../core/capabilities';

@Component({
  selector: 'app-my-access',
  imports: [Topbar, Icon, RoleBadge],
  templateUrl: './my-access.html',
  styleUrl: './my-access.scss',
})
export class MyAccess {
  private readonly session = inject(Session);

  protected readonly account = this.session.currentAccount;

  protected readonly allowedModules = computed(() => NAV_BY_ROLE[this.account().role]);
  protected readonly restrictedModules = computed(() => restrictedModulesFor(this.account().role));
  protected readonly capabilities = computed(() => CAPABILITIES[this.account().role]);
}
