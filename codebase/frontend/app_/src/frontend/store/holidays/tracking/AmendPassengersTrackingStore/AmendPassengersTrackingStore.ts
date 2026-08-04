import TrackingStore from 'frontend/store/holidays/tracking/TrackingStore';
import { getTimestamp } from 'frontend/utils/tracking/tracking.utils';
import { ICustomParams } from 'models/data/tracking/IEventWithParams';
import { EventTypes } from 'models/enum/tracking/EventTypes';
import { EventActions, EventCategories } from 'models/enum/tracking/GenericEventParams';

export class AmendPassengersTrackingStore {
    private addToDataLayer: TrackingStore['addToDataLayer'];
    private buildCoreParamsObject: TrackingStore['buildCoreParamsObject'];
    private getPageLoadObject: TrackingStore['getPageLoadObject'];

    constructor(trackingStore: TrackingStore) {
        this.addToDataLayer = trackingStore.addToDataLayer;
        this.getPageLoadObject = trackingStore.getPageLoadObject;
        this.buildCoreParamsObject = trackingStore.buildCoreParamsObject;
    }

    private getEventParams(params: Record<string, string>) {
        return {
            eventCategory: EventCategories.Holidays,
            eventAction: EventActions.ViewBooking,
            eventType: EventTypes.Interaction,
            ...params,
        };
    }

    private getErrorParams({
        errorCode,
        errorMessage,
    }: {
        errorCode: Nullable<number>;
        errorMessage: Nullable<string>;
    }) {
        return {
            event: EventTypes.ErrorMessage,
            dimension13: getTimestamp(),
            dimension86: errorCode,
            dimension87: errorMessage,
            dimension136: this.getPageLoadObject()?.pageName,
        };
    }

    private pushErrorEvent(errorMessage: Nullable<string>, errorCode: Nullable<number>) {
        this.addToDataLayer(this.getErrorParams({ errorCode, errorMessage }));
    }

    private pushSRToDataLayer = (customParams: ICustomParams, eventParams: Record<string, string>) => {
        const coreParams = this.buildCoreParamsObject();
        this.addToDataLayer({ event: EventTypes.GenericEvent, coreParams, customParams, eventParams });
    };

    clickToAmendPassengerPageLink(bookingReference: string) {
        const eventParams = this.getEventParams({
            eventLabel: 'Edit Passenger Details',
        });
        const customParams = {
            genericValue1: null,
            genericValue2: null,
            genericValue3: null,
            genericValue4: bookingReference,
        };
        this.pushSRToDataLayer(customParams, eventParams);
    }

    clickToEditPassenger(bookingReference: string) {
        this.clickToAmendPassengerPageLink(bookingReference);
    }

    onSavePassengerDetails(bookingReference: string, charactersCount: number) {
        const eventParams = this.getEventParams({
            eventLabel: 'Save Passenger Details',
        });
        const customParams = {
            genericValue1: `${charactersCount} Characters`,
            genericValue2: 'Free',
            genericValue3: null,
            genericValue4: bookingReference,
        };
        this.pushSRToDataLayer(customParams, eventParams);
    }

    onShowExceedCharactersCountError(errorMessage: string) {
        const validationParams = {
            event: EventTypes.ValidationMessage,
            dimension13: getTimestamp(),
            dimension93: 'Change Name: Character Limited Exceeded',
            dimension94: errorMessage,
            dimension136: this.getPageLoadObject()?.pageName,
        };

        this.addToDataLayer(validationParams);
    }

    onCommitPassengersNameChangeError(errorMessage: string, errorCode: Nullable<number>) {
        this.pushErrorEvent(errorMessage, errorCode);
    }

    onUnSavedPassengerNotify(errorMessage: string) {
        this.pushErrorEvent(errorMessage, null);
    }
}
