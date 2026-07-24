import { Directive, EffectRef, TemplateRef, ViewContainerRef, effect, inject, input } from '@angular/core';
import { Session } from './session';
import { RoleKey } from './roles';

/**
 * Structural directive that renders its template only when the current mock
 * account's role is in the given list. Hides content from the DOM entirely
 * (never a disabled/greyed state) — a frontend convention only, not a
 * security boundary.
 *
 * <button *roleGate="['tenant-admin', 'obo']">Approve</button>
 */
@Directive({
  selector: '[roleGate]',
  standalone: true,
})
export class RoleGate {
  private readonly templateRef = inject(TemplateRef<unknown>);
  private readonly viewContainer = inject(ViewContainerRef);
  private readonly session = inject(Session);

  readonly roleGate = input.required<RoleKey[]>();

  private hasView = false;
  private readonly watcher: EffectRef = effect(() => {
    const allowed = this.roleGate().includes(this.session.currentRole());
    if (allowed && !this.hasView) {
      this.viewContainer.createEmbeddedView(this.templateRef);
      this.hasView = true;
    } else if (!allowed && this.hasView) {
      this.viewContainer.clear();
      this.hasView = false;
    }
  });
}
