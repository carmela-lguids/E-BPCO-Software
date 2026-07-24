import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Icon } from '../../shared/icon/icon';
import { Session } from '../../core/session';
import { ROLES } from '../../core/roles';

@Component({
  selector: 'app-access-denied',
  imports: [Icon],
  templateUrl: './access-denied.html',
  styleUrl: './access-denied.scss',
})
export class AccessDenied {
  private readonly session = inject(Session);
  private readonly router = inject(Router);

  protected readonly account = this.session.currentAccount;

  goToMyDashboard(): void {
    this.router.navigateByUrl(ROLES[this.account().role].landingPath);
  }
}
