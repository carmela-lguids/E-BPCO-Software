import { Component, computed, input } from '@angular/core';
import { RoleBadge } from '../role-badge/role-badge';
import { RoleKey, roleLabel } from '../../core/roles';
import { NAV_BY_ROLE, restrictedModulesFor } from '../../core/nav-by-role';

// Shown before an administrator confirms a role assignment — both columns
// are generated from the same NAV_BY_ROLE data that drives the real
// sidebar, so this preview can never promise access the role won't
// actually have. See Identity memo §09.
@Component({
  selector: 'app-role-assignment-preview',
  imports: [RoleBadge],
  templateUrl: './role-assignment-preview.html',
  styleUrl: './role-assignment-preview.scss',
})
export class RoleAssignmentPreview {
  readonly role = input.required<RoleKey>();

  protected readonly label = computed(() => roleLabel(this.role()));
  protected readonly willReceive = computed(() => NAV_BY_ROLE[this.role()].map((i) => i.label));
  protected readonly willNotReceive = computed(() => restrictedModulesFor(this.role()));
}
