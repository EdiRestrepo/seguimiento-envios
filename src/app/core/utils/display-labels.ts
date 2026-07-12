import { OperationType, ShipmentStatus, TransportMode } from '../models/shipment.model';
import { UserRole } from '../models/user.model';

const operationLabels: Record<OperationType, string> = {
  IMPO: 'Importación',
  EXPO: 'Exportación',
};

const transportModeLabels: Record<TransportMode, string> = {
  AIR: 'Aéreo',
  SEA: 'Marítimo',
};

const shipmentStatusLabels: Record<ShipmentStatus, string> = {
  PENDING: 'Pendiente',
  ORIGIN_WAREHOUSE: 'Bodega origen',
  ORIGIN_CUSTOMS: 'Aduana origen',
  IN_TRANSIT: 'En tránsito',
  DESTINATION_CUSTOMS: 'Aduana destino',
  NATIONALIZED: 'Nacionalizado',
  DESTINATION_WAREHOUSE: 'Bodega destino',
  DISPATCHED: 'Despachado',
  DELIVERED: 'Entregado',
  WITH_ISSUE: 'Con novedad',
  CANCELLED: 'Cancelado',
};

const userRoleLabels: Record<UserRole, string> = {
  CLIENT: 'Cliente',
  OPERATOR: 'Operador',
  ADMIN: 'Administrador',
};

export function getOperationTypeLabel(value: OperationType): string {
  return operationLabels[value];
}

export function getTransportModeLabel(value: TransportMode): string {
  return transportModeLabels[value];
}

export function getShipmentStatusLabel(value: ShipmentStatus): string {
  return shipmentStatusLabels[value];
}

export function getUserRoleLabel(value: UserRole): string {
  return userRoleLabels[value];
}
