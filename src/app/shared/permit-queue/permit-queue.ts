import { LollipopCategory } from '../lollipop-chart/lollipop-chart';

export const PERMIT_LABELS = [
  'Building Permit',
  'Architectural Permit',
  'Civil Permit',
  'Certificate of Completion',
  'Plumbing Permit',
  'Demolition Permit',
  'Electrical Permit',
  'Electronics Permit',
  'EGP Permit',
  'Fencing Permit',
  'Mechanical Permit',
  'Sanitary Permit',
  'Scaffolding Permit',
  'Sidewalk Construction Permit',
  'Sign Permit',
  'Temporary Sidewalk Permit',
];

export const QUEUE_COLORS = ['#f5b528', '#22c55e', '#ef4444'];

export function buildPermitQueue(): LollipopCategory[] {
  return PERMIT_LABELS.map((label, i) => {
    const order = [0, 1, 2];
    const rotated = order.slice(i % 3).concat(order.slice(0, i % 3));
    const spread = [22, 46, 72].map((base, j) => base + (((i * 13 + j * 7) % 9) - 4));
    return {
      label,
      dots: rotated.map((colorIndex, slot) => ({
        top: spread[slot],
        color: QUEUE_COLORS[colorIndex],
      })),
    };
  });
}
