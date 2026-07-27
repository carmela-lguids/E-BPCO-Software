import { Injectable, signal } from '@angular/core';

// Frontend-only UI state — currently just whether the off-canvas mobile
// sidebar drawer is open. Lives here (not on Sidebar itself) because the
// control that opens it (the topbar hamburger) and the drawer that responds
// to it are siblings in the component tree, not parent/child.
@Injectable({ providedIn: 'root' })
export class UiState {
  private readonly _sidebarOpen = signal(false);
  readonly sidebarOpen = this._sidebarOpen.asReadonly();

  toggleSidebar(): void {
    this._sidebarOpen.update((v) => !v);
  }

  closeSidebar(): void {
    this._sidebarOpen.set(false);
  }
}
