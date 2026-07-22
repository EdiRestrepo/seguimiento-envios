import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { map, switchMap } from 'rxjs';

import { Shipment } from '../../core/models/shipment.model';
import { getOperationTypeLabel, getShipmentStatusLabel, getTransportModeLabel } from '../../core/utils/display-labels';
import { MockShipmentService } from '../../mocks/services/mock-shipment.service';

@Component({
  selector: 'app-shipment-detail',
  imports: [AsyncPipe, MatButtonModule, RouterLink],
  templateUrl: './shipment-detail.html',
  styleUrl: './shipment-detail.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShipmentDetail {
  private readonly route = inject(ActivatedRoute);
  private readonly shipmentService = inject(MockShipmentService);

  protected readonly shipment$ = this.route.paramMap.pipe(
    map((params) => params.get('id') ?? ''),
    switchMap((id) => this.shipmentService.getById(id)),
  );

  protected readonly getOperationTypeLabel = getOperationTypeLabel;
  protected readonly getTransportModeLabel = getTransportModeLabel;
  protected readonly getShipmentStatusLabel = getShipmentStatusLabel;

  protected getRouteLabel(shipment: Shipment): string {
    return `${shipment.origin.country} → ${shipment.destination.country}`;
  }
}
