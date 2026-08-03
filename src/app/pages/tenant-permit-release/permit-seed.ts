// Kept separate from tenant-permit-release.ts (which imports the shared
// Topbar, same as every other page) so the global SearchIndex service can
// import this seed data without creating a Topbar -> SearchIndex ->
// TenantPermitRelease -> Topbar circular import.
export type PermitStatus = 'Ready' | 'Released' | 'Voided';

export const PERMIT_BASE_ROWS: Array<{ id: string; applicant: string; city: string; type: string; permitStatus: PermitStatus }> = [
  { id: '#WA-2026', applicant: 'Raul Villa', city: 'Taguig City', type: 'Residential', permitStatus: 'Released' },
  { id: '#WA-2025', applicant: 'Fea Sims', city: 'Quezon City', type: 'Commercial', permitStatus: 'Ready' },
  { id: '#WA-2024', applicant: 'David Roderick', city: 'Pasig City', type: 'Renovation', permitStatus: 'Released' },
  { id: '#WA-2023', applicant: 'James Zavel', city: 'Pasay City', type: 'Renovation', permitStatus: 'Released' },
  { id: '#WA-2022', applicant: 'Denese Martin', city: 'Makati City', type: 'Renovation', permitStatus: 'Ready' },
  { id: '#WA-2021', applicant: 'Jack Nunnally', city: 'Paranaque City', type: 'Renovation', permitStatus: 'Ready' },
  { id: '#WA-2020', applicant: 'James Zavel', city: 'Bulacan City', type: 'Residential', permitStatus: 'Released' },
  { id: '#WA-2019', applicant: 'Anthony Williams', city: 'Mandaluyong City', type: 'Commercial', permitStatus: 'Ready' },
  { id: '#WA-2018', applicant: 'Axie Barnes', city: 'Marikina City', type: 'Commercial', permitStatus: 'Released' },
  { id: '#WA-2017', applicant: 'Glen Morning', city: 'Caloocan City', type: 'Commercial', permitStatus: 'Ready' },
];
