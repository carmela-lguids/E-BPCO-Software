export interface FaqItem {
  question: string;
  answer: string;
  topic: FaqTopic;
}

export type FaqTopic = 'Account & Access' | 'Applications' | 'Payments' | 'Inspections';

export const FAQ_TOPICS: FaqTopic[] = ['Account & Access', 'Applications', 'Payments', 'Inspections'];

export const FAQ_ITEMS: FaqItem[] = [
  {
    topic: 'Account & Access',
    question: 'I can\'t find a module I need in the sidebar.',
    answer:
      'Your sidebar only shows what your role has access to — it never displays a module you can\'t open. If you believe your role is wrong, use "Report Incorrect Role Assignment" below.',
  },
  {
    topic: 'Account & Access',
    question: 'How do I change my contact number or password?',
    answer: 'Open My Profile from the account menu in the top right — contact details and password are editable there.',
  },
  {
    topic: 'Account & Access',
    question: 'What does the status dot on my avatar mean?',
    answer:
      'Green means your account is active. Amber means you still need to confirm your first login. Red means the account has been suspended or reported and needs administrator review.',
  },
  {
    topic: 'Applications',
    question: 'Why is an application stuck at one stage?',
    answer:
      'Check the Workflow Monitor — a stage flagged "Bottleneck" has applications sitting past its target processing time. Tenant Administrators can reassign from the Applications → Unassigned tab.',
  },
  {
    topic: 'Applications',
    question: 'How do I see which documents are missing?',
    answer: 'Open the application, then the Documents tab — each file shows Approved, Rejected, Missing, or Pending.',
  },
  {
    topic: 'Payments',
    question: 'A payment shows as pending — what do I do?',
    answer: 'Cashiers verify payments from the Payments queue. Once verified, the application automatically advances to permit generation.',
  },
  {
    topic: 'Payments',
    question: 'Can a verified payment be corrected?',
    answer: 'Not from this screen yet — contact your Tenant Administrator for a manual adjustment.',
  },
  {
    topic: 'Inspections',
    question: 'How do I reschedule an inspection?',
    answer: 'Open the inspection from the Inspections queue and update its scheduled date — the applicant is notified automatically.',
  },
  {
    topic: 'Inspections',
    question: 'What happens after a failed inspection?',
    answer: 'The application returns to "Needs Correction." The applicant must address the findings before a re-inspection can be scheduled.',
  },
];
