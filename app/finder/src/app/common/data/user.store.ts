import { signalStore } from '@ngrx/signals';
import { withAuthFeature } from './user-auth.feature';
import { withProfileFeature } from './user-profile.feature';

export const UserStore = signalStore(
  { providedIn: 'root' },
  withAuthFeature(),
  withProfileFeature(),
);
