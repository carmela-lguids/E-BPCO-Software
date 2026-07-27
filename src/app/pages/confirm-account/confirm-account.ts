import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthLayout } from '../../shared/auth-layout/auth-layout';
import { DilgSeal } from '../../shared/dilg-seal/dilg-seal';
import { RoleBadge } from '../../shared/role-badge/role-badge';
import { ReportIncorrectAssignment } from '../../shared/report-incorrect-assignment/report-incorrect-assignment';
import { Session } from '../../core/session';
import { resolveLandingRoute } from '../../core/verification-flow';

@Component({
  selector: 'app-confirm-account',
  imports: [AuthLayout, DilgSeal, RoleBadge, ReportIncorrectAssignment],
  templateUrl: './confirm-account.html',
  styleUrl: './confirm-account.scss',
})
export class ConfirmAccount {
  private readonly session = inject(Session);
  private readonly router = inject(Router);

  protected readonly account = this.session.currentAccount;
  protected readonly confirmed = signal(false);
  protected readonly reportOpen = signal(false);

  confirm(): void {
    this.session.confirmAccount();
    this.confirmed.set(true);
  }

  continue(): void {
    this.router.navigateByUrl(resolveLandingRoute(this.session.currentAccount()));
  }

  openReport(): void {
    this.reportOpen.set(true);
  }

  closeReport(): void {
    this.reportOpen.set(false);
  }
}
