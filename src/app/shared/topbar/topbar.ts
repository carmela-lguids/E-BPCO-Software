import { Component, input } from '@angular/core';
import { Icon } from '../icon/icon';
import { Avatar } from '../avatar/avatar';

@Component({
  selector: 'app-topbar',
  imports: [Icon, Avatar],
  templateUrl: './topbar.html',
  styleUrl: './topbar.scss',
})
export class Topbar {
  readonly title = input.required<string>();
  readonly notificationCount = input<number>(15);
  readonly userName = input<string>('Andy Johnson');
  readonly userRole = input<string>('Super Admin');
}
