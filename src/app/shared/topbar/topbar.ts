import { Component, inject, input } from '@angular/core';
import { Icon } from '../icon/icon';
import { Avatar } from '../avatar/avatar';
import { Session } from '../../core/session';

@Component({
  selector: 'app-topbar',
  imports: [Icon, Avatar],
  templateUrl: './topbar.html',
  styleUrl: './topbar.scss',
})
export class Topbar {
  private readonly session = inject(Session);

  readonly title = input.required<string>();
  readonly notificationCount = input<number>(15);

  // Who's "logged in" is derived from the active mock account, not passed
  // in per-page — every page shows the same real (mock) identity.
  protected readonly account = this.session.currentAccount;
}
