import { ShipmentStatus } from './shipment.model';

export interface Notification {
  id: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  shipmentId?: string;
  status?: ShipmentStatus;
}
