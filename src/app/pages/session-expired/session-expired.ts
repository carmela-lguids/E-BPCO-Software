import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { Icon } from '../../shared/icon/icon';

@Component({
  selector: 'app-session-expired',
  imports: [Icon],
  templateUrl: './session-expired.html',
  styleUrl: './session-expired.scss',
})
export class SessionExpired {
  constructor(private readonly router: Router) {}

  signInAgain(): void {
    this.router.navigateByUrl('/login');
  }
}
