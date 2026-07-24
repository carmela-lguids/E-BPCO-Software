import { Injectable, computed, signal } from '@angular/core';
import { DEFAULT_ACCOUNT, MockAccount, findAccount } from './mock-accounts';
import { RoleKey } from './roles';

export interface ImpersonationState {
  tenant: string;
  startedAt: string;
}

// Frontend-only session simulation. There is no auth, no token, and this
// state does not survive a hard refresh (matching the memo — this is a
// dev/demo switcher, not a persistence layer).
@Injectable({ providedIn: 'root' })
export class Session {
  private readonly account = signal<MockAccount>(DEFAULT_ACCOUNT);
  private readonly impersonation = signal<ImpersonationState | null>(null);

  readonly currentAccount = this.account.asReadonly();
  readonly impersonating = this.impersonation.asReadonly();

  readonly currentRole = computed<RoleKey>(() => this.account().role);

  /** The tenant whose data should currently be shown — the impersonated
   *  tenant if support is impersonating, otherwise the logged-in account's
   *  own tenant. */
  readonly activeTenant = computed<string | null>(() => this.impersonation()?.tenant ?? this.account().tenant);

  switchAccount(id: string): void {
    const next = findAccount(id);
    if (!next) return;
    this.account.set(next);
    this.impersonation.set(null);
  }

  startImpersonation(tenant: string): void {
    this.impersonation.set({ tenant, startedAt: 'just now' });
  }

  endImpersonation(): void {
    this.impersonation.set(null);
  }
}
