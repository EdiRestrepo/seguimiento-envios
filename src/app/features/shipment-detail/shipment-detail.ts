import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute, ParamMap, Params, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Observable, Subject, catchError, combineLatest, map, of, startWith, switchMap } from 'rxjs';

import { Container, Shipment, ShipmentFinancialInfo, ShipmentIssue, TransportMode } from '../../core/models/shipment.model';
import {
  ShipmentChipType,
  getOperationTypeLabel,
  getShipmentStatusChipType,
  getShipmentStatusIcon,
  getShipmentStatusLabel,
  getTransportModeIcon,
  getTransportModeLabel,
} from '../../core/utils/display-labels';
import { MockShipmentService } from '../../mocks/services/mock-shipment.service';

type DetailState = 'loading' | 'error' | 'not-found' | 'success';
type DetailTab = 'summary' | 'tracking' | 'dates' | 'container' | 'financial' | 'documents' | 'history';
type DateState = 'on-time' | 'delayed' | 'pending' | 'not-applicable' | 'no-data';

interface DetailViewModel {
  state: DetailState;
  selectedTab: DetailTab;
  listQueryParams: Params;
  shipment: Shipment | null;
  message?: string;
}

interface TabItem {
  id: DetailTab;
  label: string;
}

interface DetailField {
  label: string;
  value: string;
}

interface LogisticDateRow {
  label: string;
  estimated: string;
  actual: string;
  state: DateState;
  stateLabel: string;
}

const defaultTab: DetailTab = 'summary';
const tabIds: DetailTab[] = ['summary', 'tracking', 'dates', 'container', 'financial', 'documents', 'history'];

