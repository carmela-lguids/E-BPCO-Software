import { Injectable, signal } from '@angular/core';
import { APP_ROWS } from '../pages/tenant-applications/applications-data';
import { PAYMENT_BASE_ROWS } from '../pages/tenant-payments/payments-seed';
import { RECORD_BASE_ROWS } from '../pages/tenant-records/records-seed';
import { PERMIT_BASE_ROWS } from '../pages/tenant-permit-release/permit-seed';
import { MOCK_ACCOUNTS, TENANT_STATUS } from './mock-accounts';

export type SearchCategory = 'Application' | 'User' | 'Tenant' | 'Payment' | 'Record' | 'Permit';

export interface SearchResult {
  id: string;
  title: string;
  subtitle: string;
  category: SearchCategory;
  route: string;
  icon: string;
}

// One flat index over the same mock data every list page already renders —
// no new backend concept, just a client-side aggregation. Every result
// routes to the module's list page, not a specific record: no list page in
// the app currently accepts a record-id query param to open one row
// directly (see Volume III/IV notes), so this is an honest limitation
// shared with Notifications' click-through, not a new inconsistency.
function buildEntries(): SearchResult[] {
  const entries: SearchResult[] = [];

  for (const row of APP_ROWS) {
    entries.push({
      id: `app-${row.id}`,
      title: row.applicant,
      subtitle: `${row.id} · ${row.type} · ${row.city}`,
      category: 'Application',
      route: '/tenant/applications',
      icon: 'user',
    });
  }

  for (const acct of MOCK_ACCOUNTS) {
    entries.push({
      id: `user-${acct.id}`,
      title: acct.fullName,
      subtitle: `${acct.roleLabel} · ${acct.tenant ? 'Municipality of ' + acct.tenant : 'National Administration'}`,
      category: 'User',
      route: acct.tenant ? '/tenant/users' : '/user-roles',
      icon: 'user-check',
    });
  }

  for (const name of Object.keys(TENANT_STATUS)) {
    entries.push({
      id: `tenant-${name}`,
      title: `Municipality of ${name}`,
      subtitle: `Tenant · ${TENANT_STATUS[name]}`,
      category: 'Tenant',
      route: '/tenants',
      icon: 'building',
    });
  }

  for (const row of PAYMENT_BASE_ROWS) {
    entries.push({
      id: `pay-${row.id}`,
      title: row.applicant,
      subtitle: `${row.id} · Payment · ${row.status}`,
      category: 'Payment',
      route: '/tenant/payments',
      icon: 'wallet',
    });
  }

  for (const row of RECORD_BASE_ROWS) {
    entries.push({
      id: `rec-${row.id}`,
      title: row.applicant,
      subtitle: `${row.id} · ${row.type} record · ${row.status}`,
      category: 'Record',
      route: '/tenant/records',
      icon: 'archive',
    });
  }

  for (const row of PERMIT_BASE_ROWS) {
    entries.push({
      id: `permit-${row.id}`,
      title: row.applicant,
      subtitle: `${row.id} · Permit · ${row.permitStatus}`,
      category: 'Permit',
      route: '/tenant/permit-release',
      icon: 'file-check',
    });
  }

  return entries;
}

const CATEGORY_ORDER: SearchCategory[] = ['Application', 'User', 'Tenant', 'Payment', 'Record', 'Permit'];
const RECENT_SEARCHES_LIMIT = 5;
const RECENTLY_VIEWED_LIMIT = 5;

// providedIn: 'root' makes this one singleton for the whole app session —
// unlike Topbar itself, which is re-instantiated on every navigation (each
// page declares its own <app-topbar>), so recent searches have to live here
// to actually survive a route change.
@Injectable({ providedIn: 'root' })
export class SearchIndex {
  private readonly entries = buildEntries();
  private readonly recent = signal<string[]>([]);
  readonly recentSearches = this.recent.asReadonly();

  // Recently viewed records — tracked centrally here (not per-page) so it
  // survives navigation exactly like recent searches does, and reuses the
  // same result shape the search dropdown already renders.
  private readonly viewed = signal<SearchResult[]>([]);
  readonly recentlyViewed = this.viewed.asReadonly();

  recordView(entry: SearchResult): void {
    this.viewed.update((list) => {
      const next = [entry, ...list.filter((e) => e.id !== entry.id)];
      return next.slice(0, RECENTLY_VIEWED_LIMIT);
    });
  }

  search(term: string, limit = 30): SearchResult[] {
    const q = term.trim().toLowerCase();
    if (!q) return [];
    const matches = this.entries.filter(
      (e) => e.title.toLowerCase().includes(q) || e.subtitle.toLowerCase().includes(q),
    );
    matches.sort((a, b) => CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category));
    return matches.slice(0, limit);
  }

  rememberSearch(term: string): void {
    const trimmed = term.trim();
    if (!trimmed) return;
    this.recent.update((list) => {
      const next = [trimmed, ...list.filter((t) => t.toLowerCase() !== trimmed.toLowerCase())];
      return next.slice(0, RECENT_SEARCHES_LIMIT);
    });
  }
}
