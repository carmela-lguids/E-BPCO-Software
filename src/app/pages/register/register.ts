import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthLayout } from '../../shared/auth-layout/auth-layout';
import { DilgSeal } from '../../shared/dilg-seal/dilg-seal';

@Component({
  selector: 'app-register',
  imports: [FormsModule, RouterLink, AuthLayout, DilgSeal],
  templateUrl: './register.html',
  styleUrl: './register.scss',
})
export class Register {
  fullName = '';
  email = '';
  password = '';
  confirmPassword = '';

  readonly showPassword = signal(false);

  togglePassword(): void {
    this.showPassword.update((value) => !value);
  }

  onSubmit(): void {
    console.log('Register attempt', {
      fullName: this.fullName,
      email: this.email,
    });
  }
}
