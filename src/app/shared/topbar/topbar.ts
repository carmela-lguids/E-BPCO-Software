import { Component, ElementRef, HostListener, computed, inject, input, signal, viewChild } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Icon } from '../icon/icon';
import { Avatar } from '../avatar/avatar';
import { RoleBadge } from '../role-badge/role-badge';
import { Session } from '../../core/session';
import { UiState } from '../../core/ui-state';
import { Notifications } from '../../core/notifications';
import { ROLES } from '../../core/roles';
import { SearchIndex, SearchResult } from '../../core/search-index';

@Component({
  selector: 'app-topbar',
  imports: [Icon, Avatar, RoleBadge, RouterLink, FormsModule],
  templateUrl: './topbar.html',
  styleUrl: './topbar.scss',
})
export class Topbar {
  private readonly session = inject(Session);
  private readonly router = inject(Router);
  private readonly searchIndex = inject(SearchIndex);
  protected readonly uiState = inject(UiState);
  protected readonly notifications = inject(Notifications);

  readonly title = input.required<string>();

  // Set by pages with more than one level of drill-down (Applications,
  // Evaluations) so the last "Back" button isn't the only way to tell where
  // you are or jump back more than one level. Empty by default — most pages
  // are one level deep and don't need it.
  readonly crumbs = input<{ label: string; action?: () => void }[]>([]);

  // Who's "logged in" is derived from the active mock account, not passed
  // in per-page — every page shows the same real (mock) identity.
  protected readonly account = this.session.currentAccount;
  protected readonly orgLabel = computed(() => this.account().tenant ?? 'National Administration');

  // Profile / My Access / Notifications live at different route prefixes in
  // each portal (/profile vs /tenant/profile) — derive the prefix from the
  // signed-in role's own portal group rather than hardcoding one, so these
  // links resolve correctly regardless of which layout the topbar is in.
  protected readonly portalBase = computed(() =>
    ROLES[this.account().role].group === 'tenant-admin' ? '/tenant' : '',
  );

  protected readonly menuOpen = signal(false);
  protected readonly notifOpen = signal(false);

  protected readonly recentNotifications = computed(() =>
    this.notifications.forCurrentRole().slice(0, 5),
  );

  toggleMenu(): void {
    this.notifOpen.set(false);
    this.menuOpen.update((v) => !v);
  }

  closeMenu(): void {
    this.menuOpen.set(false);
  }

  toggleNotif(): void {
    this.menuOpen.set(false);
    this.notifOpen.update((v) => !v);
  }

  closeNotif(): void {
    this.notifOpen.set(false);
  }

  openNotification(id: string, route: string | undefined): void {
    this.notifications.markRead(id);
    this.notifOpen.set(false);
    if (route) {
      this.router.navigateByUrl(route);
    }
  }

  markAllRead(): void {
    this.notifications.markAllRead();
  }

  signOut(): void {
    this.menuOpen.set(false);
    this.router.navigateByUrl('/login');
  }

  // --- Global search (Ctrl/Cmd+K) ---
  protected readonly searchInputRef = viewChild<ElementRef<HTMLInputElement>>('searchInput');
  protected readonly searchTerm = signal('');
  protected readonly searchOpen = signal(false);
  protected readonly recentSearches = this.searchIndex.recentSearches;
  protected readonly recentlyViewed = this.searchIndex.recentlyViewed;

  protected readonly searchResults = computed<SearchResult[]>(() =>
    this.searchIndex.search(this.searchTerm(), 8),
  );

  @HostListener('window:keydown', ['$event'])
  onWindowKeydown(event: KeyboardEvent): void {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      this.searchInputRef()?.nativeElement.focus();
      this.searchOpen.set(true);
    }
    if (event.key === 'Escape' && this.searchOpen()) {
      this.closeSearch();
    }
  }

  onSearchFocus(): void {
    this.menuOpen.set(false);
    this.notifOpen.set(false);
    this.searchOpen.set(true);
  }

  onSearchInput(value: string): void {
    this.searchTerm.set(value);
  }

  closeSearch(): void {
    this.searchOpen.set(false);
  }

  selectSearchResult(result: SearchResult): void {
    this.searchIndex.rememberSearch(this.searchTerm());
    this.searchTerm.set('');
    this.closeSearch();
    this.router.navigateByUrl(result.route);
  }

  runRecentSearch(term: string): void {
    this.searchTerm.set(term);
  }
}
