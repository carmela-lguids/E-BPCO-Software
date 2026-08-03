import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Topbar } from '../../shared/topbar/topbar';
import { Icon } from '../../shared/icon/icon';
import { Avatar } from '../../shared/avatar/avatar';
import { RoleBadge } from '../../shared/role-badge/role-badge';
import { RoleHistory } from '../../shared/role-history/role-history';
import { ReportIncorrectAssignment } from '../../shared/report-incorrect-assignment/report-incorrect-assignment';
import { Session } from '../../core/session';

interface LoginHistoryEntry {
  timestamp: string;
  device: string;
  result: 'Success' | 'Failed';
}

interface ActiveSession {
  device: string;
  location: string;
  lastActive: string;
  current: boolean;
}

@Component({
  selector: 'app-profile',
  imports: [Topbar, Icon, Avatar, RoleBadge, RoleHistory, ReportIncorrectAssignment, FormsModule],
  templateUrl: './profile.html',
  styleUrl: './profile.scss',
})
export class Profile {
  private readonly session = inject(Session);

  protected readonly account = this.session.currentAccount;

  protected readonly editingContact = signal(false);
  protected contactDraft = '';
  protected readonly notifyEmail = signal(true);
  protected readonly notifySms = signal(false);
  protected readonly reportOpen = signal(false);

  // --- Login history & active sessions (Volume III §05-30 delta) ---
  protected readonly loginHistory: LoginHistoryEntry[] = [
    { timestamp: 'Today, 8:12 AM', device: 'Chrome / Windows', result: 'Success' },
    { timestamp: 'Yesterday, 6:47 PM', device: 'Chrome / Windows', result: 'Success' },
    { timestamp: '3 days ago, 9:03 AM', device: 'Safari / iPhone', result: 'Success' },
    { timestamp: '5 days ago, 11:20 PM', device: 'Unknown device', result: 'Failed' },
  ];

  protected readonly activeSessions = signal<ActiveSession[]>([
    { device: 'Chrome / Windows', location: 'Manila, PH', lastActive: 'Active now', current: true },
    { device: 'Safari / iPhone', location: 'Quezon City, PH', lastActive: '2 hours ago', current: false },
  ]);

  signOutSession(session: ActiveSession): void {
    if (session.current) return;
    this.activeSessions.update((list) => list.filter((s) => s !== session));
  }

  startEditContact(): void {
    this.contactDraft = this.account().contactNumber;
    this.editingContact.set(true);
  }

  saveContact(): void {
    this.session.updateContactNumber(this.contactDraft.trim() || this.account().contactNumber);
    this.editingContact.set(false);
  }

  cancelEditContact(): void {
    this.editingContact.set(false);
  }

  openReport(): void {
    this.reportOpen.set(true);
  }

  closeReport(): void {
    this.reportOpen.set(false);
  }
}
