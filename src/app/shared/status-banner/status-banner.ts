import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Icon } from '../icon/icon';
import { Session } from '../../core/session';

// Shows a persistent, dismiss-free notice whenever the logged-in account is
// in the 'Reported' state — the dashboard stays reachable (read-only), but
// the user is reminded their assignment report is still under review.
@Component({
  selector: 'app-status-banner',
  imports: [Icon, RouterLink],
  templateUrl: './status-banner.html',
  styleUrl: './status-banner.scss',
})
export class StatusBanner {
  private readonly session = inject(Session);

  protected readonly account = this.session.currentAccount;
}
