import { HolidaysRootStore } from 'frontend/store/holidays/HolidaysRootStore';
import { AmendEventActions, AmendEventLabels } from 'models/data/tracking/AmendEvent';
import { EventTypes } from 'models/enum/tracking/EventTypes';
import { EventCategories } from 'models/enum/tracking/GenericEventParams';

export class TrackingChangeFeeStore {
    constructor(public rootStore: HolidaysRootStore) {}

    getAmendEventAction = (): AmendEventActions | string => {
        if (this.rootStore.layoutStore.isAmendFlightsPage) {
            return AmendEventActions.ChangeFlight;
        }

        if (this.rootStore.layoutStore.isAmendDatesSummaryPage) {
            return AmendEventActions.ChangeDates;
        }

        if (this.rootStore.layoutStore.isAmendRoomAndBoardPage) {
            return AmendEventActions.ChangeBoard;
        }

        return '';
    };

    changeFeeBannerAppearedAction = (feePrice?: number): void => {
        if (!feePrice) return;

        const coreParams = this.rootStore.trackingStore.buildCoreParamsObject();
        const customParams = this.rootStore.trackingStore.generateGenericValuesWithGuests({
            genericValue1: feePrice,
            genericValue2: null,
            destinationUrl: null,
        });
        const eventAction = this.getAmendEventAction();

        // Check session storage
        const sessionStorageKey = `fee_amend_${eventAction}_${customParams.genericValue4}`;
        const wasBannerViewed = sessionStorage.getItem(sessionStorageKey);

        if (!coreParams || !eventAction || wasBannerViewed) return;

        sessionStorage.setItem(sessionStorageKey, 'TRUE');
        this.rootStore.trackingStore.addToDataLayer({
            event: EventTypes.GenericEvent,
            coreParams: {
                ...coreParams,
                pageName: `${coreParams.pageCategory}: ${coreParams.pageName}`,
            },
            customParams,
            eventParams: {
                eventCategory: EventCategories.Holidays,
                eventAction,
                eventLabel: AmendEventLabels.ChangeFeesBanner,
                eventType: EventTypes.NonInteraction,
            },
        });
    };
}