@Component({
  selector: 'app-shipment-detail',
  imports: [AsyncPipe, MatButtonModule, MatIconModule],
  templateUrl: './shipment-detail.html',
  styleUrl: './shipment-detail.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShipmentDetail {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly shipmentService = inject(MockShipmentService);
  private readonly retry$ = new Subject<void>();

  protected readonly copied = signal(false);
  protected readonly tabs: TabItem[] = [
    { id: 'summary', label: 'Resumen' },
    { id: 'tracking', label: 'Seguimiento' },
    { id: 'dates', label: 'Fechas logísticas' },
    { id: 'container', label: 'Contenedor' },
    { id: 'financial', label: 'Financiero' },
    { id: 'documents', label: 'Documentos' },
    { id: 'history', label: 'Historial' },
  ];

  protected readonly viewModel$: Observable<DetailViewModel> = combineLatest([
    this.route.paramMap,
    this.route.queryParamMap,
    this.retry$.pipe(startWith(undefined)),
  ]).pipe(
    switchMap(([params, queryParams]) => {
      const id = params.get('id') ?? '';
      const selectedTab = this.getTabFromParams(queryParams);
      const listQueryParams = this.getListQueryParams(queryParams);

      return this.shipmentService.getById(id).pipe(
        map((shipment) => ({
          state: shipment ? 'success' : 'not-found',
          selectedTab,
          listQueryParams,
          shipment,
          message: shipment ? undefined : 'El identificador solicitado no existe en los datos simulados.',
        }) satisfies DetailViewModel),
        startWith({ state: 'loading', selectedTab, listQueryParams, shipment: null } satisfies DetailViewModel),
        catchError(() =>
          of({
            state: 'error',
            selectedTab,
            listQueryParams,
            shipment: null,
            message: 'No fue posible cargar el detalle del envío. Intenta nuevamente.',
          } satisfies DetailViewModel),
        ),
      );
    }),
  );

  protected readonly getOperationTypeLabel = getOperationTypeLabel;
  protected readonly getTransportModeLabel = getTransportModeLabel;
  protected readonly getTransportModeIcon = getTransportModeIcon;
  protected readonly getShipmentStatusLabel = getShipmentStatusLabel;
  protected readonly getShipmentStatusIcon = getShipmentStatusIcon;

  protected retry(): void {
    this.retry$.next();
  }

  protected goBack(queryParams: Params): void {
    void this.router.navigate(['/shipments'], { queryParams });
  }

  protected selectTab(tab: DetailTab): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tab },
      queryParamsHandling: 'merge',
    });
  }

  protected copyDocument(documentNumber: string): void {
    const clipboard = globalThis.navigator?.clipboard;

    if (!clipboard) {
      this.copied.set(false);
      return;
    }

    void clipboard.writeText(documentNumber).then(
      () => this.copied.set(true),
      () => this.copied.set(false),
    );
  }

  protected getRouteLabel(shipment: Shipment): string {
    return `${shipment.origin.country} → ${shipment.destination.country}`;
  }

  protected getLocationLabel(location: Shipment['origin']): string {
    return [location.city, location.country].filter((value): value is string => Boolean(value)).join(', ');
  }

  protected getDocumentType(shipment: Shipment): string {
    return shipment.transportMode === 'AIR' ? 'AWB' : 'HBL';
  }

  protected getStatusChipClass(shipment: Shipment): string {
    const classes: Record<ShipmentChipType, string> = {
      neutral: 'status-chip--neutral',
      info: 'status-chip--info',
      success: 'status-chip--success',
      warning: 'status-chip--issue',
      danger: 'status-chip--issue',
    };

    return classes[getShipmentStatusChipType(shipment.status)];
  }

  protected getShipmentInfoFields(shipment: Shipment): DetailField[] {
    return [
      { label: 'Cliente', value: shipment.client },
      { label: 'Proveedor o agente', value: shipment.provider },
      { label: 'Transportista', value: shipment.carrier },
      { label: 'Descripción de mercancía', value: shipment.merchandiseDescription },
      { label: 'Documento', value: shipment.documentNumber },
      { label: 'Tipo de documento', value: this.getDocumentType(shipment) },
    ];
  }

  protected getRouteCargoFields(shipment: Shipment): DetailField[] {
    return [
      { label: 'Origen', value: this.getLocationLabel(shipment.origin) },
      { label: 'Destino', value: this.getLocationLabel(shipment.destination) },
      { label: 'Tipo de carga', value: shipment.cargoType },
      { label: 'Cantidad de bultos', value: shipment.packages.toLocaleString('es-CO') },
      { label: 'Peso', value: `${shipment.weightKg.toLocaleString('es-CO')} kg` },
      { label: 'Volumen', value: `${shipment.volumeM3.toLocaleString('es-CO')} m³` },
    ];
  }

  protected getIssueTitle(issue: ShipmentIssue): string {
    const titles: Record<ShipmentIssue['type'], string> = {
      DELAY: 'Retraso logístico',
      CUSTOMS_INSPECTION: 'Inspección aduanera',
      DOCUMENT_PENDING: 'Documento pendiente',
      WEATHER: 'Condición climática',
      NONE: 'Sin novedad',
    };

    return titles[issue.type];
  }

  protected getIssueSeverity(issue: ShipmentIssue): string {
    return issue.resolved ? 'Resuelta' : 'Activa';
  }

  protected getLogisticDateRows(shipment: Shipment): LogisticDateRow[] {
    const dates = shipment.logisticDates;

    return [
      this.createDateRow('Bodega origen', null, dates.originWarehouse, true),
      this.createDateRow('Salida ETD / ATD', dates.etd, dates.atd, true),
      this.createDateRow('Llegada ETA / ATA', dates.eta, dates.ata, true),
      this.createDateRow('Bodega destino', null, dates.destinationWarehouse, true),
      this.createDateRow('Nacionalización', null, dates.nationalization, true),
      this.createDateRow('Despacho destino', null, dates.dispatch, true),
      this.createDateRow('Planilla', null, dates.planilla, true),
      this.createDateRow('Entrega', null, dates.delivery, true),
      this.createDateRow('Devolución de contenedor', null, shipment.container?.returnDate ?? null, shipment.transportMode === 'SEA' && Boolean(shipment.container)),
    ];
  }

  protected getContainerFields(container: Container): DetailField[] {
    return [
      { label: 'Tipo', value: this.formatOptional(container.type) },
      { label: 'Cantidad', value: container.quantity.toLocaleString('es-CO') },
      { label: 'Número', value: this.formatOptional(container.number) },
      { label: 'Días libres', value: this.formatNullableNumber(container.freeDays) },
      { label: 'Días restantes', value: this.formatNullableNumber(container.remainingDays) },
      { label: 'Fecha devolución real', value: this.formatDate(container.returnDate) },
      { label: 'Días de demora', value: container.delayDays.toLocaleString('es-CO') },
      { label: 'Valor por día', value: this.formatCurrency(container.delayValuePerDay) },
      { label: 'Total demoras', value: this.formatCurrency(container.totalDelayValue) },
      { label: 'Depósito', value: this.formatOptional(container.deposit) },
    ];
  }

  protected hasFinancialInfo(financialInfo: ShipmentFinancialInfo): boolean {
    return Boolean(financialInfo.advancePayment || financialInfo.invoice);
  }

  protected getAdvanceFields(financialInfo: ShipmentFinancialInfo): DetailField[] {
    const advance = financialInfo.advancePayment;

    if (!advance) {
      return [];
    }

    return [
      { label: 'Fecha solicitud', value: this.formatDate(advance.requestedAt) },
      { label: 'Fecha pago', value: this.formatDate(advance.paidAt) },
      { label: 'Valor', value: this.formatCurrency(advance.amount) },
    ];
  }

  protected getInvoiceFields(financialInfo: ShipmentFinancialInfo): DetailField[] {
    const invoice = financialInfo.invoice;

    if (!invoice) {
      return [];
    }

    return [
      { label: 'Factura proveedor', value: this.formatOptional(invoice.providerInvoice) },
      { label: 'Factura TCC', value: this.formatOptional(invoice.tccInvoice) },
      { label: 'Número de factura', value: this.formatOptional(invoice.invoiceNumber) },
      { label: 'Fecha', value: this.formatDate(invoice.invoiceDate) },
      { label: 'Descripción del gasto', value: this.formatOptional(invoice.expenseDescription) },
      { label: 'Valor', value: this.formatCurrency(invoice.expenseValue) },
    ];
  }

  protected getFinancialSummaryFields(financialInfo: ShipmentFinancialInfo): DetailField[] {
    const invoice = financialInfo.invoice;

    if (!invoice) {
      return [];
    }

    return [
      { label: 'Subtotal', value: this.formatCurrency(invoice.subtotal) },
      { label: 'IVA', value: this.formatCurrency(invoice.tax) },
      { label: 'Total', value: this.formatCurrency(invoice.total) },
    ];
  }

  protected formatDate(value: string | null | undefined): string {
    if (!value) {
      return '-';
    }

    const date = new Date(value.includes('T') ? value : `${value}T00:00:00.000Z`);
    if (Number.isNaN(date.getTime())) {
      return '-';
    }

    return new Intl.DateTimeFormat('es-CO', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(date);
  }

  protected formatCurrency(value: number | null | undefined): string {
    if (value === null || value === undefined) {
      return '-';
    }

    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(value);
  }

  protected getModeClass(mode: TransportMode): string {
    return mode === 'AIR' ? 'detail-header__mode--air' : 'detail-header__mode--sea';
  }

  private createDateRow(label: string, estimated: string | null | undefined, actual: string | null | undefined, applies: boolean): LogisticDateRow {
    const state = this.getDateState(estimated, actual, applies);

    return {
      label,
      estimated: this.formatDate(estimated),
      actual: this.formatDate(actual),
      state,
      stateLabel: this.getDateStateLabel(state),
    };
  }

  private getDateState(estimated: string | null | undefined, actual: string | null | undefined, applies: boolean): DateState {
    if (!applies) {
      return 'not-applicable';
    }

    if (!estimated && !actual) {
      return 'no-data';
    }

    if (estimated && !actual) {
      return 'pending';
    }

    if (!estimated && actual) {
      return 'on-time';
    }

    const estimatedDate = new Date(`${estimated}T00:00:00.000Z`);
    const actualDate = new Date(`${actual}T00:00:00.000Z`);

    if (Number.isNaN(estimatedDate.getTime()) || Number.isNaN(actualDate.getTime())) {
      return 'no-data';
    }

    return actualDate.getTime() > estimatedDate.getTime() ? 'delayed' : 'on-time';
  }

  private getDateStateLabel(state: DateState): string {
    const labels: Record<DateState, string> = {
      'on-time': 'A tiempo',
      delayed: 'Retrasado',
      pending: 'Pendiente',
      'not-applicable': 'No aplica',
      'no-data': 'Sin dato',
    };

    return labels[state];
  }

  private getTabFromParams(params: ParamMap): DetailTab {
    const tab = params.get('tab');
    return tabIds.includes(tab as DetailTab) ? (tab as DetailTab) : defaultTab;
  }

  private getListQueryParams(params: ParamMap): Params {
    return params.keys.reduce<Params>((result, key) => {
      if (key !== 'tab') {
        result[key] = params.get(key);
      }
      return result;
    }, {});
  }

  private formatOptional(value: string | null | undefined): string {
    return value?.trim() ? value : '-';
  }

  private formatNullableNumber(value: number | null | undefined): string {
    return value === null || value === undefined ? '-' : value.toLocaleString('es-CO');
  }
}
