import { Component, computed, input } from '@angular/core';

interface RingNode {
  x: number;
  y: number;
  rotation: number;
  type: 'shield' | 'person';
}

const RING_COUNT = 28;
const RING_RADIUS = 83;

function buildRingNodes(): RingNode[] {
  return Array.from({ length: RING_COUNT }, (_, i) => {
    const angleDeg = (360 / RING_COUNT) * i - 90;
    const angleRad = (angleDeg * Math.PI) / 180;
    return {
      x: 100 + RING_RADIUS * Math.cos(angleRad),
      y: 100 + RING_RADIUS * Math.sin(angleRad),
      rotation: angleDeg + 90,
      type: i % 2 === 0 ? 'shield' : ('person' as 'shield' | 'person'),
    };
  });
}

@Component({
  selector: 'app-dilg-seal',
  imports: [],
  templateUrl: './dilg-seal.html',
  styleUrl: './dilg-seal.scss',
})
export class DilgSeal {
  readonly size = input<number>(96);

  protected readonly ringNodes = computed(() => buildRingNodes());
}
