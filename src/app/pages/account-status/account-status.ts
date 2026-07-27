import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Icon } from '../../shared/icon/icon';
import { Session } from '../../core/session';

type Variant = 'suspended' | 'inactive' | 'tenant-inactive';

interface VariantCopy {
  icon: string;
  tone: 'danger' | 'neutral' | 'info';
  heading: string;
  message: string;
  action: string;
}

const COPY: Record<Variant, VariantCopy> = {
  suspended: {
    icon: 'lock',
    tone: 'danger',
    heading: 'Account Suspended',
    message: 'Your account has been suspended. Contact your administrator.',
    action: 'Contact Administrator',
  },
  inactive: {
    icon: 'alert-circle',
    tone: 'neutral',
    heading: 'Account Inactive',
    message: 'This account is currently inactive.',
    action: 'Contact Administrator',
  },
  'tenant-inactive': {
    icon: 'building',
    tone: 'info',
    heading: 'Tenant Workspace Inactive',
    message: 'This LGU workspace is currently inactive. Contact the national administrator.',
    action: 'Contact National Administrator',
  },
};

// One shared screen for the three "locked out" account states — the exact
// message and tone change by route data, the shell (no sidebar/topbar,
// mock-only "contact" action) stays the same. See Identity memo §14.
@Component({
  selector: 'app-account-status',
  imports: [Icon],
  templateUrl: './account-status.html',
  styleUrl: './account-status.scss',
})
export class AccountStatus {
  private readonly route = inject(ActivatedRoute);
  private readonly session = inject(Session);

  protected readonly account = this.session.currentAccount;

  protected readonly copy = computed<VariantCopy>(() => {
    const variant = (this.route.snapshot.data['variant'] as Variant) ?? 'inactive';
    return COPY[variant];
  });

  protected readonly contacted = signal(false);

  contactAdministrator(): void {
    this.contacted.set(true);
  }
}
