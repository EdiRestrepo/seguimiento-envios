import { OperationType, ShipmentStatus, TransportMode } from './shipment.model';

export interface PaginatedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export interface SearchFilters {
  query?: string;
  operationType?: OperationType | null;
  transportMode?: TransportMode | null;
  status?: ShipmentStatus | null;
  client?: string | null;
  page?: number;
  pageSize?: number;
}
