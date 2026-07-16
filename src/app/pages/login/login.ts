import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthLayout } from '../../shared/auth-layout/auth-layout';
import { DilgSeal } from '../../shared/dilg-seal/dilg-seal';

@Component({
  selector: 'app-login',
  imports: [FormsModule, RouterLink, AuthLayout, DilgSeal],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  email = '';
  password = '';
  rememberMe = false;

  readonly showPassword = signal(false);

  constructor(private readonly router: Router) {}

  togglePassword(): void {
    this.showPassword.update((value) => !value);
  }

  onSubmit(): void {
    const normalized = this.email.trim().toLowerCase();
    const isTenant = normalized.includes('tenant');
    this.router.navigateByUrl(isTenant ? '/tenant/dashboard' : '/dashboard');
  }
}
