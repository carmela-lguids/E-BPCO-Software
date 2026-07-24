import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Icon } from '../icon/icon';
import { Avatar } from '../avatar/avatar';
import { Session } from '../../core/session';
import { MOCK_ACCOUNTS, MockAccount } from '../../core/mock-accounts';
import { ROLES } from '../../core/roles';

@Component({
  selector: 'app-account-switcher',
  imports: [Icon, Avatar],
  templateUrl: './account-switcher.html',
  styleUrl: './account-switcher.scss',
})
export class AccountSwitcher {
  private readonly session = inject(Session);
  private readonly router = inject(Router);

  protected readonly open = signal(false);
  protected readonly currentAccount = this.session.currentAccount;

  protected readonly superAdminAccounts = MOCK_ACCOUNTS.filter((a) => a.accountType === 'Super Admin');
  protected readonly tenantAccounts = MOCK_ACCOUNTS.filter((a) => a.accountType === 'Tenant Admin');

  protected readonly tenantGroups = computed(() => {
    const groups = new Map<string, MockAccount[]>();
    for (const acct of this.tenantAccounts) {
      const key = acct.tenant ?? 'Unassigned';
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(acct);
    }
    return Array.from(groups.entries());
  });

  toggle(): void {
    this.open.update((v) => !v);
  }

  select(account: MockAccount): void {
    this.session.switchAccount(account.id);
    this.open.set(false);
    this.router.navigateByUrl(ROLES[account.role].landingPath);
  }
}
