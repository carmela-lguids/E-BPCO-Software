import { Component, input } from '@angular/core';

export interface LollipopDot {
  top: number;
  color: string;
}

export interface LollipopCategory {
  label: string;
  dots: LollipopDot[];
}

@Component({
  selector: 'app-lollipop-chart',
  imports: [],
  templateUrl: './lollipop-chart.html',
  styleUrl: './lollipop-chart.scss',
})
export class LollipopChart {
  readonly categories = input.required<LollipopCategory[]>();
  readonly height = input<number>(190);
}
