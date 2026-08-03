import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Topbar } from '../../shared/topbar/topbar';
import { Icon } from '../../shared/icon/icon';
import { Session } from '../../core/session';
import { ROLES } from '../../core/roles';
import { TENANT_STATUS } from '../../core/mock-accounts';
import {
  SettingsTab,
  ModuleToggle,
  TENANT_FEE_SUMMARY,
  defaultTenantModules,
} from './system-settings-data';

@Component({
  selector: 'app-system-settings',
  imports: [Topbar, Icon, FormsModule],
  templateUrl: './system-settings.html',
  styleUrl: './system-settings.scss',
})
export class SystemSettings {
  private readonly session = inject(Session);

  protected readonly isNationalRole = computed(
    () => ROLES[this.session.currentAccount().role].group === 'super-admin',
  );

  protected readonly tenantNames = Object.keys(TENANT_STATUS);
  protected readonly selectedTenant = signal(this.tenantNames[0]);

  protected readonly activeTab = signal<SettingsTab>('general');
  protected readonly feeSummary = TENANT_FEE_SUMMARY;

  protected readonly tabs = computed(() => {
    const base: { key: SettingsTab; label: string }[] = [{ key: 'general', label: 'General' }];
    if (!this.isNationalRole()) base.push({ key: 'fees', label: 'Fees & Schedules' });
    base.push({ key: 'notifications', label: 'Notifications' }, { key: 'modules', label: 'Modules' });
    return base;
  });

  setTab(tab: SettingsTab): void {
    this.activeTab.set(tab);
  }

  setSelectedTenant(name: string): void {
    this.selectedTenant.set(name);
  }

  // --- General ---
  protected readonly orgName = signal(
    this.isNationalRole() ? 'DILG E-BPCO Platform' : this.session.currentAccount().tenant ?? '',
  );
  protected readonly contactEmail = signal('support@ebpco.gov.ph');
  protected readonly locale = signal('en-PH (Asia/Manila)');
  protected readonly saveToast = signal<string | null>(null);

  saveGeneral(): void {
    this.flashSaved();
  }

  private flashSaved(): void {
    this.saveToast.set('Saved');
    setTimeout(() => this.saveToast.set(null), 2000);
  }

  // --- Notifications (tenant/platform defaults, distinct from a user's own
  // personal preferences on My Profile) ---
  protected readonly notifyAssignments = signal(true);
  protected readonly notifyPayments = signal(true);
  protected readonly notifyOverdue = signal(true);
  protected readonly digestEmail = signal(false);

  saveNotifications(): void {
    this.flashSaved();
  }

  // --- Modules ---
  protected readonly modules = signal<ModuleToggle[]>(defaultTenantModules());
  protected readonly pendingToggle = signal<ModuleToggle | null>(null);

  requestToggle(mod: ModuleToggle): void {
    if (mod.enabled) {
      // Turning a module off removes it from that tenant's sidebar in a real
      // rollout, so it goes through a confirm step; turning one on doesn't.
      this.pendingToggle.set(mod);
    } else {
      this.applyToggle(mod.key);
    }
  }

  confirmToggle(): void {
    const mod = this.pendingToggle();
    if (mod) this.applyToggle(mod.key);
    this.pendingToggle.set(null);
  }

  cancelToggle(): void {
    this.pendingToggle.set(null);
  }

  private applyToggle(key: string): void {
    this.modules.update((list) =>
      list.map((m) => (m.key === key ? { ...m, enabled: !m.enabled } : m)),
    );
  }
}
