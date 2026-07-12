import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { catchError, combineLatest, debounceTime, map, Observable, of, startWith, switchMap } from 'rxjs';

import { Shipment } from '../../../core/models/shipment.model';
import { getOperationTypeLabel, getShipmentStatusLabel, getTransportModeLabel } from '../../../core/utils/display-labels';
import { MockShipmentService } from '../../../mocks/services/mock-shipment.service';

interface ShipmentListViewModel {
  state: 'loading' | 'empty' | 'error' | 'success';
  shipments: Shipment[];
  message?: string;
}

@Component({
  selector: 'app-shipment-list',
  imports: [AsyncPipe, MatButtonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './shipment-list.html',
  styleUrl: './shipment-list.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShipmentList {
  private readonly shipmentService = inject(MockShipmentService);

  protected readonly searchControl = new FormControl('', { nonNullable: true });
  protected readonly viewModel$: Observable<ShipmentListViewModel> = combineLatest([
    this.searchControl.valueChanges.pipe(startWith(''), debounceTime(180)),
    of(undefined),
  ]).pipe(
    switchMap(([query]) =>
      this.shipmentService.getShipments().pipe(
        map((shipments) => this.filterShipments(shipments, query)),
        map((shipments) => ({
          state: shipments.length > 0 ? 'success' : 'empty',
          shipments,
        }) satisfies ShipmentListViewModel),
        startWith({ state: 'loading', shipments: [] } satisfies ShipmentListViewModel),
        catchError(() =>
          of({
            state: 'error',
            shipments: [],
            message: 'No fue posible cargar los envíos simulados. Intenta nuevamente.',
          } satisfies ShipmentListViewModel),
        ),
      ),
    ),
  );

  protected readonly getOperationTypeLabel = getOperationTypeLabel;
  protected readonly getTransportModeLabel = getTransportModeLabel;
  protected readonly getShipmentStatusLabel = getShipmentStatusLabel;

  private filterShipments(shipments: Shipment[], query: string): Shipment[] {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return shipments;
    }

    return shipments.filter((shipment) => {
      const searchableText = [
        shipment.documentNumber,
        shipment.client,
        shipment.origin,
        shipment.destination,
        shipment.status,
        shipment.operationType,
        shipment.transportMode,
      ]
        .join(' ')
        .toLowerCase();

      return searchableText.includes(normalizedQuery);
    });
  }
}
