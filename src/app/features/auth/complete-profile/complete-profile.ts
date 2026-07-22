import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { switchMap, take, throwError } from 'rxjs';

import { Auth0FacadeService } from '../../../core/services/auth0-facade.service';
import { MockUserProfileService } from '../../../mocks/services/mock-user-profile.service';

@Component({
  selector: 'app-complete-profile',
  imports: [
    AsyncPipe,
    MatButtonModule,
    MatCardModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
  ],
  templateUrl: './complete-profile.html',
  styleUrl: './complete-profile.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CompleteProfile {
  private readonly auth0Facade = inject(Auth0FacadeService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly formBuilder = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly userProfileService = inject(MockUserProfileService);

  protected readonly user$ = this.auth0Facade.user$;
  protected errorMessage = '';
  protected isSubmitting = false;
  protected readonly form = this.formBuilder.nonNullable.group({
    fullName: ['', [Validators.required, Validators.minLength(3)]],
    company: ['', [Validators.required, Validators.minLength(2)]],
    phone: [''],
    acceptedDataPolicy: [false, [Validators.requiredTrue]],
  });

  protected submit(): void {
    if (this.form.invalid || this.isSubmitting) {
      this.form.markAllAsTouched();
      return;
    }

    this.errorMessage = '';
    this.isSubmitting = true;
    const { acceptedDataPolicy, company, fullName, phone } = this.form.getRawValue();

    this.auth0Facade.user$
      .pipe(
        take(1),
        switchMap((identity) => {
          if (!identity) {
            return throwError(() => new Error('No fue posible leer la identidad autenticada de Auth0.'));
          }

          return this.userProfileService.createProfileFromForm(identity, {
            fullName: fullName.trim(),
            company: company.trim(),
            phone: phone.trim() || null,
            acceptedDataPolicy: acceptedDataPolicy as true,
          });
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.isSubmitting = false;
          void this.router.navigate(['/dashboard']);
        },
        error: (error: Error) => {
          this.isSubmitting = false;
          this.errorMessage = error.message;
        },
      });
  }
}
