import { Component, inject, signal } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthLayout } from '../../shared/auth-layout/auth-layout';
import { DilgSeal } from '../../shared/dilg-seal/dilg-seal';
import { Session } from '../../core/session';
import { resolveLandingRoute } from '../../core/verification-flow';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

@Component({
  selector: 'app-login',
  imports: [FormsModule, RouterLink, AuthLayout, DilgSeal],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  private readonly session = inject(Session);
  private readonly router = inject(Router);

  email = '';
  password = '';
  rememberMe = false;

  readonly showPassword = signal(false);
  readonly submitted = signal(false);
  readonly loginError = signal('');

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

    // Mock lookup only — the role is never chosen here, it's whatever is
    // already assigned to the matched account. Password isn't checked
    // against anything real in this simulation.
    const account = this.session.signIn(normalized);
    if (!account) {
      this.loginError.set('We couldn’t find an account with that email or username.');
      return;
    }

    this.router.navigateByUrl(resolveLandingRoute(account));
  }
}
