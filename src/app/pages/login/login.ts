import { Component, signal } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthLayout } from '../../shared/auth-layout/auth-layout';
import { DilgSeal } from '../../shared/dilg-seal/dilg-seal';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
  readonly submitted = signal(false);
  readonly loginError = signal('');

  constructor(private readonly router: Router) {}

  togglePassword(): void {
    this.showPassword.update((value) => !value);
  }

  onEmailChange(): void {
    this.loginError.set('');
  }

  onSubmit(form: NgForm): void {
    this.submitted.set(true);
    this.loginError.set('');

    const normalized = this.email.trim().toLowerCase();
    if (!EMAIL_PATTERN.test(normalized)) {
      this.loginError.set('Please enter a valid email address.');
      return;
    }
    if (form.invalid) return;

    const isTenant = normalized.includes('tenant');
    this.router.navigateByUrl(isTenant ? '/tenant/dashboard' : '/dashboard');
  }
}
