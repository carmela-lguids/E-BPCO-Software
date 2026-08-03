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
  /** Phase 6 — Recent Incidents. Who's handling this, in the existing mock
   *  account roster (core/mock-accounts.ts) — not a new invented person. */
  assignedAdmin?: string;
  /** The LGU this relates to, if any — undefined means platform-wide. */
  relatedTenant?: string;
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
    assignedAdmin: 'David Roderick', relatedTenant: 'Esperanza',
  },
  {
    id: 'n3', type: 'evaluation',
    message: '#WA-2017 (Glen Morning) was returned for revision by Zoning Evaluation.',
    relatedLabel: '#WA-2017', relatedRoute: '/tenant/applications',
    timestamp: '1 hour ago', roles: ['tenant-admin', 'initial-eval'], read: false, priority: 'high',
    assignedAdmin: 'Denese Martin', relatedTenant: 'Esperanza',
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
    assignedAdmin: 'Liza Dela Cruz', relatedTenant: 'Esperanza',
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
    assignedAdmin: 'Victor Bautista', relatedTenant: 'Cebu',
  },
  {
    id: 'n9', type: 'security',
    message: '3 failed login attempts were detected on one account this week.',
    relatedRoute: '/security/dashboard',
    // Added 'super-admin' here — a critical security incident should be
    // visible to the platform's top administrator, not only security-admin
    // and auditor. This was a genuine gap in the original role targeting,
    // surfaced while wiring the Command Center's Recent Incidents widget.
    timestamp: '2 days ago', roles: ['security-admin', 'auditor', 'super-admin'], read: false, priority: 'critical',
    assignedAdmin: 'Paolo Ramos',
  },
  {
    id: 'n10', type: 'system',
    message: 'A support session was started for Municipality of Manila.',
    relatedRoute: '/support/dashboard',
    timestamp: '2 days ago', roles: ['support-admin', 'super-admin'], read: true, priority: 'normal',
    assignedAdmin: 'Grace Tan', relatedTenant: 'Manila',
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
    assignedAdmin: 'Engr. Maria Santos', relatedTenant: 'Esperanza',
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

// Phase 6 — Recent Incidents display labels. "Source" is a friendlier name
// for the same `type` field the bell/notifications page already groups by;
// "Module" is derived from the existing `relatedRoute`. Neither is a new
// data dimension — both are display-only maps over fields that already
// exist on AppNotification.
const SOURCE_LABEL: Record<NotificationType, string> = {
  assignment: 'Assignment Engine',
  payment: 'Payment Service',
  evaluation: 'Evaluation Workflow',
  inspection: 'Inspection Scheduler',
  permit: 'Permit Release',
  records: 'Records Archive',
  system: 'System Monitor',
  security: 'Security Monitor',
};

const MODULE_LABEL: Record<string, string> = {
  '/tenant/applications': 'Applications',
  '/tenant/payments': 'Payments',
  '/tenant/inspections': 'Inspections',
  '/tenant/permit-release': 'Permit Release',
  '/tenant/records': 'Records',
  '/tenants': 'Tenants',
  '/security/dashboard': 'Security Dashboard',
  '/support/dashboard': 'Support Dashboard',
  '/system-logs': 'System Logs',
};

export type IncidentSeverity = 'Critical' | 'High' | 'Normal' | 'Information';
export type IncidentStatus = 'Open' | 'Resolved';

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

  // --- Phase 6 — Recent Incidents ---
  // Every value below is derived from fields AppNotification already has
  // (priority, type, read, relatedRoute) — no incident carries data this
  // service didn't already model, aside from the two optional fields added
  // above (assignedAdmin, relatedTenant).
  sourceLabel(type: NotificationType): string {
    return SOURCE_LABEL[type];
  }

  moduleLabel(route?: string): string {
    if (!route) return '—';
    return MODULE_LABEL[route] ?? route;
  }

  severity(n: AppNotification): IncidentSeverity {
    if (n.priority === 'critical') return 'Critical';
    if (n.priority === 'high') return 'High';
    if (n.type === 'system') return 'Information';
    return 'Normal';
  }

  severityTier(n: AppNotification): 'rejected' | 'pending' | 'info' | 'approved' {
    const severity = this.severity(n);
    if (severity === 'Critical') return 'rejected';
    if (severity === 'High') return 'pending';
    if (severity === 'Information') return 'info';
    return 'approved';
  }

  incidentStatus(n: AppNotification): IncidentStatus {
    return n.read ? 'Resolved' : 'Open';
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
