import { Injectable } from '@angular/core';
import { delay, Observable, of } from 'rxjs';

import { Shipment } from '../../core/models/shipment.model';
import { ShipmentDataSource } from '../../core/services/shipment-data-source';
import { mockShipments } from '../data/mock-shipments';

@Injectable({
  providedIn: 'root',
})
export class MockShipmentService implements ShipmentDataSource {
  getShipments(): Observable<Shipment[]> {
    return of(mockShipments).pipe(delay(500));
  }

  getShipmentById(id: string): Observable<Shipment | null> {
    const shipment = mockShipments.find((item) => item.id === id) ?? null;
    return of(shipment).pipe(delay(350));
  }
}
