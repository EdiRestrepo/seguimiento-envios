import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { Auth0FacadeService } from '../../../core/services/auth0-facade.service';
import { MockUserProfileService } from '../../../mocks/services/mock-user-profile.service';
import { CompleteProfile } from './complete-profile';

interface CompleteProfileTestComponent {
  form: CompleteProfile['form'];
  submit: () => void;
}

describe('CompleteProfile', () => {
  let component: CompleteProfileTestComponent;
  let fixture: ComponentFixture<CompleteProfile>;
  let createProfileFromFormSpy: jasmine.Spy;

  beforeEach(async () => {
    createProfileFromFormSpy = jasmine.createSpy('createProfileFromForm').and.returnValue(
      of({
        auth0UserId: 'auth0|123',
        fullName: 'Cliente Demo',
        company: 'Empresa Demo',
        email: 'cliente@demo.com',
        role: 'CLIENT',
        profileCompleted: true,
      }),
    );

    await TestBed.configureTestingModule({
      imports: [CompleteProfile, NoopAnimationsModule, ReactiveFormsModule],
      providers: [
        provideRouter([]),
        {
          provide: Auth0FacadeService,
          useValue: {
            user$: of({
              auth0UserId: 'auth0|123',
              email: 'cliente@demo.com',
              name: 'Cliente Demo',
            }),
          },
        },
        {
          provide: MockUserProfileService,
          useValue: {
            createProfileFromForm: createProfileFromFormSpy,
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CompleteProfile);
    component = fixture.componentInstance as unknown as CompleteProfileTestComponent;
    fixture.detectChanges();
  });

  it('should require full name, company and data policy', () => {
    component.form.markAllAsTouched();

    expect(component.form.controls.fullName.hasError('required')).toBeTrue();
    expect(component.form.controls.company.hasError('required')).toBeTrue();
    expect(component.form.controls.acceptedDataPolicy.hasError('required')).toBeTrue();
  });

  it('should save complementary profile when form is valid', () => {
    component.form.patchValue({
      acceptedDataPolicy: true,
      company: 'Empresa Demo',
      fullName: 'Cliente Demo',
      phone: '',
    });

    component.submit();

    expect(createProfileFromFormSpy).toHaveBeenCalledWith(
      jasmine.objectContaining({
        auth0UserId: 'auth0|123',
      }),
      jasmine.objectContaining({
        company: 'Empresa Demo',
        fullName: 'Cliente Demo',
        phone: null,
      }),
    );
  });
});
