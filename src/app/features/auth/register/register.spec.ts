import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { AuthSessionService } from '../../../core/services/auth-session.service';
import { MockUserProfileService } from '../../../mocks/services/mock-user-profile.service';
import { Register } from './register';

interface RegisterTestComponent {
  form: Register['form'];
  submit: () => void;
}

describe('Register', () => {
  let component: RegisterTestComponent;
  let fixture: ComponentFixture<Register>;
  let registerSpy: jasmine.Spy;
  let savePendingRegistrationSpy: jasmine.Spy;

  beforeEach(async () => {
    registerSpy = jasmine.createSpy('register').and.returnValue(of(undefined));
    savePendingRegistrationSpy = jasmine.createSpy('savePendingRegistration').and.returnValue(of({}));

    await TestBed.configureTestingModule({
      imports: [NoopAnimationsModule, ReactiveFormsModule, Register],
      providers: [
        provideRouter([]),
        {
          provide: AuthSessionService,
          useValue: {
            authorizationUrl: () => null,
            clearAuthorizationUrl: jasmine.createSpy('clearAuthorizationUrl'),
            register: registerSpy,
          },
        },
        {
          provide: MockUserProfileService,
          useValue: {
            savePendingRegistration: savePendingRegistrationSpy,
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Register);
    component = fixture.componentInstance as unknown as RegisterTestComponent;
    fixture.detectChanges();
  });

  it('should require full name, company, email and data policy', () => {
    component.form.markAllAsTouched();

    expect(component.form.controls.fullName.hasError('required')).toBeTrue();
    expect(component.form.controls.company.hasError('required')).toBeTrue();
    expect(component.form.controls.email.hasError('required')).toBeTrue();
    expect(component.form.controls.acceptedDataPolicy.hasError('required')).toBeTrue();
  });

  it('should reject invalid email', () => {
    component.form.controls.email.setValue('correo-invalido');

    expect(component.form.controls.email.hasError('email')).toBeTrue();
  });

  it('should keep phone optional', () => {
    component.form.patchValue({
      acceptedDataPolicy: true,
      company: 'Empresa Demo',
      email: 'nuevo@demo.com',
      fullName: 'Nuevo Cliente',
      phone: '',
    });

    expect(component.form.valid).toBeTrue();
  });

  it('should not start signup when form is invalid', () => {
    component.submit();

    expect(savePendingRegistrationSpy).not.toHaveBeenCalled();
    expect(registerSpy).not.toHaveBeenCalled();
  });

  it('should preserve pending profile and start Auth0 signup', () => {
    component.form.patchValue({
      acceptedDataPolicy: true,
      company: 'Empresa Demo',
      email: 'nuevo@demo.com',
      fullName: 'Nuevo Cliente',
      phone: '3001234567',
    });

    component.submit();

    expect(savePendingRegistrationSpy).toHaveBeenCalledWith(
      jasmine.objectContaining({
        company: 'Empresa Demo',
        email: 'nuevo@demo.com',
        fullName: 'Nuevo Cliente',
        phone: '3001234567',
      }),
    );
    expect(registerSpy).toHaveBeenCalledWith('nuevo@demo.com');
  });
});
