import { Component, computed, input } from '@angular/core';
import { BADGE_CATEGORY, RoleKey } from '../../core/roles';

@Component({
  selector: 'app-role-badge',
  imports: [],
  templateUrl: './role-badge.html',
  styleUrl: './role-badge.scss',
})
export class RoleBadge {
  readonly role = input.required<RoleKey>();
  readonly label = input.required<string>();
  /** Compact drops the label to just the category, for tight spaces like the sidebar. */
  readonly compact = input<boolean>(false);

  protected readonly category = computed(() => BADGE_CATEGORY[this.role()]);
}
