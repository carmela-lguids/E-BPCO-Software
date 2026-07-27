import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Topbar } from '../../shared/topbar/topbar';
import { Icon } from '../../shared/icon/icon';
import { Avatar } from '../../shared/avatar/avatar';
import { RoleBadge } from '../../shared/role-badge/role-badge';
import { RoleHistory } from '../../shared/role-history/role-history';
import { ReportIncorrectAssignment } from '../../shared/report-incorrect-assignment/report-incorrect-assignment';
import { Session } from '../../core/session';

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
