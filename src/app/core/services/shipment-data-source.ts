import { Observable } from 'rxjs';

import { Shipment } from '../models/shipment.model';

export interface ShipmentDataSource {
  getShipments(): Observable<Shipment[]>;
  getShipmentById(id: string): Observable<Shipment | null>;
}
