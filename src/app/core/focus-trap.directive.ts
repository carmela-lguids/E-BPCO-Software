import { AfterViewInit, Directive, ElementRef, OnDestroy, HostListener, inject, output } from '@angular/core';

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

// Keeps Tab/Shift+Tab cycling inside the host, moves initial focus in, restores
// it to whatever triggered the host on teardown, and treats Escape as a close
// request — the three things a modal/drawer needs to not leak focus into the
// page behind it.
@Directive({
  selector: '[focusTrap]',
})
export class FocusTrapDirective implements AfterViewInit, OnDestroy {
  private readonly el: ElementRef<HTMLElement> = inject(ElementRef);
  private previouslyFocused: HTMLElement | null = null;

  readonly escapePressed = output<void>();

  ngAfterViewInit(): void {
    this.previouslyFocused = document.activeElement as HTMLElement;
    const first = this.el.nativeElement.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
    (first ?? this.el.nativeElement).focus();
  }

  ngOnDestroy(): void {
    this.previouslyFocused?.focus();
  }

  @HostListener('keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.escapePressed.emit();
      return;
    }
    if (event.key !== 'Tab') return;

    const focusable = Array.from(
      this.el.nativeElement.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
    ).filter((elm) => elm.offsetParent !== null);
    if (focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }
}
