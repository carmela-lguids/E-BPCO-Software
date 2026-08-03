import { Injectable, computed, inject, signal } from '@angular/core';
import { Session } from './session';
import { RoleKey } from './roles';

export type NotificationType =
  | 'assignment'
  | 'payment'
  | 'evaluation'
  | 'inspection'
  | 'permit'
  | 'records'
  | 'system'
  | 'security';

export type NotificationPriority = 'critical' | 'high' | 'normal';

export interface AppNotification {
  id: string;
  type: NotificationType;
  message: string;
  relatedLabel?: string;
  relatedRoute?: string;
  timestamp: string;
  roles: RoleKey[];
  read: boolean;
  priority: NotificationPriority;
}

const PRIORITY_WEIGHT: Record<NotificationPriority, number> = {
  critical: 0,
  high: 1,
  normal: 2,
};

// Mock notification feed. Each item names a real record already in the app's
// mock data (application IDs, applicant names) and links to the module that
// actually owns that record, so "click through" always lands somewhere real —
// none of the pages it links to support deep-linking to one row yet, so the
// link opens that module's list rather than a specific record.
const SEED: AppNotification[] = [
  {
    id: 'n1', type: 'assignment',
    message: 'Application #WA-2025 (Fea Sims) was assigned to you for Zoning Evaluation.',
    relatedLabel: '#WA-2025', relatedRoute: '/tenant/applications',
    timestamp: '12 minutes ago', roles: ['zoning', 'tenant-admin'], read: false, priority: 'normal',
  },
  {
    id: 'n2', type: 'payment',
    message: 'Payment verification requested for #WA-2021 (Jack Nunnally).',
    relatedLabel: '#WA-2021', relatedRoute: '/tenant/payments',
    timestamp: '38 minutes ago', roles: ['cashier', 'tenant-admin'], read: false, priority: 'high',
  },
  {
    id: 'n3', type: 'evaluation',
    message: '#WA-2017 (Glen Morning) was returned for revision by Zoning Evaluation.',
    relatedLabel: '#WA-2017', relatedRoute: '/tenant/applications',
    timestamp: '1 hour ago', roles: ['tenant-admin', 'initial-eval'], read: false, priority: 'high',
  },
  {
    id: 'n4', type: 'inspection',
    message: 'Inspection scheduled for #WA-2018 (Axie Barnes) tomorrow at 9:00 AM.',
    relatedLabel: '#WA-2018', relatedRoute: '/tenant/inspections',
    timestamp: '2 hours ago', roles: ['inspector', 'tenant-admin'], read: true, priority: 'normal',
  },
  {
    id: 'n5', type: 'assignment',
    message: '3 applications have been unassigned for more than 5 days.',
    relatedRoute: '/tenant/applications',
    timestamp: '3 hours ago', roles: ['tenant-admin'], read: false, priority: 'high',
  },
  {
    id: 'n6', type: 'permit',
    message: 'Permit ready for release — #WA-2024 (David Roderick).',
    relatedLabel: '#WA-2024', relatedRoute: '/tenant/permit-release',
    timestamp: '5 hours ago', roles: ['releasing', 'tenant-admin', 'obo'], read: true, priority: 'normal',
  },
  {
    id: 'n7', type: 'records',
    message: '#WA-2022 (Denese Martin) was archived after rejection.',
    relatedLabel: '#WA-2022', relatedRoute: '/tenant/records',
    timestamp: '1 day ago', roles: ['records', 'tenant-admin'], read: true, priority: 'normal',
  },
  {
    id: 'n8', type: 'system',
    message: 'Municipality of Cebu was onboarded to the platform.',
    relatedRoute: '/tenants',
    timestamp: '1 day ago', roles: ['super-admin', 'platform-admin', 'ops-manager'], read: false, priority: 'normal',
  },
  {
    id: 'n9', type: 'security',
    message: '3 failed login attempts were detected on one account this week.',
    relatedRoute: '/security/dashboard',
    timestamp: '2 days ago', roles: ['security-admin', 'auditor'], read: false, priority: 'critical',
  },
  {
    id: 'n10', type: 'system',
    message: 'A support session was started for Municipality of Manila.',
    relatedRoute: '/support/dashboard',
    timestamp: '2 days ago', roles: ['support-admin'], read: true, priority: 'normal',
  },
  {
    id: 'n11', type: 'system',
    message: 'Your weekly audit export is ready for download.',
    relatedRoute: '/system-logs',
    timestamp: '3 days ago', roles: ['auditor'], read: false, priority: 'normal',
  },
  {
    id: 'n12', type: 'evaluation',
    message: 'Multi-discipline sign-off is complete for #WA-2019 (Anthony Williams) — ready for Building Official review.',
    relatedLabel: '#WA-2019', relatedRoute: '/tenant/applications',
    timestamp: '4 days ago', roles: ['obo', 'tenant-admin'], read: true, priority: 'high',
  },
];

const TYPE_ICON: Record<NotificationType, string> = {
  assignment: 'user-check',
  payment: 'wallet',
  evaluation: 'calendar',
  inspection: 'clipboard-check',
  permit: 'file-check',
  records: 'archive',
  system: 'info',
  security: 'lock',
};

@Injectable({ providedIn: 'root' })
export class Notifications {
  private readonly session = inject(Session);
  private readonly all = signal<AppNotification[]>(SEED);

  readonly forCurrentRole = computed(() => {
    const role = this.session.currentRole();
    return this.all()
      .filter((n) => n.roles.includes(role))
      .slice()
      .sort((a, b) => PRIORITY_WEIGHT[a.priority] - PRIORITY_WEIGHT[b.priority]);
  });

  readonly unreadCount = computed(() => this.forCurrentRole().filter((n) => !n.read).length);

  iconFor(type: NotificationType): string {
    return TYPE_ICON[type];
  }

  priorityLabel(priority: NotificationPriority): string {
    return priority === 'critical' ? 'Critical' : priority === 'high' ? 'High priority' : '';
  }

  markRead(id: string): void {
    this.all.update((list) => list.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }

  markAllRead(): void {
    const role = this.session.currentRole();
    this.all.update((list) =>
      list.map((n) => (n.roles.includes(role) ? { ...n, read: true } : n)),
    );
  }
}
