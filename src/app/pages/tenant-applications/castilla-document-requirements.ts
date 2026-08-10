// Phase 3 (Castilla Document Requirements) — structured document-requirement
// groups, transcribed from the actual Municipality of Castilla (Sorsogon)
// document checklists provided for this project:
//   - "Checklist (Building Permit & Occupancy)" (Office of the Municipal
//     Engineer) — the master BP/CO documentary requirements list.
//   - "Zoning Checklist" / "Zoning-Locational Form" (Municipal Planning and
//     Development Office / Office of the Zoning Administrator).
//   - "FSEC-for-Building-Permit" / "FSIC-for-Occupancy-Permit" (Bureau of
//     Fire Protection, Castilla Fire Station).
//   - The individual ancillary permit forms (Electrical, Plumbing,
//     Mechanical, Sanitary, Civil/Structural, Electronics, Excavation,
//     Fencing) and the Unified Application Form for Building Permit.
// Every item below traces to one of those documents. Nothing here is
// invented — where the source marks an item "(if applicable)" / "(if
// necessary)" it is carried over as `conditional: true`, not silently
// dropped or silently made mandatory.

export type CastillaGroupKey =
  | 'property-ownership'
  | 'technical-plans'
  | 'professional-credentials'
  | 'ancillary-permits'
  | 'zoning-locational-clearance'
  | 'fsec'
  | 'other-regulatory-clearances'
  | 'occupancy-requirements'
  | 'fsic';

export type CastillaPermitTrack = 'building-permit' | 'occupancy';

export interface CastillaRequirementItem {
  name: string;
  /** Copy count as stated on the source form, e.g. "4 Copies" — omitted
   *  where the source form doesn't specify one. */
  copies?: string;
  /** True only where the source form itself marks the item conditional
   *  ("if applicable" / "if necessary") — never inferred. */
  conditional?: boolean;
  /** Which Castilla office/form this item is drawn from, for traceability
   *  back to the source checklist. */
  sourceForm: string;
}

export interface CastillaRequirementGroup {
  key: CastillaGroupKey;
  label: string;
  /** Which permit transaction this group belongs to (Phase 4 will use this
   *  to actually separate Building Permit and Certificate of Occupancy as
   *  distinct workflows — Phase 3 only structures the data). */
  permitTrack: CastillaPermitTrack;
  items: CastillaRequirementItem[];
}

