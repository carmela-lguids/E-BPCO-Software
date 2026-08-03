import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Topbar } from '../../shared/topbar/topbar';
import { Icon } from '../../shared/icon/icon';
import { ReportIncorrectAssignment } from '../../shared/report-incorrect-assignment/report-incorrect-assignment';
import { Session } from '../../core/session';
import { MOCK_ACCOUNTS } from '../../core/mock-accounts';
import { FAQ_ITEMS, FAQ_TOPICS, FaqTopic } from './help-support-data';

type TopicFilter = 'all' | FaqTopic;

@Component({
  selector: 'app-help-support',
  imports: [Topbar, Icon, FormsModule, ReportIncorrectAssignment],
  templateUrl: './help-support.html',
  styleUrl: './help-support.scss',
})
export class HelpSupport {
  private readonly session = inject(Session);

  protected readonly account = this.session.currentAccount;
  protected readonly topics = FAQ_TOPICS;

  protected readonly searchTerm = signal('');
  protected readonly activeTopic = signal<TopicFilter>('all');

  protected readonly filteredFaqs = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const topic = this.activeTopic();
    return FAQ_ITEMS.filter((f) => {
      if (topic !== 'all' && f.topic !== topic) return false;
      if (!term) return true;
      return f.question.toLowerCase().includes(term) || f.answer.toLowerCase().includes(term);
    });
  });

  setTopic(topic: TopicFilter): void {
    this.activeTopic.set(topic);
  }

  // Same escalation-path logic already used by "Report Incorrect Role
  // Assignment" — a tenant role's own Tenant Administrator, or the national
  // Super Administrator / Security Administrator otherwise.
  protected readonly escalationContacts = computed(() => {
    const acct = this.account();
    if (acct.tenant) {
      return MOCK_ACCOUNTS.filter((a) => a.role === 'tenant-admin' && a.tenant === acct.tenant).map((a) => ({
        name: a.fullName,
        role: a.roleLabel,
        email: a.email,
      }));
    }
    const support = MOCK_ACCOUNTS.find((a) => a.role === 'support-admin');
    return support ? [{ name: support.fullName, role: 'Technical Support Administrator', email: support.email }] : [];
  });

  protected readonly contactLabel = computed(() =>
    this.account().tenant ? 'Contact your Tenant Administrator' : 'Contact platform support',
  );

  // --- Report Incorrect Role Assignment (reused component, not duplicated) ---
  protected readonly reportOpen = signal(false);

  openReport(): void {
    this.reportOpen.set(true);
  }

  closeReport(): void {
    this.reportOpen.set(false);
  }

  // --- General support ticket (mock only) ---
  protected ticketSubject = '';
  protected ticketDetails = '';
  protected readonly ticketSubmitted = signal(false);

  // A plain getter, not computed() — ticketSubject/ticketDetails are plain
  // fields updated via [(ngModel)], not signals, so a computed() here would
  // never see them change (see the same fix in ReportIncorrectAssignment).
  protected get canSubmitTicket(): boolean {
    return this.ticketSubject.trim().length > 0 && this.ticketDetails.trim().length > 0;
  }

  submitTicket(): void {
    if (!this.canSubmitTicket) return;
    this.ticketSubmitted.set(true);
  }

  newTicket(): void {
    this.ticketSubject = '';
    this.ticketDetails = '';
    this.ticketSubmitted.set(false);
  }
}
