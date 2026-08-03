import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AccountSwitcher } from './shared/account-switcher/account-switcher';
import { ToastHost } from './shared/toast/toast';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, AccountSwitcher, ToastHost],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {}
