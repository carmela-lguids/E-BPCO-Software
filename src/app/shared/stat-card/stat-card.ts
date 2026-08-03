import { Component, input } from '@angular/core';
import { Icon } from '../icon/icon';

export interface StatDelta {
  text: string;
  direction: 'up' | 'down';
  tone: 'good' | 'bad';
}

@Component({
  selector: 'app-stat-card',
  imports: [Icon],
  templateUrl: './stat-card.html',
  styleUrl: './stat-card.scss',
})
export class StatCard {
  readonly icon = input.required<string>();
  readonly iconBg = input<string>('#2563eb');
  readonly cardTint = input<string>('tint-blue');
  readonly label = input.required<string>();
  readonly value = input.required<string>();
  readonly deltas = input<StatDelta[]>([]);
  readonly footnote = input<string>('');

  /** Full accessible sentence (value + trend + comparison period) for screen
   *  readers — visual deltas convey the same info via icon + color + short
   *  text, which doesn't read as a complete sentence on its own. Leave unset
   *  when the card is wrapped in its own labelled link (Phase 2 dashboards)
   *  so the name isn't announced twice. */
  readonly ariaLabel = input<string>('');
}
