export type OperationType = 'IMPO' | 'EXPO';

export type TransportMode = 'AIR' | 'SEA';

export type ShipmentStatus =
  | 'PENDING'
  | 'ORIGIN_WAREHOUSE'
  | 'ORIGIN_CUSTOMS'
  | 'IN_TRANSIT'
  | 'DESTINATION_CUSTOMS'
  | 'NATIONALIZED'
  | 'DESTINATION_WAREHOUSE'
  | 'DISPATCHED'
  | 'DELIVERED'
  | 'WITH_ISSUE'
  | 'CANCELLED';

export interface LogisticDates {
  originWarehouse?: string | null;
  etd?: string | null;
  atd?: string | null;
  eta?: string | null;
  ata?: string | null;
  destinationWarehouse?: string | null;
  nationalization?: string | null;
  dispatch?: string | null;
  planilla?: string | null;
  delivery?: string | null;
}

export interface Container {
  type?: string | null;
  quantity?: number | null;
  number?: string | null;
  freeDays?: number | null;
  remainingDays?: number | null;
  returnDate?: string | null;
  delayDays?: number | null;
  delayValuePerDay?: number | null;
  totalDelayValue?: number | null;
  deposit?: string | null;
}

export interface ShipmentFinancialInfo {
  advanceRequestedAt?: string | null;
  advancePaidAt?: string | null;
  advanceAmount?: number | null;
  providerInvoice?: string | null;
  tccInvoice?: string | null;
  invoiceNumber?: string | null;
  invoiceDate?: string | null;
  expenseDescription?: string | null;
  subtotal?: number | null;
  tax?: number | null;
  total?: number | null;
}

export interface ShipmentDocument {
  id: string;
  type: string;
  name: string;
  date: string;
  status: 'PENDING' | 'AVAILABLE' | 'REJECTED';
}

export interface ShipmentEvent {
  id: string;
  dateTime: string;
  status: ShipmentStatus;
  location: string;
  description: string;
  source: string;
}

export interface Shipment {
  id: string;
  documentNumber: string;
  operationType: OperationType;
  transportMode: TransportMode;
  status: ShipmentStatus;
  client: string;
  provider: string;
  origin: string;
  destination: string;
  merchandiseDescription: string;
  cargoType: 'FCL' | 'LCL';
  carrier: string;
  logisticDates: LogisticDates;
  container?: Container | null;
  financialInfo?: ShipmentFinancialInfo | null;
  documents: ShipmentDocument[];
  events: ShipmentEvent[];
  issueComment?: string | null;
  progress: number;
  nextStop?: string | null;
}
