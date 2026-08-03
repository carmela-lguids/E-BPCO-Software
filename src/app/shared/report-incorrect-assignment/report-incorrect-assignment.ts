import { Component, computed, inject, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Session } from '../../core/session';
import { MOCK_ACCOUNTS } from '../../core/mock-accounts';

@Component({
  selector: 'app-report-incorrect-assignment',
  imports: [FormsModule],
  templateUrl: './report-incorrect-assignment.html',
  styleUrl: './report-incorrect-assignment.scss',
})
export class ReportIncorrectAssignment {
  private readonly session = inject(Session);

  readonly closed = output<void>();

  protected readonly account = this.session.currentAccount;
  protected readonly submitted = signal(false);

  protected expectedRole = '';
  protected expectedDepartment = '';
  protected description = '';
  protected note = '';

  // Who to contact — computed, never chosen by the reporting user.
  protected readonly administrators = computed(() => {
    const acct = this.account();
    if (acct.tenant) {
      const tenantAdmins = MOCK_ACCOUNTS.filter(
        (a) => a.role === 'tenant-admin' && a.tenant === acct.tenant,
      );
      return tenantAdmins.map((a) => `${a.roleLabel} — ${a.fullName}`);
    }
    const superAdmin = MOCK_ACCOUNTS.find((a) => a.role === 'super-admin');
    const securityAdmin = MOCK_ACCOUNTS.find((a) => a.role === 'security-admin');
    return [
      superAdmin ? `Super Administrator — ${superAdmin.fullName}` : 'Super Administrator',
      securityAdmin ? `Security Administrator — ${securityAdmin.fullName}` : 'Security Administrator',
    ];
  });

  // A plain getter, not computed() — description/expectedRole/etc. are plain
  // fields updated via [(ngModel)], not signals, so a computed() here would
  // never see them change and would stay stuck at its first-ever result.
  protected get canSubmit(): boolean {
    return this.description.trim().length > 0;
  }

  submit(): void {
    if (!this.canSubmit) return;
    const acct = this.account();
    this.session.reportIncorrectAssignment({
      currentRole: acct.roleLabel,
      expectedRole: this.expectedRole,
      currentDepartment: acct.department,
      expectedDepartment: this.expectedDepartment,
      currentTenant: acct.tenant,
      description: this.description,
      note: this.note,
      submittedAt: 'Just now',
    });
    this.submitted.set(true);
  }

  close(): void {
    this.closed.emit();
  }
}
