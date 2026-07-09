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
}
