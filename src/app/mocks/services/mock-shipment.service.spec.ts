import { TestBed } from '@angular/core/testing';

import { MockShipmentService } from './mock-shipment.service';

describe('MockShipmentService', () => {
  let service: MockShipmentService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MockShipmentService);
  });

  it('should return up to 10 mock shipments', (done) => {
    service.getShipments().subscribe((shipments) => {
      expect(shipments.length).toBeGreaterThan(0);
      expect(shipments.length).toBeLessThanOrEqual(10);
      done();
    });
  });

  it('should return a shipment by id', (done) => {
    service.getShipmentById('shipment-001').subscribe((shipment) => {
      expect(shipment?.documentNumber).toBe('HBL-J8GOSD3M');
      done();
    });
  });
});
