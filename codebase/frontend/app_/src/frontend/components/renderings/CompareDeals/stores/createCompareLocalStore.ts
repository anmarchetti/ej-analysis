import { HolidaysRootStore } from 'frontend/store/holidays/HolidaysRootStore';
import { createLocalStore } from 'frontend/utils/createLocalStore';

import { CompareStore } from './CompareStore';

export const [withCompareStore, useCompareStore] = createLocalStore<CompareStore, Record<string, never>>(
    (rootStore: HolidaysRootStore) => new CompareStore(rootStore),
    { isLocalForPage: true },
);
