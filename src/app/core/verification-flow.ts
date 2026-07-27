import { MockAccount, TENANT_STATUS } from './mock-accounts';
import { ROLES } from './roles';

// Single source of truth for "where does this account land right now" —
// used by both the login form and the Development Role Preview switcher, so
// the two entry points can never disagree about the verification flow
// (Identity memo §02).
export function resolveLandingRoute(account: MockAccount): string {
  if (account.status === 'Pending Confirmation') return '/confirm-account';
  if (account.status === 'Suspended') return '/account-status/suspended';
  if (account.status === 'Inactive') return '/account-status/inactive';
  if (account.tenant && TENANT_STATUS[account.tenant] === 'Inactive') {
    return '/account-status/tenant-inactive';
  }
  // 'Reported' and 'Active' both continue through — 'Reported' shows a
  // persistent status banner on the dashboard rather than a redirect.
  return ROLES[account.role].landingPath;
}
