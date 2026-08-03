import { Component, input } from '@angular/core';

export interface QueueTile {
  label: string;
  value: string;
  tone?: 'default' | 'warn' | 'good';
}

// A compact, role-personalized summary shown above a list page's existing
// page-wide stats — for the roles whose landing route IS this list page
// (Cashier, Inspector, Releasing, Records, and the evaluator roles), so
// opening the app shows "what's mine today" before the full table. Reuses
// the same tile look already proven on the five roles that have a full
// dashboard, just condensed to 2-4 tiles instead of a whole page.
@Component({
  selector: 'app-my-queue-strip',
  imports: [],
  templateUrl: './my-queue-strip.html',
  styleUrl: './my-queue-strip.scss',
})
export class MyQueueStrip {
  readonly heading = input<string>('Your Queue');
  readonly tiles = input.required<QueueTile[]>();
}
