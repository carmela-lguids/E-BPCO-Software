// Phase 6 — System Health. This is frontend simulation only: no real
// connectivity, auth, storage, or database check exists behind any of
// these rows. Every consumer must say so in its own UI, not just here.
export type SystemHealthStatus = 'healthy' | 'warning' | 'critical' | 'maintenance';

export interface SystemHealthCheck {
  key: string;
  label: string;
  status: SystemHealthStatus;
  detail: string;
}

// Deliberately no 'critical' row seeded here — the rest of this prototype
// renders and responds normally, so claiming a critical infrastructure
// failure alongside a fully working dashboard would be internally
// inconsistent. One 'warning' and one 'maintenance' row are included so
// the widget still demonstrates every non-critical state.
export const SYSTEM_HEALTH_CHECKS: SystemHealthCheck[] = [
  { key: 'app', label: 'Application Service', status: 'healthy', detail: 'Responding normally' },
  { key: 'auth', label: 'Authentication Service', status: 'healthy', detail: 'Responding normally' },
  { key: 'notifications', label: 'Notification Service', status: 'healthy', detail: 'Responding normally' },
  { key: 'storage', label: 'File Storage', status: 'warning', detail: 'Elevated latency on document uploads' },
  { key: 'routing', label: 'Tenant Routing', status: 'healthy', detail: 'Responding normally' },
  { key: 'database', label: 'Database Connection', status: 'healthy', detail: 'Responding normally' },
  { key: 'maintenance', label: 'Scheduled Maintenance', status: 'maintenance', detail: 'Planned window: Sat 02:00–04:00' },
  { key: 'version', label: 'Platform Version', status: 'healthy', detail: 'v1.6.0' },
];

const STATUS_WEIGHT: Record<SystemHealthStatus, number> = {
  critical: 0,
  warning: 1,
  maintenance: 2,
  healthy: 3,
};

export function overallSystemStatus(checks: SystemHealthCheck[] = SYSTEM_HEALTH_CHECKS): SystemHealthStatus {
  return checks.reduce<SystemHealthStatus>(
    (worst, c) => (STATUS_WEIGHT[c.status] < STATUS_WEIGHT[worst] ? c.status : worst),
    'healthy',
  );
}

export function statusTier(status: SystemHealthStatus): 'approved' | 'pending' | 'rejected' | 'info' {
  if (status === 'critical') return 'rejected';
  if (status === 'warning') return 'pending';
  if (status === 'maintenance') return 'info';
  return 'approved';
}

export function statusLabel(status: SystemHealthStatus): string {
  if (status === 'critical') return 'Critical';
  if (status === 'warning') return 'Warning';
  if (status === 'maintenance') return 'Maintenance';
  return 'Healthy';
}
