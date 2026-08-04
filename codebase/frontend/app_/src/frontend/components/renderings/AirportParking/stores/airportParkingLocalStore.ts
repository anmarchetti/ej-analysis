import { HolidaysRootStore } from 'frontend/store/holidays/HolidaysRootStore';
import { AirportParkingTrackingStore } from 'frontend/store/holidays/tracking/AirportParkingTrackingStore';
import { createLocalStore } from 'frontend/utils/createLocalStore';

interface ILocalStore {
    tracking: AirportParkingTrackingStore;
}

export const [withAirportParkingLocalStore, useAirportParkingLocalStore] = createLocalStore<ILocalStore, void>(
    (rootStore: HolidaysRootStore) => ({
        tracking: new AirportParkingTrackingStore(rootStore),
    }),
);
