import { Component, computed, input } from '@angular/core';

export interface DonutSegment {
  label: string;
  value: number;
  color: string;
}

interface DonutLabel {
  x: number;
  y: number;
  text: string;
  color: string;
}

@Component({
  selector: 'app-donut-chart',
  imports: [],
  templateUrl: './donut-chart.html',
  styleUrl: './donut-chart.scss',
})
export class DonutChart {
  readonly segments = input.required<DonutSegment[]>();
  readonly size = input<number>(200);
  readonly holeColor = input<string>('#fff');
  readonly showLabels = input<boolean>(true);
  readonly ringWidth = input<number>(21);

  protected readonly total = computed(() =>
    this.segments().reduce((sum, s) => sum + s.value, 0),
  );

  protected readonly conicGradient = computed(() => {
    const total = this.total();
    let cumulative = 0;
    const stops = this.segments().map((s) => {
      const start = (cumulative / total) * 100;
      cumulative += s.value;
      const end = (cumulative / total) * 100;
      return `${s.color} ${start}% ${end}%`;
    });
    return `conic-gradient(${stops.join(', ')})`;
  });

  protected readonly labelPositions = computed<DonutLabel[]>(() => {
    const total = this.total();
    let cumulative = 0;
    return this.segments().map((s) => {
      const startPct = cumulative;
      cumulative += s.value;
      const midPct = startPct + s.value / 2;
      const angleDeg = -90 + (midPct / total) * 360;
      const angleRad = (angleDeg * Math.PI) / 180;
      const r = 0.68;
      return {
        x: 50 + 50 * r * Math.cos(angleRad),
        y: 50 + 50 * r * Math.sin(angleRad),
        text: `${Math.round((s.value / total) * 100)}%`,
        color: s.color,
      };
    });
  });
}
