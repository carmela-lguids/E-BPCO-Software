import { Component, input } from '@angular/core';

@Component({
  selector: 'app-dilg-seal',
  imports: [],
  templateUrl: './dilg-seal.html',
  styleUrl: './dilg-seal.scss',
})
export class DilgSeal {
  readonly size = input<number>(96);
}
