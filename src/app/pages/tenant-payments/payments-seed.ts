// Kept separate from tenant-payments.ts (which imports the shared Topbar,
// same as every other page) so the global SearchIndex service can import
// this seed data without creating a Topbar -> SearchIndex -> TenantPayments
// -> Topbar circular import.
export type PayStatus = 'Paid' | 'Unpaid' | 'Pending';
export type VerifyResult = 'success' | 'incomplete' | 'no-authority';

export const PAYMENT_BASE_ROWS: Array<{
  id: string;
  applicant: string;
  city: string;
  type: string;
  dateSubmitted: string;
  status: PayStatus;
  verifyResult: VerifyResult;
  method: string;
}> = [
  { id: '#WA-2026', applicant: 'Raul Villa', city: 'Taguig City', type: 'Residential', dateSubmitted: '12 Apr 2024', status: 'Paid', verifyResult: 'success', method: 'Onsite' },
  { id: '#WA-2025', applicant: 'Fea Sims', city: 'Quezon City', type: 'Commercial', dateSubmitted: '24 Apr 2024', status: 'Pending', verifyResult: 'success', method: 'GCash' },
  { id: '#WA-2024', applicant: 'David Roderick', city: 'Pasig City', type: 'Renovation', dateSubmitted: '25 Apr 2024', status: 'Paid', verifyResult: 'success', method: 'Maya' },
  { id: '#WA-2023', applicant: 'James Zavel', city: 'Pasay City', type: 'Renovation', dateSubmitted: '14 Dec 2024', status: 'Paid', verifyResult: 'success', method: 'E-wallet' },
  { id: '#WA-2022', applicant: 'Denese Martin', city: 'Makati City', type: 'Renovation', dateSubmitted: '14 Jan 2024', status: 'Unpaid', verifyResult: 'incomplete', method: 'Maya' },
  { id: '#WA-2021', applicant: 'Jack Nunnally', city: 'Paranaque City', type: 'Renovation', dateSubmitted: '2 Dec 2024', status: 'Pending', verifyResult: 'no-authority', method: 'GCash' },
  { id: '#WA-2020', applicant: 'James Zavel', city: 'Bulacan City', type: 'Residential', dateSubmitted: '14 Dec 2024', status: 'Paid', verifyResult: 'success', method: 'Onsite' },
  { id: '#WA-2019', applicant: 'Anthony Williams', city: 'Mandaluyong City', type: 'Commercial', dateSubmitted: '1 Jul 2024', status: 'Unpaid', verifyResult: 'success', method: 'Maya' },
  { id: '#WA-2018', applicant: 'Axie Barnes', city: 'Marikina City', type: 'Commercial', dateSubmitted: '28 Aug 2024', status: 'Paid', verifyResult: 'success', method: 'E-wallet' },
  { id: '#WA-2017', applicant: 'Glen Morning', city: 'Caloocan City', type: 'Commercial', dateSubmitted: '30 Aug 2024', status: 'Pending', verifyResult: 'incomplete', method: 'Maya' },
];