export const CASTILLA_REQUIREMENT_GROUPS: CastillaRequirementGroup[] = [
  {
    key: 'property-ownership',
    label: 'Property / Ownership Documents',
    permitTrack: 'building-permit',
    items: [
      { name: 'Certified True Copy of OCT/TCT', copies: '2 Copies', sourceForm: 'MEO Building Permit Checklist' },
      { name: 'Deed of Sale, Deed of Donation, Lease Contract, Assignment of Rights, or other valid proof of ownership', sourceForm: 'MEO Building Permit Checklist' },
      { name: 'Valid ID of Applicant and Owner of Lot', sourceForm: 'MEO Building Permit Checklist' },
    ],
  },
  {
    key: 'technical-plans',
    label: 'Technical Plans',
    permitTrack: 'building-permit',
    items: [
      { name: 'Survey Plan', copies: '4 Copies', sourceForm: 'MEO Building Permit Checklist' },
      { name: 'Design Plans (Duly signed & sealed)', copies: '4 Copies', sourceForm: 'MEO Building Permit Checklist' },
      { name: 'Cost Estimate (Duly signed & sealed)', copies: '4 Copies', sourceForm: 'MEO Building Permit Checklist' },
      { name: 'Technical Specifications (Duly signed & sealed)', copies: '4 Copies', sourceForm: 'MEO Building Permit Checklist' },
      { name: 'Structural Design & Analysis', copies: '2 Copies', sourceForm: 'MEO Building Permit Checklist' },
      { name: 'Soil Analysis / Plate Load Test / Seismic Analysis', copies: '2 Copies', sourceForm: 'MEO Building Permit Checklist' },
    ],
  },
  {
    key: 'professional-credentials',
    label: 'Professional Credentials',
    permitTrack: 'building-permit',
    items: [
      { name: 'Valid Licenses of all involved professionals (PRC/PTR)', copies: '4 Copies', sourceForm: 'MEO Building Permit Checklist' },
    ],
  },
  {
    key: 'ancillary-permits',
    label: 'Ancillary Permits',
    permitTrack: 'building-permit',
    items: [
      { name: 'Unified Building Permit Form', copies: '4 Copies', sourceForm: 'Unified Application Form for Building Permit' },
      { name: 'Architectural Permit', sourceForm: 'MEO Building Permit Checklist' },
      { name: 'Civil/Structural Permit', sourceForm: 'NBC Form A-02' },
      { name: 'Electrical Permit', sourceForm: 'NBC Form A-03' },
      { name: 'Mechanical Permit', sourceForm: 'NBC Form A-04' },
      { name: 'Sanitary/Plumbing Permit', sourceForm: 'NBC Form A-05 / A-06' },
      { name: 'Electronics Permit', sourceForm: 'NBC Form A-07' },
      { name: 'Excavation Permit', sourceForm: 'NBC Form B-02' },
      { name: 'Fencing Permit', conditional: true, sourceForm: 'NBC Form B-03' },
    ],
  },
  {
    key: 'zoning-locational-clearance',
    label: 'Zoning / Locational Clearance',
    permitTrack: 'building-permit',
    items: [
      { name: 'Notarized letter request addressed to the Zoning Administrator', sourceForm: 'MPDO Zoning Checklist' },
      { name: 'Site Development Plan', sourceForm: 'MPDO Zoning Checklist' },
      { name: 'Vicinity Map', sourceForm: 'MPDO Zoning Checklist' },
      { name: 'Tax Declaration / COT / OCT', sourceForm: 'MPDO Zoning Checklist' },
      { name: 'Land Tax Receipt (Current Year)', sourceForm: 'MPDO Zoning Checklist' },
      { name: 'Sketch Plan of the House', sourceForm: 'MPDO Zoning Checklist' },
      { name: 'Barangay Building Clearance', sourceForm: 'MPDO Zoning Checklist' },
      { name: 'Bill of Materials', sourceForm: 'MPDO Zoning Checklist' },
      { name: 'Cedula (Photocopy)', sourceForm: 'MPDO Zoning Checklist' },
      { name: 'DPWH Clearance', conditional: true, sourceForm: 'MPDO Zoning Checklist' },
      { name: 'ECC (Environmental Compliance Certificate)', conditional: true, sourceForm: 'MPDO Zoning Checklist' },
    ],
  },
  {
    key: 'fsec',
    label: 'FSEC (Fire Safety Evaluation Clearance)',
    permitTrack: 'building-permit',
    items: [
      { name: 'Fire Safety Evaluation Clearance (BFP)', sourceForm: 'MEO Building Permit Checklist' },
      { name: 'Architectural, Civil/Structural, Electrical, Mechanical, Plumbing, Electronics, Sanitary, and Fire Protection documents', copies: '3 Complete Sets', sourceForm: 'BFP FSEC Application Form' },
      { name: 'Fire Safety Compliance Report (FSCR)', conditional: true, sourceForm: 'BFP FSEC Application Form' },
      { name: 'Cost Estimates of the building (signed, sealed & notarized)', copies: '1 Set', sourceForm: 'BFP FSEC Application Form' },
      { name: 'Fire Safety Clearance for Welding, Cutting, and Other Hot Work Operations', conditional: true, sourceForm: 'BFP FSEC Application Form' },
    ],
  },
  {
    key: 'other-regulatory-clearances',
    label: 'Other Regulatory Clearances',
    permitTrack: 'building-permit',
    items: [
      { name: 'Approved Construction Safety & Health Program (DOLE)', sourceForm: 'MEO Building Permit Checklist' },
      { name: 'Road Clearance (DPWH/PEO)', sourceForm: 'MEO Building Permit Checklist' },
    ],
  },
  {
    key: 'occupancy-requirements',
    label: 'Occupancy Requirements',
    permitTrack: 'occupancy',
    items: [
      { name: 'Unified Form for Certificate of Occupancy', copies: '4 Copies', sourceForm: 'MEO Building Permit Checklist' },
      { name: 'Certificate of Completion (Duly Notarized & signed & sealed)', copies: '4 Copies', sourceForm: 'MEO Building Permit Checklist' },
      { name: 'Approved Plan', sourceForm: 'MEO Building Permit Checklist' },
      { name: 'Approved Specifications', sourceForm: 'MEO Building Permit Checklist' },
      { name: 'Construction Logbook', sourceForm: 'MEO Building Permit Checklist' },
      { name: 'Photographs of Structure (All Sides)', copies: '4 Copies', sourceForm: 'MEO Building Permit Checklist' },
      { name: 'Valid Licenses of all involved professionals', copies: '3 Copies', sourceForm: 'MEO Building Permit Checklist' },
      { name: 'As-Built Plans (in case of changes in the building)', copies: '4 Copies', conditional: true, sourceForm: 'MEO Building Permit Checklist' },
    ],
  },
  // Phase 4 (Castilla-based BP/CO separation) — kept as its own group,
  // deliberately not folded into Occupancy Requirements above: the BFP
  // FSIC form ("FIRE SAFETY INSPECTION CERTIFICATE APPLICATION FORM") is a
  // distinct post-construction inspection clearance, not the same
  // transaction as the plan-evaluation-stage FSEC (Building Permit group
  // above). Only the "FSIC FOR CERTIFICATE OF OCCUPANCY" half of that form
  // is used here — its "FSIC FOR BUSINESS PERMIT" half is a different
  // transaction (business permit renewal) outside Building Permit/
  // Occupancy scope, so it is not included.
  {
    key: 'fsic',
    label: 'FSIC (Fire Safety Inspection Certificate)',
    permitTrack: 'occupancy',
    items: [
      { name: 'Endorsement from Office of the Building Official (OBO)', sourceForm: 'BFP FSIC Application Form' },
      { name: 'Certificate of Completion', sourceForm: 'BFP FSIC Application Form' },
      { name: 'Certified True Copy of Assessment Fee for Certificate of Occupancy from OBO', sourceForm: 'BFP FSIC Application Form' },
      { name: 'As-Built Plan', conditional: true, sourceForm: 'BFP FSIC Application Form' },
      { name: 'Fire Safety Compliance and Commissioning Report (FSCCR)', copies: '1 Copy', conditional: true, sourceForm: 'BFP FSIC Application Form' },
    ],
  },
];

export function castillaGroupsForTrack(track: CastillaPermitTrack): CastillaRequirementGroup[] {
  return CASTILLA_REQUIREMENT_GROUPS.filter((g) => g.permitTrack === track);
}
