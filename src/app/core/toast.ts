import { Injectable, signal } from '@angular/core';

export interface ToastMessage {
  id: number;
  text: string;
  tone: 'success' | 'info';
}

// One app-root-mounted host renders whatever this service holds — the same
// approach already used for the account switcher and impersonation banner —
// so any page can call `show()` without wiring its own toast markup.
@Injectable({ providedIn: 'root' })
export class Toast {
  private counter = 0;
  readonly current = signal<ToastMessage | null>(null);

  show(text: string, tone: 'success' | 'info' = 'success', durationMs = 3200): void {
    const id = ++this.counter;
    this.current.set({ id, text, tone });
    setTimeout(() => {
      if (this.current()?.id === id) this.current.set(null);
    }, durationMs);
  }
}
