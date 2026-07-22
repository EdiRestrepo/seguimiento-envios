import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-settings-users',
  templateUrl: './settings-users.html',
  styleUrl: './settings-users.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsUsers {}
