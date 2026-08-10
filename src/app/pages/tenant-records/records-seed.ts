// Kept separate from tenant-records.ts (which imports the shared Topbar,
// same as every other page) so the global SearchIndex service can import
// this seed data without creating a Topbar -> SearchIndex -> TenantRecords
// -> Topbar circular import.
export type RecordType = 'Permit' | 'Application' | 'Document';
export type RecordStatus = 'Active' | 'Archived';

export interface RecordArchiveRow {
  id: string;
  type: RecordType;
  applicant: string;
  city: string;
  archivedDate: string;
  archivedBy: string;
  status: RecordStatus;
  retentionDeadline: string;
  eligibleForDisposal: boolean;
  /** Phase 17 — Records Lifecycle Integration. Set only for rows derived
   *  from a real canonical application (core/application-data.ts) that has
   *  reached release.status === 'Released' — see tenant-records.ts's
   *  recordsFromReleasedApplications(). The 7 rows below predate the
   *  canonical dataset and have no real relationship to any canonical
   *  application (different applicants, a distinct #WA-2010-2016 id block
   *  Phase 1's audit already confirmed doesn't correspond to anything) —
   *  left undefined here rather than fabricating one. */
  applicationId?: string;
}

// How long a record must be kept before it's eligible for disposal, once
// archived — government records retention is type-specific, not one blanket
// rule. Shown as a column rather than a settings toggle since it varies per
// record, not per tenant.
export const RETENTION_POLICY: Record<RecordType, string> = {
  Permit: '10 years from archive date',
  Application: '5 years from archive date',
  Document: '3 years from archive date',
};

export const RECORD_BASE_ROWS: RecordArchiveRow[] = [
  { id: '#WA-2010', type: 'Permit', applicant: 'Carmen Diaz', city: 'Taguig City', archivedDate: '3 Jun 2026', archivedBy: 'Jack Nunnally', status: 'Archived', retentionDeadline: '3 Jun 2036', eligibleForDisposal: false },
  { id: '#WA-2011', type: 'Application', applicant: 'Victor Bautista', city: 'Quezon City', archivedDate: '—', archivedBy: '—', status: 'Active', retentionDeadline: '—', eligibleForDisposal: false },
  { id: '#WA-2012', type: 'Document', applicant: 'Rosa Mendoza', city: 'Pasig City', archivedDate: '18 May 2026', archivedBy: 'Jack Nunnally', status: 'Archived', retentionDeadline: '18 May 2029', eligibleForDisposal: false },
  { id: '#WA-2013', type: 'Permit', applicant: 'Grace Tan', city: 'Pasay City', archivedDate: '—', archivedBy: '—', status: 'Active', retentionDeadline: '—', eligibleForDisposal: false },
  { id: '#WA-2014', type: 'Application', applicant: 'Paolo Ramos', city: 'Makati City', archivedDate: '2 Apr 2026', archivedBy: 'Jack Nunnally', status: 'Archived', retentionDeadline: '2 Apr 2031', eligibleForDisposal: false },
  { id: '#WA-2015', type: 'Document', applicant: 'Liza Dela Cruz', city: 'Paranaque City', archivedDate: '—', archivedBy: '—', status: 'Active', retentionDeadline: '—', eligibleForDisposal: false },
  { id: '#WA-2016', type: 'Permit', applicant: 'Ramon Torres', city: 'Bulacan City', archivedDate: '11 Mar 2026', archivedBy: 'Jack Nunnally', status: 'Archived', retentionDeadline: '11 Mar 2016', eligibleForDisposal: true },
];
