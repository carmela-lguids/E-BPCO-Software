import { Component, input } from '@angular/core';

@Component({
  selector: 'app-area-chart',
  imports: [],
  templateUrl: './area-chart.html',
  styleUrl: './area-chart.scss',
})
export class AreaChart {
  readonly yLabels = input<string[]>(['$100k', '$50k', '$25k', '$10k', '0']);
  readonly xLabels = input<string[]>([
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ]);
  readonly highlightXIndex = input<number>(7);
}
