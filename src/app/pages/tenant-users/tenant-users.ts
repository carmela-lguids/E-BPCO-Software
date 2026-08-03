import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Topbar } from '../../shared/topbar/topbar';
import { Icon } from '../../shared/icon/icon';
import { Avatar } from '../../shared/avatar/avatar';
import { RoleBadge } from '../../shared/role-badge/role-badge';
import { RoleAssignmentPreview } from '../../shared/role-assignment-preview/role-assignment-preview';
import { EmptyState } from '../../shared/empty-state/empty-state';
import { Session } from '../../core/session';
import { MOCK_ACCOUNTS, MockAccount } from '../../core/mock-accounts';
import { ROLES, ROLE_ORDER, RoleKey } from '../../core/roles';

const CREATABLE_ROLES: RoleKey[] = ROLE_ORDER.filter((key) => ROLES[key].group === 'tenant-admin');

@Component({
  selector: 'app-tenant-users',
  imports: [Topbar, Icon, Avatar, RoleBadge, RoleAssignmentPreview, FormsModule, EmptyState],
  templateUrl: './tenant-users.html',
  styleUrl: './tenant-users.scss',
})
export class TenantUsers {
  private readonly session = inject(Session);

  protected readonly tenant = this.session.activeTenant;
  protected readonly creatableRoles = CREATABLE_ROLES;
  protected readonly roleLabelOf = (key: RoleKey) => ROLES[key].label;

  protected readonly rows = signal<MockAccount[]>(
    MOCK_ACCOUNTS.filter((a) => a.tenant === this.session.activeTenant()),
  );

  protected readonly roleFilter = signal<'All Roles' | RoleKey>('All Roles');
  protected readonly statusFilter = signal('All Statuses');
  protected readonly searchTerm = signal('');

  protected readonly filteredRows = computed(() => {
    const role = this.roleFilter();
    const status = this.statusFilter();
    const term = this.searchTerm().trim().toLowerCase();
    return this.rows().filter((r) => {
      if (role !== 'All Roles' && r.role !== role) return false;
      if (status !== 'All Statuses' && r.status !== status) return false;
      if (!term) return true;
      return r.fullName.toLowerCase().includes(term) || r.email.toLowerCase().includes(term);
    });
  });

  // --- View / Edit / Delete ---
  protected readonly modal = signal<'view' | 'edit' | 'delete' | null>(null);
  protected readonly selected = signal<MockAccount | null>(null);
  protected editForm: { fullName: string; department: string; status: MockAccount['status'] } = {
    fullName: '',
    department: '',
    status: 'Active',
  };

  view(row: MockAccount): void {
    this.selected.set(row);
    this.modal.set('view');
  }

  edit(row: MockAccount): void {
    this.selected.set(row);
    this.editForm = { fullName: row.fullName, department: row.department, status: row.status };
    this.modal.set('edit');
  }

  remove(row: MockAccount): void {
    this.selected.set(row);
    this.modal.set('delete');
  }

  closeModal(): void {
    this.modal.set(null);
    this.selected.set(null);
  }

  saveEdit(): void {
    const original = this.selected();
    if (!original) return;
    this.rows.update((list) =>
      list.map((r) => (r === original ? { ...r, ...this.editForm } : r)),
    );
    this.closeModal();
  }

  confirmDelete(): void {
    const original = this.selected();
    if (!original) return;
    this.rows.update((list) => list.filter((r) => r !== original));
    this.closeModal();
  }

  // --- Add User (form step -> preview step -> confirm) ---
  protected readonly addStep = signal<'form' | 'preview' | null>(null);
  protected addForm = {
    fullName: '',
    email: '',
    department: '',
    role: CREATABLE_ROLES[0],
  };

  openAdd(): void {
    this.addForm = { fullName: '', email: '', department: '', role: CREATABLE_ROLES[0] };
    this.addStep.set('form');
  }

  goToPreview(): void {
    if (!this.addForm.fullName.trim() || !this.addForm.email.trim()) return;
    this.addStep.set('preview');
  }

  backToForm(): void {
    this.addStep.set('form');
  }

  confirmAdd(): void {
    const role = this.addForm.role;
    const def = ROLES[role];
    const newAccount: MockAccount = {
      id: `mock-acct-new-${Date.now()}`,
      fullName: this.addForm.fullName.trim(),
      email: this.addForm.email.trim(),
      username: this.addForm.email.split('@')[0] ?? this.addForm.fullName.toLowerCase().replace(/\s+/g, '.'),
      employeeId: `${(this.tenant() ?? 'TEN').slice(0, 3).toUpperCase()}-NEW-${String(this.rows().length + 1).padStart(4, '0')}`,
      contactNumber: '—',
      role,
      roleLabel: def.label,
      accountType: 'Tenant User',
      tenant: this.tenant(),
      department: this.addForm.department.trim() || 'Unassigned',
      status: 'Pending Confirmation',
      accessScope: def.group === 'tenant-admin' ? 'Tenant-Wide Access' : 'Assigned Records Only',
      assignedBy: this.session.currentAccount().fullName,
      assignedByRole: this.session.currentAccount().roleLabel,
      assignedDate: 'Just now',
      createdBy: this.session.currentAccount().fullName,
      createdDate: 'Just now',
      lastRoleUpdate: 'Just now',
      accountConfirmed: false,
      lastLogin: 'Never',
      permissions: [],
      roleHistory: [
        {
          date: 'Just now',
          event: `Account created as ${def.label}`,
          changedBy: this.session.currentAccount().fullName,
          changedByRole: this.session.currentAccount().roleLabel,
        },
      ],
    };
    this.rows.update((list) => [newAccount, ...list]);
    this.addStep.set(null);
  }

  cancelAdd(): void {
    this.addStep.set(null);
  }
}
