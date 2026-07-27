import { Component, inject } from '@angular/core';
import { Icon } from '../icon/icon';
import { Session } from '../../core/session';

@Component({
  selector: 'app-impersonation-banner',
  imports: [Icon],
  templateUrl: './impersonation-banner.html',
  styleUrl: './impersonation-banner.scss',
})
export class ImpersonationBanner {
  private readonly session = inject(Session);

  protected readonly impersonating = this.session.impersonating;

  end(): void {
    this.session.endImpersonation();
  }
}
