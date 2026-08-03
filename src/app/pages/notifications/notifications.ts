import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Topbar } from '../../shared/topbar/topbar';
import { Icon } from '../../shared/icon/icon';
import { EmptyState } from '../../shared/empty-state/empty-state';
import { AppNotification, NotificationType, Notifications } from '../../core/notifications';

const TYPE_LABEL: Record<NotificationType, string> = {
  assignment: 'Assignments',
  payment: 'Payments',
  evaluation: 'Evaluations',
  inspection: 'Inspections',
  permit: 'Permits',
  records: 'Records',
  system: 'System',
  security: 'Security',
};

type FilterKey = 'all' | 'unread' | NotificationType;

@Component({
  selector: 'app-notifications',
  imports: [Topbar, Icon, EmptyState],
  templateUrl: './notifications.html',
  styleUrl: './notifications.scss',
})
export class NotificationsPage {
  private readonly router = inject(Router);
  protected readonly notifications = inject(Notifications);

  protected readonly activeFilter = signal<FilterKey>('all');

  // Only offer chips for the types this role actually receives, in a stable
  // order, rather than a fixed list that would sit empty for most roles.
  protected readonly typeChips = computed<{ key: NotificationType; label: string }[]>(() => {
    const present = new Set(this.notifications.forCurrentRole().map((n) => n.type));
    return (Object.keys(TYPE_LABEL) as NotificationType[])
      .filter((t) => present.has(t))
      .map((t) => ({ key: t, label: TYPE_LABEL[t] }));
  });

  protected readonly filtered = computed<AppNotification[]>(() => {
    const filter = this.activeFilter();
    const all = this.notifications.forCurrentRole();
    if (filter === 'all') return all;
    if (filter === 'unread') return all.filter((n) => !n.read);
    return all.filter((n) => n.type === filter);
  });

  setFilter(key: FilterKey): void {
    this.activeFilter.set(key);
  }

  iconFor(type: NotificationType): string {
    return this.notifications.iconFor(type);
  }

  open(n: AppNotification): void {
    this.notifications.markRead(n.id);
    if (n.relatedRoute) {
      this.router.navigateByUrl(n.relatedRoute);
    }
  }

  markAllRead(): void {
    this.notifications.markAllRead();
  }
}
