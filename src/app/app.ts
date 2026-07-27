import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AccountSwitcher } from './shared/account-switcher/account-switcher';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, AccountSwitcher],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {}
