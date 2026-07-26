import { StatusMode } from './food';

export interface AppSettings {
  statusMode: StatusMode;
}

export const DEFAULT_APP_SETTINGS: AppSettings = {
  statusMode: '3step',
};
