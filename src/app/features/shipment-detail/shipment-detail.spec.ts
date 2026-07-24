import { ComponentFixture, TestBed, fakeAsync, flushMicrotasks, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute, Params, Router, convertToParamMap, provideRouter } from '@angular/router';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';

import { LogisticDates, Shipment, ShipmentFinancialInfo } from '../../core/models/shipment.model';
import { MockShipmentService } from '../../mocks/services/mock-shipment.service';
import { ShipmentDetail } from './shipment-detail';

describe('ShipmentDetail', () => {
  let fixture: ComponentFixture<ShipmentDetail>;
  let router: Router;
  let getByIdSpy: jasmine.Spy<(id: string) => Observable<Shipment | null>>;
  let paramSubject: BehaviorSubject<ReturnType<typeof convertToParamMap>>;
  let querySubject: BehaviorSubject<ReturnType<typeof convertToParamMap>>;
  let clipboardWriteSpy: jasmine.Spy<(value: string) => Promise<void>>;

  beforeEach(async () => {
    paramSubject = new BehaviorSubject(convertToParamMap({ id: 'shipment-001' }));
    querySubject = new BehaviorSubject(convertToParamMap({}));
    getByIdSpy = jasmine.createSpy('getById').and.returnValue(of(createShipment()));
    clipboardWriteSpy = jasmine.createSpy('writeText').and.resolveTo();
    Object.defineProperty(globalThis.navigator, 'clipboard', {
      value: { writeText: clipboardWriteSpy },
      configurable: true,
    });

    await TestBed.configureTestingModule({
      imports: [ShipmentDetail, NoopAnimationsModule],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: paramSubject.asObservable(),
            queryParamMap: querySubject.asObservable(),
            snapshot: { paramMap: convertToParamMap({ id: 'shipment-001' }), queryParamMap: convertToParamMap({}) },
          },
        },
        { provide: MockShipmentService, useValue: { getById: getByIdSpy } },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);
    fixture = TestBed.createComponent(ShipmentDetail);
  });

  it('should get shipment by route id and render header', fakeAsync(() => {
    render();

    expect(getByIdSpy).toHaveBeenCalledWith('shipment-001');
    expect(getText()).toContain('AWB-001');
    expect(getText()).toContain('Importación');
    expect(getText()).toContain('México → Colombia');
  }));

  it('should render not found state', fakeAsync(() => {
    getByIdSpy.and.returnValue(of(null));
    fixture = TestBed.createComponent(ShipmentDetail);
    render();

    expect(getText()).toContain('Envío no encontrado');
  }));

  it('should render error state and retry', fakeAsync(() => {
    getByIdSpy.and.returnValue(throwError(() => new Error('fallo')));
    fixture = TestBed.createComponent(ShipmentDetail);
    render();

    expect(getText()).toContain('No se pudo cargar el detalle');
    getByIdSpy.and.returnValue(of(createShipment()));
    clickButton('Reintentar');
    tick();
    fixture.detectChanges();

    expect(getText()).toContain('AWB-001');
  }));

  it('should copy document number', fakeAsync(() => {
    render();

    const button = fixture.nativeElement.querySelector('button[title="Copiar documento"]') as HTMLButtonElement;
    button.click();
    flushMicrotasks();
    fixture.detectChanges();

    expect(clipboardWriteSpy).toHaveBeenCalledWith('AWB-001');
    expect(getText()).toContain('Copiado');
  }));

  it('should change selected tab through query params', fakeAsync(() => {
    render();
    clickButton('Fechas logísticas');

    expect(router.navigate).toHaveBeenCalledWith([], jasmine.objectContaining({
      queryParams: { tab: 'dates' },
      queryParamsHandling: 'merge',
    }));
  }));

  it('should render selected tab from query param', fakeAsync(() => {
    setQueryParams({ tab: 'financial' });
    render();

    expect(getText()).toContain('Facturación');
    expect(getText()).toContain('Resumen');
  }));

  it('should return to list preserving listing query params', fakeAsync(() => {
    setQueryParams({ query: 'Enka', page: '2', pageSize: '25', tab: 'summary' });
    render();
    clickButton('Volver');

    expect(router.navigate).toHaveBeenCalledWith(['/shipments'], { queryParams: { query: 'Enka', page: '2', pageSize: '25' } });
  }));

  it('should render issue only when shipment has issue', fakeAsync(() => {
    getByIdSpy.and.returnValue(of(createShipment({ issue: { type: 'DELAY', comment: 'Retraso operativo.', date: '2026-01-06', resolved: false } })));
    fixture = TestBed.createComponent(ShipmentDetail);
    render();

    expect(getText()).toContain('Retraso logístico');
    expect(getText()).toContain('Retraso operativo.');

    getByIdSpy.and.returnValue(of(createShipment({ issue: null })));
    fixture = TestBed.createComponent(ShipmentDetail);
    render();

    expect(getText()).not.toContain('Retraso logístico');
  }));

  it('should classify delayed logistic dates', fakeAsync(() => {
    getByIdSpy.and.returnValue(of(createShipment({ logisticDates: { etd: '2026-01-01', atd: '2026-01-03', eta: '2026-01-05', ata: null } })));
    setQueryParams({ tab: 'dates' });
    fixture = TestBed.createComponent(ShipmentDetail);
    render();

    expect(getText()).toContain('Retrasado');
    expect(getText()).toContain('Pendiente');
  }));

  it('should show container not applicable for air shipments', fakeAsync(() => {
    getByIdSpy.and.returnValue(of(createShipment({ transportMode: 'AIR', container: undefined })));
    setQueryParams({ tab: 'container' });
    fixture = TestBed.createComponent(ShipmentDetail);
    render();

    expect(getText()).toContain('No aplica para esta operación.');
  }));

  it('should show empty financial section when financial data is absent', fakeAsync(() => {
    getByIdSpy.and.returnValue(of(createShipment({ financialInfo: { advancePayment: null, invoice: null } })));
    setQueryParams({ tab: 'financial' });
    fixture = TestBed.createComponent(ShipmentDetail);
    render();

    expect(getText()).toContain('Sin información financiera disponible.');
  }));

  it('should render currency format consistently', fakeAsync(() => {
    setQueryParams({ tab: 'financial' });
    render();

    expect(getText()).toContain('US$');
    expect(getText()).toContain('1.980');
  }));

  function render(): void {
    fixture.detectChanges();
    tick();
    fixture.detectChanges();
  }

  function setQueryParams(params: Record<string, string>): void {
    querySubject.next(convertToParamMap(params));
    tick();
    fixture.detectChanges();
  }

  function getText(): string {
    return (fixture.nativeElement as HTMLElement).textContent ?? '';
  }

  function clickButton(label: string): void {
    const button = Array.from(fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>).find((item) =>
      item.textContent?.includes(label),
    );
    if (!button) {
      throw new Error(`No se encontró el botón ${label}`);
    }
    button.click();
  }
});

