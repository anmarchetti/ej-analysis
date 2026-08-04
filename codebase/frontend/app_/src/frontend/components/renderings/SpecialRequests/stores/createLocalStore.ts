import { HolidaysRootStore } from 'frontend/store/holidays/HolidaysRootStore';
import { SpecialRequestsTrackingStore } from 'frontend/store/holidays/tracking/SpecialRequestsTrackingStore';
import { createLocalStore } from 'frontend/utils/createLocalStore';

interface ILocalStore {
    tracking: SpecialRequestsTrackingStore;
    hideAction?: boolean;
}

export const [withSRLocalStore, useSRLocalStore] = createLocalStore<ILocalStore, void>(
    (rootStore: HolidaysRootStore) => ({
        tracking: new SpecialRequestsTrackingStore(rootStore.trackingStore),
        hideAction: rootStore.viewBookingStore.hasBookingAtcomError,
    }),
);
