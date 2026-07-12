import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';

import { AuthSessionService } from '../../core/services/auth-session.service';

@Component({
  selector: 'app-header',
  imports: [MatButtonModule],
  templateUrl: './header.html',
  styleUrl: './header.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Header {
  private readonly router = inject(Router);
  private readonly authSession = inject(AuthSessionService);

  protected readonly session = this.authSession.currentSession;

  protected logout(): void {
    this.authSession.logout();
    void this.router.navigate(['/login']);
  }
}
