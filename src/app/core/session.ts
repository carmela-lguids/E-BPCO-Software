import { Injectable, computed, signal } from '@angular/core';
import { DEFAULT_ACCOUNT, MockAccount, findAccount, findAccountByLogin } from './mock-accounts';
import { RoleKey } from './roles';

export interface ImpersonationState {
  tenant: string;
  startedAt: string;
  /** The real account doing the impersonating — kept separate from
   *  `currentAccount` so the UI can never blur "who is actually logged in"
   *  with "whose workspace they're viewing." */
  by: MockAccount;
}

export interface IncorrectAssignmentReport {
  currentRole: string;
  expectedRole: string;
  currentDepartment: string;
  expectedDepartment: string;
  currentTenant: string | null;
  description: string;
  note: string;
  submittedAt: string;
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

  /** Mock login: looks up the account by email/username only — no password
   *  check exists in this simulation. Returns the matched account, or null
   *  if nothing matches (the login screen shows a generic invalid-credential
   *  message either way, per the identity memo §03). */
  signIn(emailOrUsername: string): MockAccount | null {
    const match = findAccountByLogin(emailOrUsername);
    if (!match) return null;
    this.account.set(match);
    this.impersonation.set(null);
    return match;
  }

  /** First-login confirmation (identity memo §04) — mock-only, in-memory. */
  confirmAccount(): void {
    this.account.update((a) => ({ ...a, status: 'Active', accountConfirmed: true }));
  }

  /** Report Incorrect Assignment (identity memo §07) — moves the account to
   *  the 'Reported' status; the report content itself isn't persisted
   *  anywhere real, matching "no real email/notification." */
  reportIncorrectAssignment(_report: IncorrectAssignmentReport): void {
    this.account.update((a) => ({ ...a, status: 'Reported' }));
  }

  /** The only profile field this simulation lets a user edit themselves —
   *  everything organizational (role, tenant, department, status) stays
   *  read-only per the identity memo's access rules. */
  updateContactNumber(contactNumber: string): void {
    this.account.update((a) => ({ ...a, contactNumber }));
  }

  startImpersonation(tenant: string): void {
    this.impersonation.set({ tenant, startedAt: 'Just now', by: this.account() });
  }

  endImpersonation(): void {
    this.impersonation.set(null);
  }
}
