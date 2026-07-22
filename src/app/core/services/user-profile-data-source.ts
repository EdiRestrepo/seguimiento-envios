import { Observable } from 'rxjs';

import { Auth0Identity, PendingUserProfile, UserProfile } from '../models/user-profile.model';

export interface UserProfileDataSource {
  getProfileByAuth0Id(auth0UserId: string): Observable<UserProfile | null>;
  saveProfile(profile: UserProfile): Observable<UserProfile>;
  savePendingRegistration(profile: PendingUserProfile): Observable<PendingUserProfile>;
  getPendingRegistration(): Observable<PendingUserProfile | null>;
  clearPendingRegistration(): Observable<void>;
  completeProfileFromIdentity(identity: Auth0Identity): Observable<UserProfile | null>;
}
