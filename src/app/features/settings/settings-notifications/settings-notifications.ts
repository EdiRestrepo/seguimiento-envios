import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-settings-notifications',
  templateUrl: './settings-notifications.html',
  styleUrl: './settings-notifications.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsNotifications {}
