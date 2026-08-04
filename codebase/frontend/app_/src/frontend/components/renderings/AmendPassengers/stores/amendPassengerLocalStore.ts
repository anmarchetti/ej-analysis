import { HolidaysRootStore } from 'frontend/store/holidays/HolidaysRootStore';
import { AmendPassengersTrackingStore } from 'frontend/store/holidays/tracking/AmendPassengersTrackingStore/AmendPassengersTrackingStore';
import { createLocalStore } from 'frontend/utils/createLocalStore';

interface ILocalStore {
    tracking: AmendPassengersTrackingStore;
}

export const [withAmendPassengersLocalStore, useAmendPassengersLocalStore] = createLocalStore<ILocalStore, void>(
    (rootStore: HolidaysRootStore) => ({
        tracking: new AmendPassengersTrackingStore(rootStore.trackingStore),
    }),
);
