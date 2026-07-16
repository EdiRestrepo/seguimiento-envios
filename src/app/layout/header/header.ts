import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
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
  private readonly authSession = inject(AuthSessionService);

  protected readonly session = this.authSession.currentSession;

  protected logout(): void {
    this.authSession.logout().subscribe();
  }
}
