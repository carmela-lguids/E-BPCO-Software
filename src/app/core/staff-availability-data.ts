import { findAccount, MockAccount } from './mock-accounts';

// Phase 5 — Staff Availability. Extends the existing mock account roster
// (mock-accounts.ts) with a presence overlay rather than a second staff
// list — MockAccount.status already models account state
// (Active/Suspended/Inactive/...), which is a different concern from
// "are they available to take on work right now."
//
// This is explicitly SIMULATED presence, not a connection to any real
// presence/session service — every UI that reads this must say so.
export type AvailabilityStatus = 'available' | 'busy' | 'offline' | 'on-leave';

interface AvailabilityMeta {
  accountId: string;
  availabilityStatus: AvailabilityStatus;
  activeTaskCount: number;
}

// One entry per active, hands-on-work account across the three tenants
// that actually have mock records (Esperanza, Manila, Cebu — the same
// three TENANT_STATUS tracks). Suspended/Inactive/Pending accounts are
// left out: presence doesn't apply to an account that can't sign in.
const AVAILABILITY_META: AvailabilityMeta[] = [
  { accountId: 'mock-acct-07', availabilityStatus: 'available', activeTaskCount: 3 }, // Liza Dela Cruz — Tenant Administrator
  { accountId: 'mock-acct-08', availabilityStatus: 'busy', activeTaskCount: 5 }, // Daniel Cruz — Tenant Administrator
  { accountId: 'mock-acct-09', availabilityStatus: 'available', activeTaskCount: 4 }, // Engr. Maria Santos — OBO
  { accountId: 'mock-acct-10', availabilityStatus: 'busy', activeTaskCount: 6 }, // Jonny Doe — Initial Evaluation
  { accountId: 'mock-acct-11', availabilityStatus: 'available', activeTaskCount: 2 }, // Denese Martin — Zoning
  { accountId: 'mock-acct-12', availabilityStatus: 'on-leave', activeTaskCount: 0 }, // Raul Villa — Fire Safety
  { accountId: 'mock-acct-13', availabilityStatus: 'available', activeTaskCount: 3 }, // Fea Sims — Inspector
  { accountId: 'mock-acct-14', availabilityStatus: 'offline', activeTaskCount: 0 }, // David Roderick — Cashier
  { accountId: 'mock-acct-15', availabilityStatus: 'busy', activeTaskCount: 4 }, // James Zavel — Releasing
  { accountId: 'mock-acct-16', availabilityStatus: 'available', activeTaskCount: 2 }, // Jack Nunnally — Records
  { accountId: 'mock-acct-17', availabilityStatus: 'available', activeTaskCount: 2 }, // Ana Garcia — Manila, Zoning
  { accountId: 'mock-acct-18', availabilityStatus: 'busy', activeTaskCount: 3 }, // Mark Lopez — Cebu, Cashier
];

export interface StaffAvailabilityRow {
  account: MockAccount;
  availabilityStatus: AvailabilityStatus;
  activeTaskCount: number;
}

export const STAFF_AVAILABILITY: StaffAvailabilityRow[] = AVAILABILITY_META.flatMap((meta) => {
  const acct = findAccount(meta.accountId);
  if (!acct) return [];
  return [{ account: acct, availabilityStatus: meta.availabilityStatus, activeTaskCount: meta.activeTaskCount }];
});

/** Tenant Administrator view — staff belonging to one LGU only. */
export function staffForTenant(tenant: string | null): StaffAvailabilityRow[] {
  return STAFF_AVAILABILITY.filter((r) => r.account.tenant === tenant);
}

export interface LguStaffSummary {
  tenant: string;
  total: number;
  available: number;
  busy: number;
  offline: number;
  onLeave: number;
}

/** Super Administrator view — aggregated by LGU, not a national roster. */
export function staffSummaryByLgu(): LguStaffSummary[] {
  const tenants = Array.from(
    new Set(STAFF_AVAILABILITY.map((r) => r.account.tenant).filter((t): t is string => !!t)),
  );
  return tenants.map((tenant) => {
    const rows = STAFF_AVAILABILITY.filter((r) => r.account.tenant === tenant);
    return {
      tenant,
      total: rows.length,
      available: rows.filter((r) => r.availabilityStatus === 'available').length,
      busy: rows.filter((r) => r.availabilityStatus === 'busy').length,
      offline: rows.filter((r) => r.availabilityStatus === 'offline').length,
      onLeave: rows.filter((r) => r.availabilityStatus === 'on-leave').length,
    };
  });
}
