import { Component, inject } from '@angular/core';
import { Icon } from '../icon/icon';
import { Toast as ToastService } from '../../core/toast';

@Component({
  selector: 'app-toast-host',
  imports: [Icon],
  templateUrl: './toast.html',
  styleUrl: './toast.scss',
})
export class ToastHost {
  protected readonly toast = inject(ToastService);
}