interface ShipmentInput extends Partial<Omit<Shipment, 'logisticDates' | 'financialInfo'>> {
  logisticDates?: Partial<LogisticDates>;
  financialInfo?: ShipmentFinancialInfo;
}

function createShipment(input: ShipmentInput = {}): Shipment {
  return {
    id: 'shipment-001',
    documentNumber: 'AWB-001',
    operationType: 'IMPO',
    transportMode: 'AIR',
    status: 'IN_TRANSIT',
    client: 'Enka',
    provider: 'Global Freight Logistics S.A.S.',
    incoterm: 'DAP',
    origin: { country: 'México', city: 'Ciudad de México', terminal: null },
    destination: { country: 'Colombia', city: 'Bogotá', terminal: null },
    merchandiseDescription: 'Textiles',
    cargoType: 'LCL',
    packages: 12,
    weightKg: 450,
    volumeM3: 7.5,
    carrier: 'Avianca Cargo',
    logisticDates: {
      originWarehouse: '2026-01-01',
      etd: '2026-01-02',
      atd: '2026-01-02',
      eta: '2026-01-05',
      ata: '2026-01-05',
      destinationWarehouse: '2026-01-06',
      nationalization: '2026-01-07',
      dispatch: '2026-01-08',
      planilla: '2026-01-09',
      delivery: null,
      ...input.logisticDates,
    },
    container: undefined,
    financialInfo: input.financialInfo ?? {
      advancePayment: { requestedAt: '2026-01-01', paidAt: '2026-01-02', amount: 1200 },
      invoice: {
        providerInvoice: 'FP-001',
        tccInvoice: 'FT-001',
        invoiceNumber: 'FAC-001',
        invoiceDate: '2026-01-10',
        expenseDescription: 'Flete internacional',
        expenseValue: 1500,
        subtotal: 1980,
        tax: 376.2,
        total: 2356.2,
      },
    },
    documents: [],
    events: [],
    issue: null,
    progress: 50,
    nextStop: 'Aduana destino',
    ...input,
  };
}
