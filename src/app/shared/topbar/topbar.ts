import { Component, computed, inject, input, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Icon } from '../icon/icon';
import { Avatar } from '../avatar/avatar';
import { RoleBadge } from '../role-badge/role-badge';
import { Session } from '../../core/session';
import { UiState } from '../../core/ui-state';

@Component({
  selector: 'app-topbar',
  imports: [Icon, Avatar, RoleBadge, RouterLink],
  templateUrl: './topbar.html',
  styleUrl: './topbar.scss',
})
export class Topbar {
  private readonly session = inject(Session);
  private readonly router = inject(Router);
  protected readonly uiState = inject(UiState);

  readonly title = input.required<string>();
  readonly notificationCount = input<number>(15);

  // Who's "logged in" is derived from the active mock account, not passed
  // in per-page — every page shows the same real (mock) identity.
  protected readonly account = this.session.currentAccount;
  protected readonly orgLabel = computed(() => this.account().tenant ?? 'National Administration');

  protected readonly menuOpen = signal(false);

  toggleMenu(): void {
    this.menuOpen.update((v) => !v);
  }

  closeMenu(): void {
    this.menuOpen.set(false);
  }

  signOut(): void {
    this.menuOpen.set(false);
    this.router.navigateByUrl('/login');
  }
}
