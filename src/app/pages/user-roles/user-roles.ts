import { Component } from '@angular/core';
import { Topbar } from '../../shared/topbar/topbar';
import { Icon } from '../../shared/icon/icon';

@Component({
  selector: 'app-user-roles',
  imports: [Topbar, Icon],
  templateUrl: './user-roles.html',
  styleUrl: '../../shared/styles/coming-soon.scss',
})
export class UserRoles {}
