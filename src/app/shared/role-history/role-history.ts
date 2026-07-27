import { Component, input } from '@angular/core';
import { RoleHistoryEntry } from '../../core/mock-accounts';

@Component({
  selector: 'app-role-history',
  imports: [],
  templateUrl: './role-history.html',
  styleUrl: './role-history.scss',
})
export class RoleHistory {
  readonly entries = input.required<RoleHistoryEntry[]>();
}
