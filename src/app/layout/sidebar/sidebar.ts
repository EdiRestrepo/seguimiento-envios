import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { AuthSessionService } from '../../core/services/auth-session.service';
import { getUserRoleLabel } from '../../core/utils/display-labels';

interface NavItem {
  label: string;
  route: string;
  icon: string;
}

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Sidebar {
  private readonly authSession = inject(AuthSessionService);

  protected readonly session = this.authSession.currentSession;
  protected readonly roleLabel = computed(() => {
    const session = this.session();
    return session ? getUserRoleLabel(session.user.role) : 'Invitado';
  });

  protected readonly navItems: NavItem[] = [
    { label: 'Inicio', route: '/dashboard', icon: '🌐' },
    { label: 'Mis Envíos', route: '/shipments', icon: '📦' },
    { label: 'Historial', route: '/history', icon: '🕒' },
    { label: 'Notificaciones', route: '/notifications', icon: '🔔' },
    { label: 'Reportes', route: '/reports', icon: '📈' },
    { label: 'Ajustes', route: '/settings', icon: '⚙' },
  ];
}
